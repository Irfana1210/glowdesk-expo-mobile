# RetailOS

A mobile store-operations app for beauty retail teams, built with Expo, React Native and TypeScript.
It is an independent portfolio project. All stores, customers, brands and products are fictional.

> **Status: Milestone 4.** All five tabs work on fictional data: the store dashboard, the full Click & Collect
> picking workflow, inventory with barcode lookup, the weekly roster with a validated shift editor, and a
> labour cost estimate built on the roster. Orders and shifts survive an app restart.
> Everything else is clearly labelled as planned.

## What works

| Area | Status |
| --- | --- |
| Expo SDK 57 project, Expo Router with 5 bottom tabs and a nested order details route | Implemented |
| Design tokens: brief palette, Inter type scale, 4–32 spacing scale | Implemented |
| Typed order model and pure state machine (`NEW → PICKING → READY → COLLECTED`, cancellations) | Implemented and unit tested |
| `canMarkReady` / `markOrderReady`: immutable result, version increment, invalid transitions rejected | Implemented and unit tested |
| Order list: All / New / Picking / Ready / Collected filters with counts, priority indicator, pull to refresh | Implemented and component tested |
| Loading, empty and error states with retry | Implemented and component tested |
| Order details: products, SKU, barcode, picked vs required, picking progress | Implemented and component tested |
| Start Picking and Mark Ready for Collection (disabled until every item is verified, reason shown) | Implemented and component tested |
| Barcode scanner with `expo-camera`: permission request, denied and unavailable states | Implemented (camera needs a physical device) |
| Manual barcode entry fallback for simulators and damaged labels | Implemented and component tested |
| Barcode matching, quantity validation, wrong-product rejection, over-pick prevention | Implemented and unit tested |
| Order Completion screen: verified count, confirmation, final status, invalid-transition error | Implemented and component tested |
| Order state saved on device with `expo-sqlite` key-value storage, restored on restart | Implemented and tested |
| Reset demo data (Settings, with confirmation) | Implemented |
| Dashboard KPIs: sales vs target, achievement %, transactions, average transaction value, labour spend and % | Implemented and tested |
| KPI formulas with safe zero handling (shows "—" and "not available", never NaN) | Implemented and unit tested |
| Live pending and ready Click & Collect counts on the dashboard | Implemented and component tested |
| Hourly sales vs target chart (tap a bar for details, screen reader labels per hour) | Implemented and component tested |
| Quick actions to Orders, Roster and Inventory | Implemented |
| Inventory: search by name, brand, SKU or barcode; category filters; low-stock toggle; stock status | Implemented and tested |
| Product details: stock, reorder point and guidance, SKU, barcode, category, price | Implemented and component tested |
| Inventory barcode lookup (camera or manual entry) opens the product | Implemented and component tested |
| Weekly roster: week navigation, shifts per day, paid hours, staff count, coverage gaps against trading hours | Implemented and tested |
| Shift editor (React Hook Form + Zod): add, edit, remove with confirmation | Implemented and component tested |
| Shift validation: end after start, break shorter than shift, overlap detection, inactive or other-store staff blocked, explicit overnight shifts, real elapsed time across daylight saving | Implemented and unit tested |
| Labour Management: weekly roster cost, budget, labour % of forecast sales, cost by day and by employee, live recalculation | Implemented and tested |
| Effective-dated pay rates; missing rates flagged rather than costed at zero | Implemented and unit tested |
| Pay information restricted to the Manager role (the demo user is a manager; there is no role switch) | Implemented and tested |
| Settings: profile, assigned store and trading hours, app version | Implemented and component tested |
| App preference: vibrate on scan errors (used by both scanners), saved on device | Implemented and tested |
| Notification preferences, saved on device | Implemented. Push notifications are not sent yet, and the screen says so. |
| Sign out (demo): clears orders, roster changes and preferences on the device, returns to the dashboard | Implemented and tested |
| Sales Analytics, Employees | Planned (shown as "Planned" in the More tab) |
| CI, EAS Build, Maestro E2E | Planned |

## Getting started

Requirements: Node 20 or newer, and the **Expo Go** app on a phone (iOS or Android). Expo Go must support SDK 57, which the current store version does.

```bash
npm install
npx expo start
```

- **iPhone:** open the Camera app, scan the QR code in the terminal, and tap the banner to open in Expo Go.
- **Android:** open Expo Go and choose *Scan QR code*.
- The phone and computer must be on the same Wi-Fi network. If the QR code will not connect (guest or corporate Wi-Fi), use `npx expo start --tunnel`.
- **Simulators:** press `i` (iOS Simulator, needs Xcode) or `a` (Android emulator) in the Expo terminal.

### Demo walkthrough

1. Open the **Orders** tab. High-priority orders sit at the top.
2. Tap **#ORD-7842** (New) and press **Start Picking**. Mark Ready stays disabled and says how many items remain.
3. Press **Scan Product Barcode**. On a phone, point the camera at a barcode. On a simulator, type a barcode or tap an item in *Still to pick* to fill it (development builds only).
4. Try a wrong barcode, for example `9301234000080`, to see the rejection. Scan an item twice past its quantity to see over-pick prevention.
5. When every item is verified, press **Review and complete**, then **Confirm ready for collection**. The order moves to Ready.
6. Close and reopen the app. The order keeps its status and picked quantities.
7. Open **Inventory**, tap **Low stock only**, then open a product. Tap the scan button and enter `9301234000080` to jump to a product by barcode.
8. Open **Roster**. Sunday has a red dot: nobody is rostered 5pm–9pm. Tap **Add Shift**, pick an employee already working that day, and save to see the overlap error. Try 10pm–6am without **Ends next day** to see the overnight rule.
9. Open **More → Labour Management**, note the cost, then change a shift in the roster and come back: the cost updates.
10. Open **More → Settings**. Turn off **Vibrate on scan errors**, or use **Reset demo data** to restore orders and the roster.

