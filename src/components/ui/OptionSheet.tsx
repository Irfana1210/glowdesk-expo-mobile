import Ionicons from '@expo/vector-icons/Ionicons';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing, touchTarget } from '@/theme';

import { AppText } from './AppText';

export interface SheetOption {
  value: string;
  label: string;
  description?: string;
}

export interface OptionSheetProps {
  visible: boolean;
  title: string;
  options: readonly SheetOption[];
  selected?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  testID?: string;
}

/** Bottom sheet with a list of choices, for actions like reassigning an order. */
export function OptionSheet({ visible, title, options, selected, onSelect, onClose, testID }: OptionSheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.flex} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]} accessibilityViewIsModal testID={testID}>
          <View style={styles.header}>
            <AppText variant="cardTitle" accessibilityRole="header">
              {title}
            </AppText>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" style={styles.close}>
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>
          <FlatList
            data={options}
            keyExtractor={(o) => o.value}
            renderItem={({ item }) => {
              const isSelected = item.value === selected;
              return (
                <Pressable
                  testID={testID ? `${testID}-option-${item.value}` : undefined}
                  onPress={() => onSelect(item.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={item.description ? `${item.label}, ${item.description}` : item.label}
                  style={[styles.option, isSelected && styles.optionSelected]}
                >
                  <View style={styles.flex}>
                    <AppText variant={isSelected ? 'bodyStrong' : 'body'}>{item.label}</AppText>
                    {item.description ? (
                      <AppText variant="supporting" color="textMuted">
                        {item.description}
                      </AppText>
                    ) : null}
                  </View>
                  {isSelected ? <Ionicons name="checkmark" size={20} color={colors.accent} /> : null}
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: { maxHeight: '70%', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: spacing.xl,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  close: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
  option: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  optionSelected: { backgroundColor: colors.infoSoft },
});
