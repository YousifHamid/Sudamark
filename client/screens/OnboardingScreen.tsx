import React, { useState, useRef } from "react";
import { View, StyleSheet, Pressable, Dimensions, FlatList, ViewToken } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: "1",
    icon: "search",
    title: "Find Your Perfect Car",
    titleAr: "اعثر على سيارتك المثالية",
    description: "Browse thousands of cars from trusted sellers across Sudan and the region",
    descriptionAr: "تصفح آلاف السيارات من بائعين موثوقين في السودان والمنطقة",
  },
  {
    id: "2",
    icon: "shield",
    title: "Verified Services",
    titleAr: "خدمات موثوقة",
    description: "Connect with mechanics, electricians, lawyers and inspection centers",
    descriptionAr: "تواصل مع الميكانيكيين والكهربائيين والمحامين ومراكز الفحص",
  },
  {
    id: "3",
    icon: "check-circle",
    title: "Buy & Sell with Confidence",
    titleAr: "اشترِ وبِع بثقة",
    description: "Safe transactions and trusted community for all your automotive needs",
    descriptionAr: "معاملات آمنة ومجتمع موثوق لجميع احتياجاتك السيارات",
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const progress = useSharedValue(0);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
      progress.value = withSpring(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onComplete();
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={[styles.iconCircle, { backgroundColor: theme.primary + "15" }]}>
        <Feather name={item.icon} size={48} color={theme.primary} />
      </View>
      <ThemedText type="h2" style={styles.slideTitle}>{item.title}</ThemedText>
      <ThemedText type="h4" style={[styles.slideTitleAr, { color: theme.primary }]}>
        {item.titleAr}
      </ThemedText>
      <ThemedText style={[styles.slideDescription, { color: theme.textSecondary }]}>
        {item.description}
      </ThemedText>
      <ThemedText style={[styles.slideDescriptionAr, { color: theme.textSecondary }]}>
        {item.descriptionAr}
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <ThemedText type="link">Skip</ThemedText>
        </Pressable>
      </View>

      <View style={styles.logoContainer}>
        <Image
          source={require("../../attached_assets/ARABATY2_1766663501110.png")}
          style={styles.logo}
          contentFit="contain"
        />
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        style={styles.slideList}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { backgroundColor: theme.border },
                currentIndex === index && { backgroundColor: theme.primary, width: 24 },
              ]}
            />
          ))}
        </View>

        <Button onPress={handleNext} style={styles.nextButton}>
          {currentIndex === SLIDES.length - 1 ? "Get Started" : "Next"}
        </Button>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.lg,
  },
  skipButton: {
    padding: Spacing.sm,
  },
  logoContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  logo: {
    width: 200,
    height: 120,
  },
  slideList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  slideTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  slideTitleAr: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  slideDescription: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  slideDescriptionAr: {
    textAlign: "center",
    writingDirection: "rtl",
  },
  footer: {
    paddingHorizontal: Spacing.xl,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    marginBottom: Spacing.md,
  },
});
