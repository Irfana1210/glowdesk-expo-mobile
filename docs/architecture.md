# RetailOS architecture

This document explains how the RetailOS code is organised and how data moves through it. It is for engineers reading or extending the codebase. The original design mockup is [designs.png](designs.png).

## Principles

- **Feature-based modules.** Each business area (orders, inventory, roster, labour, dashboard, settings) owns its domain rules, state, components and screens in one folder under `src/features/`.
- **Business rules are pure functions.** Every rule lives in a `domain/` folder with no React, storage or network code. Screens and stores call these functions. They never re-implement a rule.
- **Routes are thin.** Files in `src/app/` only map a URL to a feature screen, so navigation can change without touching feature code.
- **Server state and local state are kept apart.** Read-only data that will come from the backend (sales, inventory) goes through TanStack Query. Data the user edits on the device (orders, shifts, preferences) lives in persisted Zustand stores until the backend and offline queue exist.

## Folder structure

```text
RetailOS/
├── src/
│   ├── app/                         Expo Router routes (thin files only)
│   │   ├── _layout.tsx              Root stack, fonts, splash, QueryClient and safe-area providers
│   │   ├── index.tsx                Redirects to /dashboard (demo mode, no sign-in)
│   │   ├── +not-found.tsx
│   │   ├── (tabs)/                  Bottom tabs: dashboard, orders, roster, inventory, more
│   │   ├── orders/                  [id] details, scan, complete
│   │   ├── inventory/               [id] product details, scan
│   │   ├── roster/shift.tsx         Shift editor (?date= to add, ?shiftId= to edit)
│   │   └── more/                    labour, settings
│   │
│   ├── features/
│   │   ├── orders/
│   │   │   ├── api/                 Mock orders API with simulated latency
│   │   │   ├── domain/              orderStateMachine (transitions, canMarkReady), picking (scan rules)
│   │   │   ├── store/               useOrdersStore (Zustand, persisted)
│   │   │   ├── hooks/               useEnsureOrdersLoaded (deep-link safe loading)
│   │   │   ├── components/          OrderCard, OrderItemRow, OrderStatusBadge
│   │   │   └── screens/             OrderList, OrderDetails, BarcodeScanner, OrderCompletion
│   │   ├── dashboard/
│   │   │   ├── api/                 Mock sales API
│   │   │   ├── domain/kpis.ts       Achievement %, average transaction value, labour % (safe division)
│   │   │   ├── hooks/               useStoreSalesSummary (TanStack Query)
│   │   │   ├── components/          SalesChart, QuickActions
│   │   │   └── screens/             DashboardScreen
│   │   ├── inventory/
│   │   │   ├── api/                 Mock inventory API
│   │   │   ├── domain/stock.ts      Stock status, search, filters, barcode lookup
│   │   │   ├── hooks/               useInventory (TanStack Query)
│   │   │   ├── components/          ProductCard
│   │   │   └── screens/             Inventory, ProductDetails, InventoryScan
│   │   ├── roster/
│   │   │   ├── domain/              dates (Monday weeks, DST-safe), shifts (validation, coverage), shiftForm (Zod)
│   │   │   ├── store/               useRosterStore (Zustand, persisted)
│   │   │   ├── components/          ShiftCard, WeekNavigator, WeekDaySelector
│   │   │   └── screens/             Roster, ShiftEditor
│   │   ├── labour/
│   │   │   ├── domain/labour.ts     Effective-dated pay rates, shift cost, weekly summary
│   │   │   └── screens/             LabourScreen
│   │   ├── employees/types.ts       Employee, roles, employment types (shared by roster and labour)
│   │   ├── settings/                Preferences store, SettingsScreen
│   │   └── session/                 Demo session role (fixed to Manager; gates pay information)
│   │
│   ├── components/
│   │   ├── ui/                      Design-system components: AppText, buttons, KPICard, StatusBadge,
│   │   │                            FilterChips, SearchBar, SelectField, TextField, ProgressBar,
│   │   │                            Loading/Empty/ErrorState, InlineBanner, ConfirmationModal, ...
│   │   ├── layout/                  Screen, AppHeader
│   │   └── scanner/                 BarcodeCamera, ManualBarcodeEntry (used by orders and inventory)
│   ├── database/storage.ts          On-device persistence (expo-sqlite key-value store) and storage keys
│   ├── hooks/                       Cross-feature hooks (useAppStateFocusManager)
│   ├── lib/                         Pure helpers: formatting, barcodes, QueryClient factory
│   ├── mocks/                       Fictional store, products, orders, inventory, sales, staff, shifts, pay rates
│   ├── theme/                       Colour, typography and spacing tokens
│   └── types/                       Shared domain types (orders, products)
│
├── __tests__/                       Jest tests, mirroring src/ (e.g. __tests__/features/orders/domain/...)
│   └── utils/                       Shared test helpers, imported as @test/*
├── docs/
│   ├── architecture.md              This document
│   └── designs.png                  Original design mockup
├── assets/                          App icon and splash images
├── jest.setup.ts                    Pins the Australia/Melbourne timezone; mocks native-only modules
└── app.json, package.json, tsconfig.json, eslint.config.js
```

