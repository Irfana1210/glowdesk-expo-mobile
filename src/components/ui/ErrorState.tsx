import { type FC } from "react";

import { EmptyState } from "./EmptyState";
import { PrimaryButton } from "./PrimaryButton";

type Props = {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  title?: string;
};

export const ErrorState: FC<Props> = ({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
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
      testID="error-state"
      title={title}
    />
  );
};
