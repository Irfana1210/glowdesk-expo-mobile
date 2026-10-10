import Toast from "react-native-toast-message";

import { LOCALE } from "@/constants/locale";

import { ToastTypes } from "@/types/enums";

import { ReportingUtils } from "./reporting-utils";

/**
 * Shows an error toast. A string is copy written for the user and is shown as is. Anything else is
 * reported and replaced by the generic line, because an `Error`'s message is written for a developer.
 */
export const handleError = (error: unknown) => {
  if (typeof error !== "string") {
    ReportingUtils.reportError(error);
  }
  Toast.show({
    type: ToastTypes.Error,
    text1: typeof error === "string" ? error : LOCALE.errors.generic,
  });
};
