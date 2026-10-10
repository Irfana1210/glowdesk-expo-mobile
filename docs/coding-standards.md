# RetailOS — Coding Standards

Expo (expo-router) app with TypeScript, TanStack Query, Zustand and react-hook-form + zod.

Run `npm run check` before every commit (format, lint, typecheck, spelling, knip, tests). The
husky pre-commit hook runs the same gates.

## Project Structure

```
src/
├── app/              # expo-router routes only: thin files that default-export a feature screen
├── components/       # Shared UI: ui/ (design system), layout/, scanner/
├── constants/        # LOCALE copy, primitives (time units, platform flags, mock latency)
├── features/<name>/  # One folder per feature
│   ├── components/   # Feature-only components
│   ├── domain/       # Pure business rules as namespaces (no React, no I/O)
│   ├── hooks/        # Feature hooks (query hooks wrap useSafeQuery)
│   ├── screens/      # *.screen.tsx
│   ├── services/     # *.service.ts — the only place data is fetched
│   ├── store/        # *.store.ts — Zustand, client state only
│   └── types.ts
├── hooks/            # Generic hooks; hooks/query/ holds the safe query wrapper
├── mocks/            # Fictional demo data factories
├── services/         # cache-keys/
├── theme/            # Tokens → semantic colours, typography, spacing
├── types/            # Shared types and enums (StaleTimeMs, MessageType, ToastTypes)
└── utils/            # Namespaced utilities, storage, query client, toast + error handling
test/utils/           # Shared test helpers (@test/*)
__mocks__/            # Jest manual mocks for native modules
```

Code is grouped by feature, then by type inside the feature. Cross-feature imports use `@/features/...`.

## Naming

| Kind      | File                     | Export                    |
| --------- | ------------------------ | ------------------------- |
| Screen    | `order-list.screen.tsx`  | `OrderListScreen`         |
| Component | `order-card.tsx`         | `OrderCard`               |
| Store     | `orders.store.ts`        | `useOrdersStore`          |
| Service   | `orders.service.ts`      | `OrdersService` namespace |
| Hook      | `use-inventory.ts`       | `useInventory`            |
| Utils     | `format-utils.ts`        | `FormatUtils` namespace   |
| Domain    | `domain/shifts.ts`       | `ShiftUtils` namespace    |
| Spec      | `__tests__/x.spec.ts(x)` | —                         |

- Files are kebab-case. Route files in `src/app` keep expo-router's names (`_layout`, `[id]`, `+not-found`).
- Constants are SCREAMING_SNAKE. Enums are PascalCase in `src/types/enums.ts`.

## Code Style (enforced by ESLint)

- Named exports only, declared at the definition. No `export { a, b }` lists and no default exports,
  except expo-router route files (`src/app/**`) which must default-export.
- Components: `export const X: FC<Props> = (...) => {}` with a local `type Props`. Generic
  components (`FilterChips<T>`, `SelectField<T>`) stay function declarations because `FC` cannot
  carry type parameters.
- `type`, never `interface` (except declaration merging, e.g. `env.d.ts`). `Array<T>`, not `T[]`.
  Object type keys sorted alphabetically. JSX props sorted, shorthand first, callbacks last.
- No `import React`. Inline type imports: `import { type X }`.
- Every `if` has braces. Max line length 120. Double quotes (Prettier defaults).
- Import groups: react/RN → third party → `@/constants` → `@/utils` → `@/services` → `@/hooks` →
  `@/features` → `@/components` → other `@/` → `@test/` → relative.
- Relative imports only within the same feature or folder; otherwise `@/`.

## Services

- All data access goes through a `namespace XxxService` in `features/<name>/services/`.
- Service files only contain the namespace. No helpers or types — put those in `types.ts` or utils.
- Never fetch from components or stores directly; call the service.
- Today services return mock data after `MockUtils.simulateLatency()`. Supabase plugs in here.

## TanStack Query — Safe Hooks

- Always use `useSafeQuery` from `@/hooks/query/use-safe-query`. Never `useQuery` directly.
  Mutations use `useSafeMutation` from `@/hooks/query/use-safe-mutation`. Add `useSafeInfiniteQuery`
  in the same folder with the first paged list.
