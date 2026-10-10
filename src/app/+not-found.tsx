import { useRouter } from "expo-router";

import { AppHeader } from "@/components/layout/AppHeader";
import { Screen } from "@/components/layout/Screen";
import { EmptyState, PrimaryButton } from "@/components/ui";

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <Screen>
      <AppHeader title="Page not found" />
      <EmptyState
        action={
          <PrimaryButton
            label="Go to orders"
            onPress={() => router.replace("/orders")}
          />
        }
        icon="compass-outline"
        message="The link may be out of date."
        title="This screen doesn't exist"
      />
    </Screen>
  );
}
