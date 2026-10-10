import { type FC } from "react";

import { LOCALE } from "@/constants/locale";

import { EmptyState } from "./empty-state";
import { PrimaryButton } from "./primary-button";

const L = LOCALE.components.errorState;

type Props = {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  title?: string;
};

export const ErrorState: FC<Props> = ({
  title = L.title,
  message,
  onRetry,
  retryLabel = L.retry,
}) => {
  return (
    <EmptyState
      action={
        onRetry ? (
          <PrimaryButton icon="refresh" label={retryLabel} onPress={onRetry} />
        ) : undefined
      }
      icon="alert-circle-outline"
      message={message}
      testID="ERROR_STATE"
      title={title}
    />
  );
};
