# Glowdesk

A mobile store-operations app for beauty retail teams, built with Expo, React Native and TypeScript.
It is an independent portfolio project. All stores, staff, customers, brands and products are fictional.

## Business problem

A busy beauty store runs several jobs at once. Staff pick Click & Collect orders between customers, managers build the
weekly roster, and someone has to keep labour cost inside budget while watching stock.

These jobs usually live in separate systems, and a wrong item in a collection bag reaches the customer. Glowdesk puts
them in one app on the shop floor. Barcode checks stop wrong or extra items. An order is only marked ready once the
server confirms it. Picking keeps working when the store's connection drops.

## Features

Everything in this list is implemented and covered by tests. Planned work is under [Roadmap](#roadmap).

- **Sign-in:** staff ID and 4-digit PIN, a session that persists until it expires, and protected routes.
- **Dashboard:** sales against target, transactions, labour spend, an hourly sales chart and live Click & Collect counts.
- **Click & Collect orders:** filter by status, start picking, scan each item, and mark the order ready for collection.
- **Barcode scanning:** camera scanning with a manual entry fallback, wrong-product rejection and over-pick prevention.
- **Inventory:** search, category and low-stock filters, product details and barcode lookup.
- **Roster:** weekly shifts, floor cover by hour, low-cover alerts, and a validated shift editor.
- **Labour:** weekly cost estimate from the roster, budget and labour %, visible to managers only.
- **Offline mode:** picking and roster changes show straight away, wait in a queue while offline, and sync in order when the connection returns, even after a restart.
- **Settings:** profile, store details, preferences, sign out, and developer switches that simulate offline, slow or failing requests.

## Tech stack

| Area        | Choice                                                      |
| ----------- | ----------------------------------------------------------- |
| App         | Expo SDK 57, React Native, TypeScript (strict)              |
| Navigation  | Expo Router                                                 |
| Server data | TanStack Query, with a saved cache and offline queue        |
| Network     | NetInfo                                                     |
| Device data | Zustand, persisted with `expo-sqlite`                       |
| Forms       | React Hook Form + Zod                                       |
| Camera      | `expo-camera`                                               |
| Testing     | Jest, React Native Testing Library                          |
| Quality     | ESLint, Prettier, cspell, knip, husky pre-commit, GitHub CI |

The app talks to an in-app mock server that behaves like a real API: it adds latency, fails while offline, checks versions and enforces manager-only data. A real backend can replace it without changing screens.

## Getting started

Requires Node 20 or newer and the Expo Go app on your phone.

```bash
npm install
npx expo start
```

Scan the QR code with the Camera app on iPhone, or with Expo Go on Android. On a simulator, press `i` for iOS or `a`
for Android in the terminal that runs Expo.

## Demo sign-in

| Staff ID | PIN  | Name        | Role          |
| -------- | ---- | ----------- | ------------- |
| RO1001   | 1111 | Alex Morgan | Store Manager |
| RO1002   | 2222 | Jordan Lee  | Shift Leader  |

Settings has a **Reset demo data** button. It reseeds orders and shifts relative to the current time, so run it before
a demo.

## Project structure

```text
src/
├── app/          Routes
├── features/     auth, dashboard, orders, inventory, roster, labour, employees, settings
├── components/   Shared UI, layout and scanner
├── hooks/        Shared hooks: safe query and mutation wrappers, online state
├── mocks/        Fictional data
├── services/     Query cache keys and the in-app mock server
├── theme/        Design tokens
└── utils/        Helpers, storage, query client, error handling
```

Each feature keeps its business rules in `domain/` as pure, unit-tested functions. The
[architecture document](docs/architecture.md) covers layers, state, offline sync and persistence in detail.

## Testing

```bash
npm test          # Jest
npm run check     # format, lint, type check, spelling, unused code and tests
```

- **Domain rules:** unit tests for the order state machine, picking, readiness, sales KPIs, labour cost, shift overlap
  and cover. They include zero values, overnight shifts and daylight-saving changes.
- **Screens:** component tests with React Native Testing Library for loading, empty and error states, filters, disabled
  buttons, validation messages and the scanner. They select elements by `testID` and assert against the copy in
  `LOCALE`, so wording changes don't break tests.
- **Offline and sync:** tests for the queued changes covering version chaining, restarts with waiting changes, retries
  after a server error, and rollback after a conflict. They run against the in-app mock server.
- **Time:** Jest runs in the Australia/Melbourne timezone, and screens accept a `now` prop, so dates behave the same on
  every machine.

Bugs that got past a passing test suite are written up in [learnings/](learnings/README.md).

## CI/CD

- **GitHub Actions:** [.github/workflows/checks.yml](.github/workflows/checks.yml) runs the type check, format check,
  ESLint, spelling, unused-code check and tests on every pull request and on pushes to `main`.
- **Pre-commit:** a husky hook runs the same gates locally before each commit.
- **Builds:** the app runs in Expo Go today. EAS build profiles are on the roadmap.

## Technical decisions

- **Expo and Expo Router.** One TypeScript codebase for iOS and Android with file-based routes. Route files only
  default-export a feature screen, so navigation can change without touching feature code.
- **Feature folders with pure domain rules.** Business rules have no React, storage or network code. They are fast to
  test, and the mock server applies the same functions, so the device and the server can't disagree.
- **TanStack Query for server data, Zustand for device state.** Orders, shifts, inventory, sales and pay rates are
  server state with caching and refetching. Zustand only holds the session, preferences and the simulated network
  switches, so server data is never copied into a store.
- **A mock server behind the services.** Each feature's `services/` namespace is the only place data is fetched. Today
  it calls an in-app mock server that adds latency, fails offline, and returns real error codes such as 403 and 409. A
  real backend replaces the services, and screens don't change.
- **Every order change is a command with a version.** Start picking, scan, assign, mark ready and cancel are commands
  applied on the device and again by the server. Each carries the version it was based on. A stale change is rejected
  as a conflict instead of overwriting newer work.
- **Two kinds of change.** Picking, assigning and roster edits show straight away and can wait offline. Marking ready
  and cancelling wait for the server, because "ready" tells the customer their order can be collected.
- **Offline queue that survives restarts.** The query cache and paused changes are saved on the device. Each change's
  handler is registered by key, so a change made offline still sends after the app restarts.
- **`expo-sqlite` key-value storage.** It runs in Expo Go, which MMKV does not.
- **Pay rates are protected twice.** The server refuses them to non-managers, and they are never written to the device.
- **All copy in one place.** User-facing text lives in a `LOCALE` namespace in Australian English.

## Known limitations

- **No real backend.** Data comes from the in-app mock server and is saved on the device.
- **Demo sign-in.** The staff IDs and PINs are in the source code. This is not production authentication.
- **Labour is an estimate.** Cost is paid hours × base hourly rate. Award rules, penalty rates, overtime, allowances and
  superannuation are not included, and the app says so on screen.
- **Collection is not built yet.** Orders stop at Ready. Handing the order to the customer comes in a later milestone.
- **Roster editing is open to every role.** Only pay information is restricted to managers so far.
- **Demo shifts cover one week.** They are seeded for the week the app was first opened. Reset demo data in Settings
  for the current week.
- **No end-to-end tests or native build setup yet.** A local native build with `npx expo run:ios` fails on Xcode 26.3,
  because Expo SDK 57's native modules need a newer Xcode.

## Roadmap

- Supabase backend: PostgreSQL, Supabase Auth, and Row Level Security for store access and pay rates.
- Collection hand-over, moving orders from Ready to Collected.
- Sales Analytics and Employees screens, shown as "Planned" in the More tab today.
- Manager-only roster editing, enforced by the server.
- Maestro end-to-end tests for the picking workflow, using the existing `testID`s.
- EAS build profiles for development and preview builds, run from CI.
- Error reporting with Sentry through the existing `ReportingUtils` seam.
- Award and enterprise agreement rules for labour cost.

## Documentation

- [Architecture](docs/architecture.md): folder map, layers, state, offline sync and persistence.
- [Coding standards](docs/coding-standards.md): naming, services, query hooks and testing conventions.
- [Learnings](learnings/README.md): bugs that passed a correct-looking test suite, and the habit that would catch them.
