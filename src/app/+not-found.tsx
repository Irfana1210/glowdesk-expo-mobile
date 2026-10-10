import { useRouter } from 'expo-router';

import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import { EmptyState, PrimaryButton } from '@/components/ui';

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <Screen>
      <AppHeader title="Page not found" />
      <EmptyState
        icon="compass-outline"
        title="This screen doesn't exist"
        message="The link may be out of date."
        action={<PrimaryButton label="Go to orders" onPress={() => router.replace('/orders')} />}
      />
    </Screen>
  );
}
