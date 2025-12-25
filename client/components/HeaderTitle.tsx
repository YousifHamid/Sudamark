import React from "react";
import { View, StyleSheet, Pressable, Text } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

export function HeaderTitle() {
  const { t, isRTL } = useLanguage();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleSellPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("PostCar");
  };

  return (
    <View style={[styles.container, isRTL && styles.containerRTL]}>
      <Image
        source={require("../../attached_assets/ARABATY2_1766665788809.png")}
        style={styles.logo}
        contentFit="contain"
      />
      <Pressable onPress={handleSellPress} style={styles.sellButton}>
        <Feather name="plus-circle" size={16} color="#FFFFFF" />
        <Text style={styles.sellText}>{t("listYourCar")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: Spacing.md,
  },
  containerRTL: {
    flexDirection: "row-reverse",
  },
  sellButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F97316",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  sellText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  logo: {
    width: 120,
    height: 44,
  },
});
