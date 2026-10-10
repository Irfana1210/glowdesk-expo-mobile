import { useRouter } from "expo-router";

import { LOCALE } from "@/constants/locale";

import { AppHeader } from "@/components/layout/app-header";
import { Screen } from "@/components/layout/screen";
import { EmptyState } from "@/components/ui/empty-state";
import { PrimaryButton } from "@/components/ui/primary-button";

const L = LOCALE.app.notFound;

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <Screen>
      <AppHeader title={L.header} />
      <EmptyState
        action={
          <PrimaryButton
            label={L.action}
            onPress={() => router.replace("/orders")}
          />
        }
        icon="compass-outline"
        message={L.message}
        title={L.title}
      />
    </Screen>
  );
}
