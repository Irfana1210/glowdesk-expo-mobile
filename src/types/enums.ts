import { MS_IN_MINUTE, MS_IN_SECOND } from "@/constants/primitives";

/** How long each query's data counts as fresh. Never hardcode a stale time in a hook. */
export enum StaleTimeMs {
  Default = MS_IN_SECOND * 30,
  Inventory = MS_IN_MINUTE,
  SalesSummary = MS_IN_MINUTE,
}

export enum MessageType {
  Create = "Successfully added",
  Delete = "Successfully deleted",
  Update = "Successfully updated",
}

export enum ToastTypes {
  Error = "Error",
  Info = "Info",
  Success = "Success",
}
