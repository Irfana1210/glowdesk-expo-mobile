import { APP_LOCALE } from "./locale/app";
import { COMPONENTS_LOCALE } from "./locale/components";
import { DASHBOARD_LOCALE } from "./locale/dashboard";
import { INVENTORY_LOCALE } from "./locale/inventory";
import { LABOUR_LOCALE } from "./locale/labour";
import { ORDERS_LOCALE } from "./locale/orders";
import { ROSTER_LOCALE } from "./locale/roster";
import { SETTINGS_LOCALE } from "./locale/settings";

/** All user-facing copy. Australian English. Screens read it through a scoped const. */
export namespace LOCALE {
  export const errors = {
    generic: "Something went wrong. Try again.",
  };
  export const app = APP_LOCALE;
  export const components = COMPONENTS_LOCALE;
  export const dashboard = DASHBOARD_LOCALE;
  export const inventory = INVENTORY_LOCALE;
  export const labour = LABOUR_LOCALE;
  export const orders = ORDERS_LOCALE;
  export const roster = ROSTER_LOCALE;
  export const settings = SETTINGS_LOCALE;
}
