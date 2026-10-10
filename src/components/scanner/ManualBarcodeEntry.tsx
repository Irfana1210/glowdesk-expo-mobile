import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SecondaryButton, TextField } from '@/components/ui';
import { spacing } from '@/theme';

export interface ManualBarcodeEntryProps {
  /** Return true when the code was accepted, so the field clears for the next one. */
  onSubmit: (code: string) => boolean;
  label?: string;
  submitLabel?: string;
  /** Lets a parent pre-fill the field, for example from a development shortcut. */
  value?: string;
  onChangeValue?: (value: string) => void;
  /** Focus the field on mount, e.g. when the user chose "Type code". */
  autoFocus?: boolean;
}

/** Barcode text entry for damaged labels and simulators, which have no camera. */
export function ManualBarcodeEntry({
  onSubmit,
  label = 'Enter barcode manually',
  submitLabel = 'Verify barcode',
  value,
  onChangeValue,
  autoFocus = false,
}: ManualBarcodeEntryProps) {
  const [internal, setInternal] = useState('');
  const code = value ?? internal;
  const setCode = onChangeValue ?? setInternal;

  const submit = () => {
    if (code.trim().length === 0) return;
    if (onSubmit(code)) setCode('');
  };

  return (
    <View style={styles.container}>
      <TextField
        testID="manual-barcode"
        label={label}
        hint="Use this if the barcode will not scan, or on a simulator."
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        returnKeyType="done"
        onSubmitEditing={submit}
        placeholder="e.g. 9300601042118"
        autoCorrect={false}
        autoFocus={autoFocus}
      />
      <SecondaryButton
        testID="manual-submit"
        label={submitLabel}
        icon="keypad-outline"
        disabled={code.trim().length === 0}
        onPress={submit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
});
