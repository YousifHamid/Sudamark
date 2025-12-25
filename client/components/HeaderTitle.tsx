import React from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";

import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

export function HeaderTitle() {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Image
        source={require("../../attached_assets/ARABATY2_1766665788809.png")}
        style={styles.logo}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  logo: {
    width: 150,
    height: 54,
  },
});
