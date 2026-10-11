// Per-weight imports keep unused font weights out of the bundle.
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { DMSans_400Regular } from "@expo-google-fonts/dm-sans/400Regular";
import { DMSans_500Medium } from "@expo-google-fonts/dm-sans/500Medium";
import { DMSans_600SemiBold } from "@expo-google-fonts/dm-sans/600SemiBold";
import { DMSans_700Bold } from "@expo-google-fonts/dm-sans/700Bold";
import { DMSerifDisplay_400Regular } from "@expo-google-fonts/dm-serif-display/400Regular";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";

import { createQueryClient } from "@/utils/query-client/app-query-client";
import { QUERY_PERSIST_OPTIONS } from "@/utils/query-client/query-persister";
import { toastConfig } from "@/utils/toast-config";

import { useOnlineManager } from "@/hooks/network/use-online-manager";
import { useAppStateFocusManager } from "@/hooks/query/use-app-state-focus";

import { useSessionBootstrap } from "@/features/auth/hooks/use-session-bootstrap";
import {
  selectSessionStatus,
  useSessionStore,
} from "@/features/auth/store/session.store";
import { OrderMutations } from "@/features/orders/hooks/order-mutations";
import { ShiftMutations } from "@/features/roster/hooks/shift-mutations";

import { colors } from "@/theme";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

void SplashScreen.preventAutoHideAsync();

/** The app's client, with every mutation that can wait offline registered by key. */
function createAppQueryClient() {
  const client = createQueryClient();
  OrderMutations.register(client);
  ShiftMutations.register(client);
  return client;
}

export default function RootLayout() {
  const [queryClient] = useState(createAppQueryClient);
  useAppStateFocusManager();
  useOnlineManager();
  useSessionBootstrap();
  const sessionStatus = useSessionStore(selectSessionStatus);
  const [fontsLoaded, fontError] = useFonts({
    DMSerifDisplay_400Regular,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });
  // If fonts fail we still render with the system font rather than blocking the app.
  // The session must be resolved too, so the first screen is the right one.
  const ready =
    (fontsLoaded || fontError !== null) && sessionStatus !== "loading";
  const signedIn = sessionStatus === "signedIn";

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Restores the saved cache, then resumes changes that were waiting for a connection. */}
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={QUERY_PERSIST_OPTIONS}
        onSuccess={() =>
          queryClient
            .resumePausedMutations()
            .then(() => queryClient.invalidateQueries())
        }
      >
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            {/* Everything behind sign-in. When the guard turns false, Expo Router
                leaves these screens and shows the first available one: sign-in. */}
            <Stack.Protected guard={signedIn}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="orders/[id]" />
              <Stack.Screen name="orders/scan" />
              <Stack.Screen name="orders/complete" />
              <Stack.Screen name="inventory/[id]" />
              <Stack.Screen name="inventory/scan" />
              <Stack.Screen name="roster/shift" />
              <Stack.Screen name="more/labour" />
              <Stack.Screen name="more/settings" />
            </Stack.Protected>
            <Stack.Protected guard={!signedIn}>
              <Stack.Screen name="sign-in" />
            </Stack.Protected>
            <Stack.Screen name="+not-found" />
          </Stack>
          <Toast config={toastConfig} />
        </SafeAreaProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}
