import { type FC, useState } from "react";
import { StyleSheet, View } from "react-native";

import { LOCALE } from "@/constants/locale";

import { spacing } from "@/theme";

import { SecondaryButton } from "../ui/secondary-button";
import { TextField } from "../ui/text-field";

const L = LOCALE.components.manualBarcodeEntry;

type Props = {
  /** Focus the field on mount, e.g. when the user chose "Type code". */
  autoFocus?: boolean;
  label?: string;
  onChangeValue?: (value: string) => void;
  /** Return true when the code was accepted, so the field clears for the next one. */
  onSubmit: (code: string) => boolean;
  submitLabel?: string;
  /** Lets a parent pre-fill the field, for example from a development shortcut. */
  value?: string;
};

/** Barcode text entry for damaged labels and simulators, which have no camera. */
export const ManualBarcodeEntry: FC<Props> = ({
  onSubmit,
  label = L.label,
  submitLabel = L.submit,
  value,
  onChangeValue,
  autoFocus = false,
}) => {
  const [internal, setInternal] = useState("");
  const code = value ?? internal;
  const setCode = onChangeValue ?? setInternal;

  const submit = () => {
    if (code.trim().length === 0) {
      return;
    }
    if (onSubmit(code)) {
      setCode("");
    }
  };

  return (
    <View style={styles.container}>
      <TextField
        autoCorrect={false}
        autoFocus={autoFocus}
        hint={L.hint}
        keyboardType="number-pad"
        label={label}
        placeholder={L.placeholder}
        returnKeyType="done"
        testID="MANUAL_BARCODE_ENTRY.BARCODE"
        value={code}
        onChangeText={setCode}
        onSubmitEditing={submit}
      />
      <SecondaryButton
        disabled={code.trim().length === 0}
        icon="keypad-outline"
        label={submitLabel}
        testID="MANUAL_BARCODE_ENTRY.SUBMIT"
        onPress={submit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: spacing.md },
});
