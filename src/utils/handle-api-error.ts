import Toast, { type ToastPosition } from "react-native-toast-message";

import { LOCALE } from "@/constants/locale";

import { ReportingUtils } from "@/utils/reporting-utils";

import { isApiError } from "@/types/api-error";
import { ToastTypes } from "@/types/enums";

function messageFor(error: unknown): string {
  if (isApiError(error)) {
    return LOCALE.errors.byCode[error.code] ?? error.message;
  }
  return LOCALE.errors.generic;
}

/** Shows an error toast for a failed server call and reports it. Use it in mutation `onError`. */
export function handleError(
  error: unknown,
  position: ToastPosition = "top",
): void {
  ReportingUtils.reportError(error);
  Toast.show({ type: ToastTypes.Error, text1: messageFor(error), position });
}
