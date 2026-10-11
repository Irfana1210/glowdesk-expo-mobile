import { type FC, useState } from "react";
import { StyleSheet, View } from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import { LOCALE } from "@/constants/locale";

import { useIsOnline } from "@/hooks/network/use-is-online";
import { usePendingChangeCount } from "@/hooks/query/use-pending-change-count";

import { AppText } from "@/components/ui/app-text";

import { colors, radius, spacing } from "@/theme";

const L = LOCALE.sync;

/**
 * Shows when the app is offline, with how many changes are waiting, and while those changes
 * sync after the connection returns. Hidden the rest of the time.
 */
export const ConnectivityBanner: FC = () => {
  const online = useIsOnline();
  const pending = usePendingChangeCount();
  const [previousOnline, setPreviousOnline] = useState(online);
  const [syncing, setSyncing] = useState(false);

  // Adjusted while rendering rather than in an effect: syncing starts when the connection
  // returns with changes waiting, and ends once nothing is left to send.
  if (online !== previousOnline) {
    setPreviousOnline(online);
    setSyncing(online && pending > 0);
  } else if (syncing && pending === 0) {
    setSyncing(false);
  }

  if (!online) {
    return (
      <View
        accessible
        accessibilityLiveRegion="polite"
        style={[styles.bar, styles.offline]}
        testID="CONNECTIVITY_BANNER.OFFLINE"
      >
        <Ionicons color={colors.textOnDark} name="cloud-offline" size={18} />
        <View style={styles.text}>
          <AppText color="textOnDark" variant="bodyStrong">
            {L.offlineTitle}
          </AppText>
          <AppText color="textOnDark" variant="supporting">
            {pending > 0
              ? L.offlineWaiting(L.changes(pending))
              : L.offlineSaved}
          </AppText>
        </View>
      </View>
    );
  }
  if (syncing) {
    return (
      <View
        accessible
        accessibilityLiveRegion="polite"
        style={[styles.bar, styles.syncing]}
        testID="CONNECTIVITY_BANNER.SYNCING"
      >
        <Ionicons color={colors.accent} name="sync" size={18} />
        <AppText style={styles.text} variant="bodyStrong">
          {L.syncing(L.changes(pending))}
        </AppText>
      </View>
    );
  }
  return null;
};

const styles = StyleSheet.create({
  bar: {
    alignItems: "center",
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  offline: { backgroundColor: colors.emphasis },
  syncing: { backgroundColor: colors.infoSoft },
  text: { flex: 1 },
});
