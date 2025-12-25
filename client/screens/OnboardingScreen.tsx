import React from "react";
import { View, StyleSheet, Dimensions, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface FeatureItem {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  titleKey: string;
  descKey: string;
}

const FEATURES: FeatureItem[] = [
  {
    id: "1",
    icon: "search",
    titleKey: "feature1Title",
    descKey: "feature1Desc",
  },
  {
    id: "2",
    icon: "shield",
    titleKey: "feature2Title",
    descKey: "feature2Desc",
  },
  {
    id: "3",
    icon: "truck",
    titleKey: "feature3Title",
    descKey: "feature3Desc",
  },
  {
    id: "4",
    icon: "tool",
    titleKey: "feature4Title",
    descKey: "feature4Desc",
  },
  {
    id: "5",
    icon: "check-circle",
    titleKey: "feature5Title",
    descKey: "feature5Desc",
  },
  {
    id: "6",
    icon: "heart",
    titleKey: "feature6Title",
    descKey: "feature6Desc",
  },
  {
    id: "7",
    icon: "star",
    titleKey: "feature7Title",
    descKey: "feature7Desc",
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onComplete();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { 
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require("../../attached_assets/ARABATY2_1766665788809.png")}
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        <ThemedText type="h1" style={[styles.welcomeTitle, isRTL && styles.rtlText]}>
          {t("welcomeTitle")}
        </ThemedText>
        <ThemedText style={[styles.welcomeSubtitle, { color: theme.textSecondary }, isRTL && styles.rtlText]}>
          {t("welcomeSubtitle")}
        </ThemedText>

        <View style={styles.featuresGrid}>
          {FEATURES.map((feature, index) => (
            <View 
              key={feature.id} 
              style={[
                styles.featureCard,
                { backgroundColor: theme.cardBackground }
              ]}
            >
              <View style={[styles.featureIconCircle, { backgroundColor: theme.primary + "15" }]}>
                <Feather name={feature.icon} size={24} color={theme.primary} />
              </View>
              <View style={styles.featureContent}>
                <ThemedText type="h4" style={[styles.featureTitle, isRTL && styles.rtlText]}>
                  {t(feature.titleKey)}
                </ThemedText>
                <ThemedText style={[styles.featureDesc, { color: theme.textSecondary }, isRTL && styles.rtlText]}>
                  {t(feature.descKey)}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>

        <Button onPress={handleGetStarted} style={styles.button}>
          {t("getStarted")}
        </Button>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  logo: {
    width: SCREEN_WIDTH * 0.5,
    height: 70,
  },
  welcomeTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  welcomeSubtitle: {
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  featuresGrid: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  featureIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    width: "100%",
  },
  rtlText: {
    writingDirection: "rtl",
    textAlign: "right",
  },
});