- Wrap each query in a feature hook (`useInventory`), never call a service inside a component.
- Cache keys are flat constants in `src/services/cache-keys/index.ts`, used as the first element of
  the query key: `[INVENTORY_CACHE_KEY, storeId]`. Never inline a key string.
- Stale times come from the `StaleTimeMs` enum. Never hardcode a number.

## Zustand Stores

- Zustand is for client/device state (order picking progress, roster edits, preferences). Server
  state belongs in TanStack Query.
- Type stores as `type States` + `type Actions`, created with `create<States & Actions>()`.
- Actions return result objects (`{ ok: true } | { ok: false; message }`) instead of throwing.
- Selectors live next to the store (`selectOrderById`).

Persistence uses Zustand's `persist` middleware on expo-sqlite's key-value
store (`persistStorage` in `src/utils/storage.ts`), not MMKV. Keys live in `STORAGE_KEYS` and are
versioned; never rename one without a `migrate`.

## Utilities and Domain Rules — Namespaced

- Group functions in a namespace: `format-utils.ts` → `FormatUtils`. Access as `FormatUtils.x()`.
- Never export loose functions from util or domain files. Types stay top-level.
- Domain modules (`features/*/domain/`) are pure: they take `now: Date` instead of reading the
  clock, so tests pin time.

## Forms — react-hook-form + zod

Forms use react-hook-form with `zodResolver`.

- Schemas live with the feature domain (`roster/domain/shift-form.ts`).
- Disable fields and buttons while submitting.
- Validation messages use soft, helpful language from `LOCALE` ("Choose a start time", not "Required").
- Domain validation (`ShiftUtils.validateShift`) is the source of truth; the form maps its errors
  onto fields so the form and the store can never disagree.

## Errors and Feedback

- Error toasts: `handleError(error)` in `src/utils/handle-api-error.ts` shows a `ToastTypes.Error`
  toast with the API's message or `LOCALE.errors.generic`, and reports through `ReportingUtils`.
- `successHandler(MessageType.X)` shows a success toast. Use it when the action navigates away
  (shift saved/removed).
- Keep feedback inline when it relates to what is on screen (scan results, field errors, banners).
- `ReportingUtils.reportError` is the single reporting seam; Sentry plugs in there.

## Strings — LOCALE

- All user-facing copy lives in the `LOCALE` namespace in `src/constants/locale.ts`, grouped by area
  (`LOCALE.orders.details`, `LOCALE.components.errorState`). Interpolated copy is a function.
- Read through a scoped const: `const L = LOCALE.orders.details;`.
- Australian English (colour, normalise).
- Tests assert against `LOCALE` values, not literals, so copy changes don't break tests.

## Styling

- `StyleSheet.create()` with tokens from `@/theme` (`colors`, `spacing`, `radius`, `typography`).
  Never raw hex values in screens.
- Status is always icon + text, never colour alone. Touch targets ≥ `touchTarget` (48).
- Text respects OS font scaling up to `maxFontScale`.

## Accessibility and testIDs

- `testID` uses uppercase dot notation: `SCREEN.CHILD.ELEMENT` (e.g. `ORDER_LIST.CARD.ORD-7841`).
  Maestro flows and specs select by testID.
- Interactive elements have an `accessibilityRole` and label. Announce async outcomes with
  `AccessibilityInfo.announceForAccessibility`.

## Testing

- Jest with `jest-expo` and `@testing-library/react-native` 14 (`render` and `fireEvent` are async —
  always `await` them).
- Specs live in a sibling `__tests__/` folder: `screens/__tests__/order-list.screen.spec.tsx`.
- Shared helpers in `test/utils/` (`render-with-query`, `order-test-utils`, `roster-test-utils`), imported
  as `@test/...`.
- Mock services with a namespace factory:
  `jest.mock("@/features/orders/services/orders.service", () => ({ OrdersService: { fetchOrders: jest.fn() } }))`.
- Screens accept a `now` prop so tests pin the clock. The test timezone is `Australia/Melbourne`.
- Native modules are mocked in `__mocks__/` (expo-sqlite kv-store) or `jest.setup.ts`.

## Learnings

Bugs that slipped past a correct-looking test suite get a write-up in `learnings/NNN-slug.md`.
