# RetailOS architecture

This document explains how the RetailOS code is organised and how data moves through it. It is for engineers reading or extending the codebase. The design handoff is in [DESIGN_HANDOFF.md](DESIGN_HANDOFF.md) with mockups in [screens/](screens/), and the coding standards in [coding-standards.md](coding-standards.md).

## Principles

- **Feature-based modules.** Each business area (orders, inventory, roster, labour, dashboard, settings) owns its domain rules, state, components and screens in one folder under `src/features/`.
- **Business rules are pure functions.** Every rule lives in a `domain/` folder with no React, storage or network code. Screens and stores call these functions. They never re-implement a rule.
- **Routes are thin.** Files in `src/app/` only map a URL to a feature screen, so navigation can change without touching feature code.
- **Server state and local state are kept apart.** Read-only data that will come from the backend (sales, inventory) goes through TanStack Query. Data the user edits on the device (orders, shifts, preferences) lives in persisted Zustand stores until the backend and offline queue exist.

## Folder structure

```text
RetailOS/
├── src/
│   ├── app/                         Expo Router routes (thin files only, default-export a screen)
│   │   ├── _layout.tsx              Root stack, fonts, splash, QueryClient, safe area, toasts
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
│   │   │   ├── services/            OrdersService (mock, simulated latency)
│   │   │   ├── domain/              OrderStateMachine, PickingUtils, ScheduleUtils, AssignmentUtils
│   │   │   ├── store/               orders.store.ts: useOrdersStore (Zustand, persisted)
│   │   │   ├── hooks/               use-ensure-orders-loaded (deep-link safe loading)
│   │   │   ├── components/          order-list-card, order-status-badge
│   │   │   ├── screens/             order-list, order-details, barcode-scanner, order-completion
│   │   │   └── presentation.ts      OrderPresentationUtils: card and label text, pure
│   │   ├── dashboard/
│   │   │   ├── services/            SalesService (mock)
│   │   │   ├── domain/              KpiUtils (safe division), AttentionUtils, ShiftCardUtils
│   │   │   ├── hooks/               use-store-sales-summary (useSafeQuery)
│   │   │   ├── components/          sales-chart
│   │   │   └── screens/             dashboard
│   │   ├── inventory/
│   │   │   ├── services/            InventoryService (mock)
│   │   │   ├── domain/stock.ts      StockUtils: status, search, filters, barcode lookup
│   │   │   ├── hooks/               use-inventory (useSafeQuery)
│   │   │   ├── components/          product-card
│   │   │   └── screens/             inventory, product-details, inventory-scan
│   │   ├── roster/
│   │   │   ├── domain/              DateUtils (Monday weeks, DST-safe), ShiftUtils (validation, coverage),
│   │   │   │                        CoverUtils (floor cover, breaks), ShiftFormUtils (zod)
│   │   │   ├── store/               roster.store.ts: useRosterStore (Zustand, persisted)
│   │   │   ├── components/          week-navigator, week-day-selector, floor-cover-chart
│   │   │   └── screens/             roster, shift-editor
│   │   ├── labour/
│   │   │   ├── domain/labour.ts     LabourUtils: effective-dated pay rates, shift cost, weekly summary
│   │   │   └── screens/             labour
│   │   ├── employees/types.ts       Employee, roles, employment types (shared by roster and labour)
│   │   ├── settings/                preferences.store.ts, settings screen
│   │   └── session/                 session.store.ts: demo role (fixed to Manager; gates pay information)
│   │   (each folder has sibling __tests__/ with *.spec.ts(x))
│   │
│   ├── components/
│   │   ├── ui/                      Design-system components, one kebab-case file each (no barrel)
│   │   ├── layout/                  screen, app-header
│   │   └── scanner/                 barcode-camera, manual-barcode-entry (used by orders and inventory)
│   ├── constants/                   locale.ts (LOCALE copy), primitives.ts (time units, platform flags)
│   ├── hooks/                       use-now; query/ holds use-safe-query and use-app-state-focus
│   ├── mocks/                       Fictional store, products, orders, inventory, sales, staff, shifts, pay rates
│   ├── services/cache-keys/         TanStack Query cache keys
│   ├── theme/                       Colour, typography and spacing tokens
│   ├── types/                       Shared domain types (orders, products) and enums (StaleTimeMs, MessageType)
│   └── utils/                       FormatUtils, BarcodeUtils, storage (expo-sqlite), query-client,
│                                    handle-api-error, success-handler, toast-config, ReportingUtils
│
├── test/utils/                      Shared test helpers, imported as @test/*
├── __mocks__/                       Jest manual mocks for native modules (expo-sqlite kv-store)
├── docs/                            This document, the design handoff and screen mockups
├── learnings/                       Bugs that passed a correct-looking test suite
├── scripts/plugins/eslint/          Custom ESLint rules
├── .github/workflows/checks.yml     CI: typecheck, format, lint, spelling, knip, tests
└── jest.config.js, jest.setup.ts    Jest config; pins the Australia/Melbourne timezone
```

## Layers and dependencies

Dependencies point one way: screens depend on stores and hooks, which depend on domain functions, which depend only on types and pure helpers.

```text
src/app (routes)
  → features/*/screens  →  features/*/components  →  components/ui, components/layout
        ↓
  features/*/store (Zustand)   features/*/hooks (TanStack Query)
        ↓                              ↓
  features/*/domain (pure rules)   features/*/services (mock today, Supabase later)
        ↓
  types, utils, constants, theme
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

`src/utils/storage.ts` provides one JSON storage adapter over `expo-sqlite`'s key-value store, used by all three persisted stores. SQLite is already in the brief's stack for the offline mutation queue (brief §10), so no extra dependency was needed.

- Saved records are type-checked on load, and malformed ones are dropped rather than trusted.
- Orders merge by `version` when saved and fetched copies meet, so newer local progress is never overwritten.
- Storage keys are fixed in `STORAGE_KEYS`. Renaming one without a migration would silently discard data on users' devices.

## Testing

- Specs live next to the code in a sibling `__tests__/` folder (`*.spec.ts(x)`) and import code through the `@/` alias.
- Domain functions have unit tests, including zero-value, overnight and daylight-saving cases.
- Screens have component tests with React Native Testing Library. Expo Router, the camera and SQLite storage are mocked. Mock APIs are replaced per test, so loading, empty and error states are exercised.
- Jest runs in the Australia/Melbourne timezone, set in `jest.setup.ts`, so date maths is checked the same way on every machine.

Run everything with `npm run check`: format, lint, type check, spelling, knip and tests. CI and the pre-commit hook run the same gates.

## Moving to a real backend

Each `services/` namespace is the seam for Supabase. When it arrives:

1. Replace the mock service functions with Supabase queries. Screens do not change.
2. Move orders from Zustand to TanStack Query, with mutations for start picking, scan and mark ready.
3. Enforce the same domain rules on the server, atomically, with version checks.
4. Add the offline mutation queue next to `src/utils/storage.ts` as described in brief §10.
5. Replace the demo session with Supabase Auth, and protect pay rates with Row Level Security.
