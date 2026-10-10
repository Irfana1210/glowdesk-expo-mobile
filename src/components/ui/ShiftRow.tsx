import Ionicons from '@expo/vector-icons/Ionicons';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fontFamily, shiftStateColors, spacing } from '@/theme';

import { AppText } from './AppText';
import { InitialsAvatar } from './InitialsAvatar';

export type ShiftStateTone = keyof typeof shiftStateColors;

export interface ShiftRowProps {
  initials: string;
  avatarColor?: string;
  name: string;
  /** "Store Manager · Full time" */
  role: string;
  /** "On the floor", "Break at 5:00 pm · needs cover", "Finished". Shown with a dot, never colour alone. */
  stateLabel?: string;
  stateTone?: ShiftStateTone;
  /** "9:00 am – 5:30 pm" */
  time: string;
  /** "30m break · 8h" */
  meta: string;
  onEdit: () => void;
  accessibilityLabel: string;
  testID?: string;
}

/** One person's shift in the roster list, with an edit button. */
function ShiftRowComponent({
  initials,
  avatarColor,
  name,
  role,
  stateLabel,
  stateTone = 'on',
  time,
  meta,
  onEdit,
  accessibilityLabel,
  testID,
}: ShiftRowProps) {
  const state = shiftStateColors[stateTone];
  return (
    <View style={styles.row} testID={testID}>
      <View style={styles.main} accessible accessibilityLabel={accessibilityLabel}>
        <InitialsAvatar initials={initials} color={avatarColor} />
        <View style={styles.person}>
          <AppText style={styles.name} numberOfLines={1}>
            {name}
          </AppText>
          <AppText variant="supporting" color="textMuted" numberOfLines={1}>
            {role}
          </AppText>
          {stateLabel ? (
            <View style={styles.state}>
              <View style={[styles.dot, { backgroundColor: state.dot }]} />
              <AppText style={[styles.stateText, { color: state.text }]} numberOfLines={1}>
                {stateLabel}
              </AppText>
            </View>
          ) : null}
        </View>
        <View style={styles.times}>
          <AppText style={styles.time}>{time}</AppText>
          <AppText style={styles.meta}>{meta}</AppText>
        </View>
      </View>
      <Pressable
        testID={testID ? `${testID}-edit` : undefined}
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel={`Edit shift for ${name}`}
        hitSlop={{ left: 4, right: 4 }}
        style={styles.edit}
      >
        <Ionicons name="create-outline" size={20} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

export const ShiftRow = memo(ShiftRowComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  person: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 19, color: colors.text },
  state: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  stateText: { fontFamily: fontFamily.semibold, fontSize: 11, lineHeight: 14, flexShrink: 1 },
  times: { alignItems: 'flex-end', gap: 2, flexShrink: 0 },
  time: { fontFamily: fontFamily.semibold, fontSize: 13, lineHeight: 18, color: colors.text },
  meta: { fontFamily: fontFamily.regular, fontSize: 11, lineHeight: 14, color: colors.textMuted },
  edit: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
});
