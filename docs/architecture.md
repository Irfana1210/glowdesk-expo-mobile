# Glowdesk architecture

This document explains how the Glowdesk code is organised and how data moves through it. It is for engineers reading or extending the codebase. The coding standards are in [coding-standards.md](coding-standards.md).

## Principles

- **Feature-based modules.** Each business area (auth, orders, inventory, roster, labour, dashboard, settings) owns its domain rules, state, components and screens in one folder under `src/features/`.
- **Business rules are pure functions.** Every rule lives in a `domain/` folder with no React, storage or network code. Screens and stores call these functions. They never re-implement a rule.
- **Routes are thin.** Files in `src/app/` only map a URL to a feature screen, so navigation can change without touching feature code.
- **Server state and local state are kept apart.** Everything the server owns (orders, shifts, staff, pay rates, sales, inventory) goes through TanStack Query, with mutations for changes. Device-only state (the session, preferences and the simulated network switches) lives in persisted Zustand stores.
- **Works offline.** Picking and roster changes show straight away, wait in a saved queue while offline, and sync in order when the connection returns.

## Folder structure

```text
Glowdesk/
├── src/
│   ├── app/                         Expo Router routes (thin files only, default-export a screen)
│   │   ├── _layout.tsx              Root stack, fonts, splash, saved QueryClient, online state, safe area,
│   │   │                            toasts, route guards (Stack.Protected) for signed-in and signed-out screens
│   │   ├── index.tsx                Redirects to /dashboard when signed in, otherwise /sign-in
│   │   ├── sign-in.tsx              Sign-in screen (only reachable while signed out)
│   │   ├── +not-found.tsx
│   │   ├── (tabs)/                  Bottom tabs: dashboard, orders, roster, inventory, more
│   │   ├── orders/                  [id] details, scan, complete
│   │   ├── inventory/               [id] product details, scan
│   │   ├── roster/shift.tsx         Shift editor (?date= to add, plus ?start= for a cover shift;
│   │   │                            ?shiftId= to edit)
│   │   └── more/                    labour, settings
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── services/            AuthService: signIn, signOut (mock, checks the demo credentials)
│   │   │   ├── domain/              AuthUtils (expiry, pay-information gating, staff ID format),
│   │   │   │                        SignInFormUtils (zod schema)
│   │   │   ├── store/               session.store.ts: useSessionStore (Zustand, persisted)
│   │   │   ├── hooks/               use-sign-in (useSafeMutation), use-session-bootstrap
│   │   │   ├── components/          brand-mark, pattern-backdrop, quick-sign-in-card
│   │   │   ├── screens/             sign-in
│   │   │   └── types.ts             Session, SignInInput, SessionStatus
│   │   ├── orders/
│   │   │   ├── services/            OrdersService: fetchOrders, updateOrder (calls the mock server)
│   │   │   ├── domain/              OrderStateMachine, PickingUtils, ScheduleUtils, AssignmentUtils,
│   │   │   │                        OrderCommandUtils (one command per change, shared with the server)
│   │   │   ├── hooks/               use-orders (useSafeQuery), use-order-actions (optimistic, queued),
│   │   │   │                        order-mutations (registered by key), use-pending-order-ids
│   │   │   ├── components/          order-list-card, order-status-badge
│   │   │   ├── screens/             order-list, order-details, barcode-scanner, order-completion
│   │   │   ├── presentation.ts      OrderPresentationUtils: card and label text, pure
│   │   │   └── order-status-meta.ts Badge label, icon and tone for each order status
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
│   │   │   ├── services/            RosterService: fetch, create, update, delete shifts
│   │   │   ├── hooks/               use-shifts, use-shift-actions (optimistic, queued), shift-mutations
│   │   │   ├── components/          week-navigator, week-day-selector, floor-cover-chart
│   │   │   └── screens/             roster, shift-editor
│   │   ├── labour/
│   │   │   ├── services/            PayRatesService (managers only, enforced by the server)
│   │   │   ├── hooks/               use-pay-rates
│   │   │   ├── domain/labour.ts     LabourUtils: effective-dated pay rates, shift cost, weekly summary
│   │   │   └── screens/             labour
│   │   ├── employees/               types.ts (Employee, roles), EmployeesService, use-employees
│   │   └── settings/                preferences.store.ts, settings screen (profile, sign out, reset demo
│   │                                data, developer switches for simulated network conditions)
│   │   (each folder has sibling __tests__/ with *.spec.ts(x))
│   │
│   ├── components/
│   │   ├── ui/                      Design-system components, one kebab-case file each (no barrel)
│   │   ├── layout/                  screen, app-header, connectivity-banner (offline and syncing)
│   │   │                            (tab screens pad for the floating tab bar with useTabBarInset)
│   │   └── scanner/                 barcode-camera, manual-barcode-entry (used by orders and inventory)
│   ├── constants/                   locale.ts (LOCALE copy), primitives.ts (time units, session length,
│   │                                platform flags)
│   ├── hooks/                       use-now; query/ holds use-safe-query, use-safe-mutation,
│   │                                use-handle-error, use-app-state-focus, use-pending-change-count;
│   │                                network/ holds use-online-manager and use-is-online
│   ├── mocks/                       Fictional store, products, orders, inventory, sales, staff, shifts,
│   │                                pay rates, demo sign-in credentials
│   ├── services/
│   │   ├── cache-keys/              TanStack Query cache and mutation keys
│   │   └── mock-api/                MockServer (in-app API) and the simulated network switches
│   ├── theme/                       Colour, typography and spacing tokens
│   ├── types/                       Shared domain types (orders, products), ApiError (stable error codes)
│   │                                and enums (StaleTimeMs, MessageType)
│   └── utils/                       FormatUtils, BarcodeUtils, storage (expo-sqlite), query-client and
│                                    query-persister, handle-api-error, success-handler, toast-config,
│                                    ReportingUtils
│
├── test/utils/                      Shared test helpers, imported as @test/*
├── __mocks__/                       Jest manual mocks for native modules (expo-sqlite kv-store)
├── docs/                            This document
├── learnings/                       Bugs that passed a correct-looking test suite
├── scripts/plugins/eslint/          Custom ESLint rules (no-object-exports, inline-if-to-scoped)
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

| Data                           | Where it lives                  | Why                                                                          |
| ------------------------------ | ------------------------------- | ---------------------------------------------------------------------------- |
| Orders, shifts, staff          | TanStack Query, saved on device | Server data. Opens instantly from the saved cache, even offline.             |
| Order and shift changes        | TanStack Query mutations        | Optimistic, queued offline, sent in order, resumed after a restart.          |
| Pay rates                      | TanStack Query, never saved     | Managers only, and too sensitive to write to the device.                     |
| Sales summary, inventory       | TanStack Query                  | Read-only server data with caching, retries and refetch on foreground.       |
| Signed-in session              | `useSessionStore`, persisted    | Reopens signed in until the session expires. Its role gates pay information. |
| Preferences, simulated network | Zustand, persisted              | Device-level settings.                                                       |

Every change is checked with the domain rules on the device first, and again by the server.

## Offline and sync

- **Online state.** `useOnlineManager` feeds TanStack Query's online manager from NetInfo and the "Force offline" switch. While offline, queries pause and the connectivity banner shows how many changes are waiting.
- **Queued changes.** Start picking, scan, assign and every roster change update the cache straight away and call `mutate`. Offline, the mutation pauses instead of failing.
- **Order and versions.** All order changes share one mutation scope, so they reach the server one at a time, in the order they were made. Each carries the version it was based on, and the server rejects a stale one with a 409.
- **Restarts.** The query cache and paused mutations are saved with the TanStack persister. Each mutation's `mutationFn` is registered by key, so after a restart `resumePausedMutations` sends what was waiting.
- **Rollback.** A rejected change shows an error toast and reloads the server's copy, which undoes the optimistic update.
- **Server-confirmed changes.** Mark ready and cancel are never optimistic. They need a connection, and the button explains why when offline.
- **Mock server.** `MockServer` stands in for the backend: it saves its data on the device, waits like a network request, fails while offline, and applies the same domain rules. Developer switches in Settings slow it down, force it offline, or make it fail some requests.

## Sign-in and route guards

The app has a demo sign-in with a staff ID and a 4-digit PIN. The two demo logins are listed in `src/mocks/auth.ts` and shown as quick sign-in cards on the sign-in screen.

- `AuthService.signIn` checks the credentials after simulated latency. A wrong pair throws an `ApiError` with the `INVALID_CREDENTIALS` code, and an inactive employee gets `ACCOUNT_INACTIVE`. The screen maps the code to copy in an inline banner.
- A successful sign-in returns a `Session` (employee, role, staff ID, store, token, expiry). The session lasts 12 hours and is saved in `useSessionStore`.
- On launch the session store rehydrates while the splash screen stays up. `useSessionBootstrap` then sets the status to signed in, or signed out if the saved session has expired.
- The root layout wraps every app screen in `Stack.Protected guard={signedIn}` and the sign-in screen in `guard={!signedIn}`. When the session clears, Expo Router leaves the protected screens and shows sign-in, with no manual navigation.
- Sign out in Settings calls `AuthService.signOut`, resets the demo data and preferences, clears the query cache, then clears the session.
- Role gating reads the session: `AuthUtils.canViewPayInformation` is true only for store and assistant managers, so a shift leader sees "Managers only" on the labour screen.

## Persistence

Everything saved on the device uses `expo-sqlite`'s key-value store: the Zustand stores (session, preferences, simulated network), the TanStack Query cache with its waiting changes, and the mock server's data.

- The mock server type-checks its saved records on load, and drops malformed ones rather than trusting them.
- The saved query cache is trusted for a day and has a version, so a change in data shape discards it.
- Storage keys are fixed in `STORAGE_KEYS`. Renaming one without a migration would silently discard data on users' devices.
- Stores are versioned, and a shape change ships with a `migrate`. For example, session version 2 renames a saved `SHIFT_RUNNER` role to `SHIFT_LEADER`.

## Testing

- Specs live next to the code in a sibling `__tests__/` folder (`*.spec.ts(x)`) and import code through the `@/` alias.
- Domain functions have unit tests, including zero-value, overnight and daylight-saving cases.
- Screens have component tests with React Native Testing Library. Expo Router, the camera and SQLite storage are mocked. Mock APIs are replaced per test, so loading, empty and error states are exercised.
- Jest runs in the Australia/Melbourne timezone, set in `jest.setup.ts`, so date maths is checked the same way on every machine.

Run everything with `npm run check`: format, lint, type check, spelling, knip and tests. CI and the pre-commit hook run the same gates.

## Moving to a real backend

Each `services/` namespace is the seam for Supabase. When it arrives:

1. Replace the mock service functions with Supabase queries. Screens do not change.
2. Enforce the same domain rules on the server, atomically, with version checks.
3. Replace the demo session with Supabase Auth, and protect pay rates with Row Level Security.
