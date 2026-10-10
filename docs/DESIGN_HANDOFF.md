# RetailOS Design Handoff

This folder is the source of truth for the RetailOS UI. The files in `screens/` are HTML design mockups (390×844 phone frames). They are **reference only**: read them for layout, spacing, colours, copy and data, then build real React Native screens. Never ship or import the HTML.

Signed-in user in all mockups: **Jordan Lee, Shift Runner**, RetailOS Melbourne Central, Saturday 10 October, 4:40 pm.

## Screens

| Mockup                         | Route                          | Notes                                                      |
| ------------------------------ | ------------------------------ | ---------------------------------------------------------- |
| `screens/Dashboard.dc.html`    | `src/app/(tabs)/dashboard.tsx` | Shift card, Needs attention, KPIs, sales by hour           |
| `screens/Orders.dc.html`       | `src/app/(tabs)/orders.tsx`    | Overdue banner, status filter chips, order cards           |
| `screens/OrderDetails.dc.html` | `src/app/orders/[id].tsx`      | Order summary, picking progress, products, sticky actions  |
| `screens/Roster.dc.html`       | `src/app/(tabs)/roster.tsx`    | Week nav, day picker, floor cover chart, shift list        |
| `screens/Inventory.dc.html`    | `src/app/(tabs)/inventory.tsx` | Search + scan, category chips, stock summary, product list |

In each mockup, the `<script>` block at the bottom holds the mock data (in `renderVals()`). Move that data into `src/mocks/` as typed TypeScript, never inline in screens.

## Design tokens (`src/theme/tokens.ts`)

Colours: background `#F8F5F1`, text `#222024`, muted text `#5E5A61`, inactive tab `#6E6672`, blush `#EBCDD3`, secondary `#816C83`, secondary text `#6F5B71`, success `#4C826C`, success dark `#3E6E5A`, error `#C44D56`, error text `#A8323C`, white `#FFFFFF`, border `#E6E1DC`, divider `#F0EBE6`, track `#EFEAE4`.

Status colours (background / text):

- New `#F3E3E7` / `#7E3343`
- Picking `#ECE6F0` / `#4F3E55`
- Ready, In stock `#E1EEE7` / `#2C5B4A`
- Low stock `#F6EBDD` / `#6E4512`
- Overdue, Out of stock `#F7E1E3` / `#8E2A33`

Typography:

- Display (page titles 38, hero numbers 36–44, order number 32): **Instrument Serif** 400, via `@expo-google-fonts/instrument-serif`
- Everything else: **DM Sans** 400/500/600/700, via `@expo-google-fonts/dm-sans`
- Eyebrow labels above titles: 11, weight 600, letter spacing ~1.5, uppercase, muted

Spacing 4, 8, 12, 16, 20, 24. Radius: chips/pills 999, cards 16–18, hero cards 20–22, buttons 14, tiles 12.

## Reusable components (`src/components/ui/`)

StatusBadge (icon + text, never colour alone), OrderCard, ProductRow (brand-initial tile, brand, name, SKU, qty, status), KPICard, FilterChips (`accessibilityState={{ selected }}`), ShiftCard (dark), AttentionItem, ShiftRow, PrimaryButton, SecondaryButton, TabBar styling (active tab gets a blush pill behind the icon).

## Behaviour rules

- Status is always shown with text and an icon, not colour alone.
- Touch targets at least 44×44; buttons 48–52 high.
- "Mark ready" stays disabled until every unit is verified, with the reason shown underneath (uses `canMarkReady`).
- Overdue orders sort first in the order list.
- Pay rates never appear for the Shift Runner role (use `hasPermission`).
- Icons: use `Ionicons` from `@expo/vector-icons` with the closest match to the mockup's line icons.
- All brands, products and people are fictional. Do not add real brand names.
