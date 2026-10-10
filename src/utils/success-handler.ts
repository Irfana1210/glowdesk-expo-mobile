import Toast, { type ToastPosition } from "react-native-toast-message";

import { type MessageType, ToastTypes } from "@/types/enums";

export function successHandler(
  type: MessageType | string,
  position: ToastPosition = "top",
) {
  Toast.show({
    type: ToastTypes.Success,
    text1: type,
    position,
  });
}