## Layers and dependencies

Dependencies point one way: screens depend on stores and hooks, which depend on domain functions, which depend only on types and pure helpers.

```text
src/app (routes)
  → features/*/screens  →  features/*/components  →  components/ui, components/layout
        ↓
  features/*/store (Zustand)   features/*/hooks (TanStack Query)
        ↓                              ↓
  features/*/domain (pure rules)   features/*/api (mock today, Supabase later)
        ↓
  types, lib, theme
```

- Domain modules never import React, stores or storage.
- `components/ui` never imports from `features/`.
- A feature may import another feature's domain functions or types, for example labour uses the roster's shift rules. It does not reach into another feature's screens.

## State

| Data                        | Where it lives                   | Why                                                                              |
| --------------------------- | -------------------------------- | -------------------------------------------------------------------------------- |
| Orders and picking progress | `useOrdersStore`, persisted      | Edited on the device. Must survive a restart (brief §19).                        |
| Shifts                      | `useRosterStore`, persisted      | Managers add, edit and remove shifts locally until the backend exists.           |
| Preferences                 | `usePreferencesStore`, persisted | Device-level settings.                                                           |
| Sales summary, inventory    | TanStack Query                   | Read-only server data. Caching, retries and refetch on foreground come for free. |
| Demo role                   | `useSessionStore`, in memory     | Fixed to Manager. Gates the pay information on the labour screen.                |

Every store write goes through the domain rules first, so a store can never hold an invalid order transition or shift.

## Persistence

`src/database/storage.ts` provides one JSON storage adapter over `expo-sqlite`'s key-value store, used by all three persisted stores. SQLite is already in the brief's stack for the offline mutation queue (brief §10), so no extra dependency was needed.

- Saved records are type-checked on load, and malformed ones are dropped rather than trusted.
- Orders merge by `version` when saved and fetched copies meet, so newer local progress is never overwritten.
- Storage keys are fixed in `STORAGE_KEYS`. Renaming one without a migration would silently discard data on users' devices.

## Testing

- Tests live in `__tests__/`, mirroring the `src/` path of the code they cover, and import code through the `@/` alias.
- Domain functions have unit tests, including zero-value, overnight and daylight-saving cases.
- Screens have component tests with React Native Testing Library. Expo Router, the camera and SQLite storage are mocked. Mock APIs are replaced per test, so loading, empty and error states are exercised.
- Jest runs in the Australia/Melbourne timezone, set in `jest.setup.ts`, so date maths is checked the same way on every machine.

Run everything with `npm run check`, which runs the type check, lint and tests.

## Moving to a real backend

Each `api/` module is the seam for Supabase. When it arrives:

1. Replace the mock `api/` functions with Supabase queries. Screens do not change.
2. Move orders from Zustand to TanStack Query, with mutations for start picking, scan and mark ready.
3. Enforce the same domain rules on the server, atomically, with version checks.
4. Add the offline mutation queue to `src/database/` as described in brief §10.
5. Replace the demo session with Supabase Auth, and protect pay rates with Row Level Security.
