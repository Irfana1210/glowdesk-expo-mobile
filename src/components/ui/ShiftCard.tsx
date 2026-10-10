import { StyleSheet, View } from 'react-native';

import { darkSurface, fontFamily, fontSizes, palette, radius, spacing } from '@/theme';

import { AppText } from './AppText';

export interface ShiftCardStat {
  value: string;
  label: string;
}

export interface ShiftCardProps {
  /** Pill text, e.g. "On shift", "Starts soon" or "Shift finished". */
  statusLabel: string;
  /** Show the green "live" pill. */
  live: boolean;
  /** "12:00 pm – 8:30 pm" */
  timeRange: string;
  /** Large serif line, e.g. "3h 50m left". */
  headline: string;
  /** 0–100, or null to hide the progress bar. */
  percent: number | null;
  /** Up to three figures along the bottom. */
  stats: ShiftCardStat[];
  testID?: string;
}

/** Dark hero card summarising the signed-in person's shift. */
export function ShiftCard({ statusLabel, live, timeRange, headline, percent, stats, testID }: ShiftCardProps) {
  const clamped = percent === null ? null : Math.min(100, Math.max(0, Math.round(percent)));
  return (
    <View style={styles.card} testID={testID} accessibilityLabel="Your shift">
      <View style={styles.top}>
        <View style={[styles.pill, live && styles.pillLive]}>
          <View style={styles.dot} />
          <AppText style={styles.pillText}>{statusLabel}</AppText>
        </View>
        <AppText style={styles.muted}>{timeRange}</AppText>
      </View>

      <View style={styles.headlineRow}>
        <AppText style={styles.headline} accessibilityRole="header">
          {headline}
        </AppText>
        {clamped === null ? null : <AppText style={styles.muted}>{clamped}%</AppText>}
      </View>

      {clamped === null ? null : (
        <View
          style={styles.track}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel="Shift progress"
          accessibilityValue={{ min: 0, max: 100, now: clamped }}
        >
          <View style={[styles.fill, { width: `${clamped}%` }]} />
        </View>
      )}

      {stats.length > 0 ? (
        <View style={styles.stats}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.stat} accessible accessibilityLabel={`${stat.value} ${stat.label}`}>
              <AppText style={styles.statValue}>{stat.value}</AppText>
              <AppText style={styles.statLabel}>{stat.label}</AppText>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: darkSurface.background,
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: darkSurface.track,
  },
  pillLive: { backgroundColor: darkSurface.pill },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: darkSurface.text },
  pillText: { fontFamily: fontFamily.semibold, fontSize: 12, lineHeight: 16, color: darkSurface.text },
  muted: { fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 18, color: darkSurface.mutedText },
  headlineRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm },
  headline: { fontFamily: fontFamily.display, fontSize: 36, lineHeight: 42, color: darkSurface.text, flexShrink: 1 },
  track: { height: 6, borderRadius: radius.pill, backgroundColor: darkSurface.track, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: palette.blush },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: darkSurface.divider,
  },
  stat: { flex: 1, paddingTop: 10 },
  statValue: { fontFamily: fontFamily.semibold, fontSize: fontSizes.stat, lineHeight: 26, color: darkSurface.text },
  statLabel: { fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 16, color: darkSurface.mutedText, marginTop: 2 },
});
