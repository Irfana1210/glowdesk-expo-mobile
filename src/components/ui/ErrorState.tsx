import { EmptyState } from './EmptyState';
import { PrimaryButton } from './PrimaryButton';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, retryLabel = 'Try again' }: ErrorStateProps) {
  return (
    <EmptyState
      testID="error-state"
      icon="alert-circle-outline"
      title={title}
      message={message}
      action={onRetry ? <PrimaryButton label={retryLabel} icon="refresh" onPress={onRetry} /> : undefined}
    />
  );
}