Printing the mock barcodes is the easiest way to test the camera on a phone. Each product's barcode is shown under its name on the order details screen.

## Checks

```bash
npm run typecheck   # tsc --noEmit, strict mode
npm run lint        # expo lint (ESLint flat config)
npm test            # Jest with jest-expo and React Native Testing Library
npm run check       # all three
npx expo-doctor     # Expo SDK dependency health
```

## Architecture

The full folder map, layers, state and persistence design are in [docs/architecture.md](docs/architecture.md).

```text
RetailOS/
├── src/
│   ├── app/          Expo Router routes (thin files)
│   ├── features/     orders, dashboard, inventory, roster, labour, employees, settings, session
│   ├── components/   ui, layout, scanner
│   ├── database/     On-device persistence (expo-sqlite)
│   ├── hooks/        Cross-feature hooks
│   ├── lib/          Pure helpers
│   ├── mocks/        Fictional data
│   ├── theme/        Design tokens
│   └── types/        Shared domain types
├── __tests__/        Jest tests, mirroring src/
├── docs/             Architecture document and design mockup
└── assets/
```

Key decisions:

- **Business rules are pure functions** in `features/orders/domain`. Screens never decide whether a transition is valid. Every transition goes through one guarded function, so READY cannot be reached without full verification. The backend must enforce the same rules atomically later.
- **Zustand holds MVP order state; TanStack Query holds sales.** Orders are edited locally, so they live in a persisted Zustand store for now. Sales are read-only server data, so they are fetched through TanStack Query with caching, retries and pull-to-refresh. When the Supabase backend arrives, orders move to TanStack Query too, and the store keeps only local UI state and the offline queue.
- **The chart is built from plain views,** not a charting library. Twelve hourly bars do not justify a dependency, and plain views let every bar carry its own screen reader label.
- **Pending and ready order counts on the dashboard are live** from the order store rather than the brief's static sample (12 and 5), so the dashboard always agrees with the Orders tab.
- **Times are absolute instants.** Shifts store ISO timestamps, so overnight shifts carry an explicit end date and durations count real elapsed time across daylight-saving changes. Tests run in the Australia/Melbourne timezone so this is checked.
- **One set of shift rules.** The Zod form schema calls the same `validateShift` the store uses, so the editor and the data layer cannot disagree, and the store re-validates every write.
- **Two labour figures, on purpose.** The dashboard shows the brief's sample labour spend from the trading system. Labour Management shows an estimate calculated from the roster. Both are labelled.
- **Pay rates are effective-dated,** matching the `employee_pay_rates` table design, so a rate rise on 1 July costs shifts correctly on either side of it.
- **Labour spend is labelled as an estimate.** Real Australian payroll needs award rules, penalty rates, overtime and superannuation, which the brief says must not be implied by a flat-rate figure.
- **Refresh and restore merge by `version`.** When saved, local and fetched copies of an order meet, the higher version wins, so picking progress is never overwritten by stale data. This is the same rule the offline sync milestone will rely on.
- **Persistence uses `expo-sqlite`'s key-value store** rather than AsyncStorage. SQLite is already in the brief's stack for the offline queue, so this adds no extra dependency. Saved records are checked on load and malformed ones are dropped.
- **Every pick is a versioned change.** Each scan returns a new order with the version increased. That gives the future backend a version to compare against, so duplicate or stale scans can be rejected.
- **Scanner debouncing:** the camera reports the same code many times a second. The scanner ignores a repeat of the same code within 2 seconds, so one scan never counts twice.
- **Mark Ready goes through a confirmation screen** rather than changing status in one tap, because it tells the customer their order is ready.
- **Accessibility:** every status is shown as icon plus text, never colour alone. Buttons are at least 48 pt tall and expose disabled state. Cards and rows have full screen-reader labels, and font scaling is respected with a cap on dense layouts.

## Known limitations

- The camera does not work on the iOS Simulator. Use manual entry there, and a physical device for real scanning.
- Persistence is local only. There is no backend, so nothing syncs between devices yet.
- READY orders cannot yet be handed over (marked COLLECTED) or cancelled from the UI.
- There is no role switch by design: the demo user is a manager. In production the role comes from authentication, and pay data must be protected by Supabase Row Level Security, not only hidden in the app.
- Sign out has no account to leave in demo mode, so it clears the data saved on the device instead.
- The Shift Editor's date chips cover the selected week only. Navigate the roster to another week before adding a shift there.
- Coverage checks ignore when breaks are taken, because break timing is not scheduled.
- Expo Go on an iOS 18.5 simulator occasionally fails a reload with "Cannot find native module 'ExpoAsset'" after many files change at once. Closing and reopening Expo Go fixes it. Cold launches are unaffected.
- Product images are coloured monogram tiles, not photos.
- Expo Router bundles a Material Symbols font through its own dependencies (about 1 MB). It cannot be removed from the app side.

## Next milestone

Day 2 of the brief's delivery plan: CI with GitHub Actions (type check, lint, tests), EAS Build configuration, and the architecture docs and decision records. After that: Employees and Sales Analytics.
