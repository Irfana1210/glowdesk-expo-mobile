import { type FC } from "react";
import { StyleSheet, View } from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import { type IconName } from "@/components/ui/button";

import { colors } from "@/theme";

type Spot = {
  icon: IconName;
  left: number;
  rotate: string;
  size: number;
  top: number;
};

/** Positions are percentages of the screen, matching the scatter in the sign-in design. */
const SPOTS: Array<Spot> = [
  { icon: "flask-outline", left: 8, top: 4, rotate: "-12deg", size: 28 },
  {
    icon: "radio-button-off-outline",
    left: 38,
    top: 2,
    rotate: "0deg",
    size: 24,
  },
  { icon: "water-outline", left: 56, top: 3, rotate: "10deg", size: 22 },
  { icon: "cafe-outline", left: 78, top: 7, rotate: "8deg", size: 26 },
  { icon: "flask-outline", left: 4, top: 22, rotate: "6deg", size: 24 },
  { icon: "brush-outline", left: 86, top: 20, rotate: "-30deg", size: 28 },
  {
    icon: "radio-button-off-outline",
    left: 3,
    top: 38,
    rotate: "0deg",
    size: 22,
  },
  { icon: "flask-outline", left: 88, top: 36, rotate: "14deg", size: 22 },
  { icon: "water-outline", left: 4, top: 52, rotate: "-8deg", size: 24 },
  { icon: "brush-outline", left: 88, top: 54, rotate: "-20deg", size: 24 },
  { icon: "flask-outline", left: 6, top: 68, rotate: "4deg", size: 24 },
  {
    icon: "radio-button-off-outline",
    left: 90,
    top: 72,
    rotate: "0deg",
    size: 22,
  },
  {
    icon: "radio-button-off-outline",
    left: 10,
    top: 84,
    rotate: "0deg",
    size: 26,
  },
  { icon: "water-outline", left: 52, top: 90, rotate: "12deg", size: 22 },
  { icon: "brush-outline", left: 82, top: 88, rotate: "-26deg", size: 26 },
  { icon: "flask-outline", left: 30, top: 94, rotate: "-6deg", size: 24 },
];

/** Faint beauty-product icons behind the sign-in form. Decorative and hidden from assistive tech. */
export const PatternBackdrop: FC = () => (
  <View
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
    pointerEvents="none"
    style={StyleSheet.absoluteFill}
  >
    {SPOTS.map((spot, index) => (
      <Ionicons
        color={colors.text}
        key={index}
        name={spot.icon}
        size={spot.size}
        style={[
          styles.icon,
          {
            left: `${spot.left}%`,
            top: `${spot.top}%`,
            transform: [{ rotate: spot.rotate }],
          },
        ]}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  icon: { opacity: 0.08, position: "absolute" },
});
