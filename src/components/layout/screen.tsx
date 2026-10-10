import { type FC, type ReactNode } from "react";
import { StyleSheet } from "react-native";
import { type Edge, SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/theme";

type Props = {
  children: ReactNode;
  /** Tab screens skip the bottom edge because the tab bar already handles it. */
  edges?: Array<Edge>;
  testID?: string;
};

export const Screen: FC<Props> = ({
  children,
  edges = ["top", "left", "right"],
  testID,
}) => {
  return (
    <SafeAreaView edges={edges} style={styles.container} testID={testID}>
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
