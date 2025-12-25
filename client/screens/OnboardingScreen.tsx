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
  textKey: string;
}

const FEATURES: FeatureItem[] = [
  {
    id: "1",
    icon: "list",
    textKey: "welcomeFeature1",
  },
  {
    id: "2",
    icon: "message-circle",
    textKey: "welcomeFeature2",
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
          {FEATURES.map((feature) => (
            <View 
              key={feature.id} 
              style={[
                styles.featureCard,
                { backgroundColor: theme.primary + "10" }
              ]}
            >
              <View style={[styles.featureIconCircle, { backgroundColor: theme.primary }]}>
                <Feather name={feature.icon} size={20} color="#FFFFFF" />
              </View>
              <ThemedText style={[styles.featureText, isRTL && styles.rtlText]}>
                {t(feature.textKey)}
              </ThemedText>
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
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  featureIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
  },
  button: {
    width: "100%",
  },
  rtlText: {
    writingDirection: "rtl",
    textAlign: "right",
  },
});
