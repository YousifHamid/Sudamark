import React from "react";
import { View, StyleSheet, ScrollView, Pressable, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { CarCard } from "@/components/CarCard";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useCars } from "@/hooks/useCars";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface AdBanner {
  id: string;
  titleKey: string;
  descKey: string;
  gradientColors: [string, string];
  icon: keyof typeof Feather.glyphMap;
}

const ADS: AdBanner[] = [
  {
    id: "1",
    titleKey: "adTitle1",
    descKey: "adDesc1",
    gradientColors: ["#1E3A8A", "#3B82F6"],
    icon: "tag",
  },
  {
    id: "2",
    titleKey: "adTitle2",
    descKey: "adDesc2",
    gradientColors: ["#059669", "#10B981"],
    icon: "trending-up",
  },
  {
    id: "3",
    titleKey: "adTitle3",
    descKey: "adDesc3",
    gradientColors: ["#DC2626", "#F87171"],
    icon: "clipboard",
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { cars, featuredCars } = useCars();

  const categories = [
    { id: "sedan", labelKey: "sedan", icon: "box" as const },
    { id: "suv", labelKey: "suv", icon: "truck" as const },
    { id: "sports", labelKey: "sports", icon: "zap" as const },
    { id: "luxury", labelKey: "luxury", icon: "star" as const },
    { id: "electric", labelKey: "electric", icon: "battery-charging" as const },
  ];

  const handleSearchPress = () => {
    navigation.navigate("Search", {});
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.sm,
        paddingBottom: tabBarHeight + Spacing.xl + 80,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        onPress={handleSearchPress}
        style={[
          styles.searchBar,
          { backgroundColor: theme.backgroundSecondary },
          isRTL && styles.searchBarRTL,
        ]}
      >
        <Feather name="search" size={20} color={theme.textSecondary} />
        <ThemedText style={[styles.searchPlaceholder, { color: theme.textSecondary }, isRTL && styles.rtlText]}>
          {t("searchCars")}
        </ThemedText>
        <View style={[styles.searchHint, { backgroundColor: theme.primary + "15" }]}>
          <Feather name="sliders" size={16} color={theme.primary} />
        </View>
      </Pressable>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.adsContainer}
        pagingEnabled
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH - Spacing.lg}
      >
        {ADS.map((ad) => (
          <Pressable key={ad.id} style={styles.adCard}>
            <LinearGradient
              colors={ad.gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.adGradient}
            >
              <View style={[styles.adContent, isRTL && styles.adContentRTL]}>
                <View style={styles.adIcon}>
                  <Feather name={ad.icon} size={28} color="#FFFFFF" />
                </View>
                <View style={styles.adTextContainer}>
                  <ThemedText type="h4" style={[styles.adTitle, isRTL && styles.rtlText]}>
                    {t(ad.titleKey)}
                  </ThemedText>
                  <ThemedText style={[styles.adDesc, isRTL && styles.rtlText]}>
                    {t(ad.descKey)}
                  </ThemedText>
                </View>
              </View>
              <View style={[styles.adBadge, isRTL && styles.adBadgeRTL]}>
                <ThemedText style={styles.adBadgeText}>{t("advertisement")}</ThemedText>
              </View>
            </LinearGradient>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.section}>
        <ThemedText type="h4" style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t("categories")}</ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <Pressable
              key={category.id}
              style={[styles.categoryChip, { backgroundColor: theme.backgroundSecondary }]}
              onPress={() => navigation.navigate("Search", { category: category.id })}
            >
              <Feather name={category.icon} size={18} color={theme.primary} />
              <ThemedText type="small" style={[styles.categoryLabel, isRTL && styles.rtlText]}>{t(category.labelKey)}</ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={[styles.sectionHeader, isRTL && styles.sectionHeaderRTL]}>
          <ThemedText type="h4" style={isRTL ? styles.rtlText : undefined}>{t("featuredCars")}</ThemedText>
          <Pressable onPress={() => navigation.navigate("Search", {})}>
            <ThemedText type="link">{t("seeAll")}</ThemedText>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carsRow}
        >
          {featuredCars.map((car) => (
            <CarCard
              key={car.id}
              car={car}
              horizontal
              onPress={() => navigation.navigate("CarDetail", { carId: car.id })}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={[styles.sectionHeader, isRTL && styles.sectionHeaderRTL]}>
          <ThemedText type="h4" style={isRTL ? styles.rtlText : undefined}>{t("recentListings")}</ThemedText>
        </View>
        <View style={styles.carsGrid}>
          {cars.slice(0, 4).map((car) => (
            <CarCard
              key={car.id}
              car={car}
              onPress={() => navigation.navigate("CarDetail", { carId: car.id })}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    height: 52,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  searchBarRTL: {
    flexDirection: "row-reverse",
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
  },
  searchHint: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  adsContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  adCard: {
    width: SCREEN_WIDTH - Spacing.lg * 2,
    height: 120,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  adGradient: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: "center",
  },
  adContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  adContentRTL: {
    flexDirection: "row-reverse",
  },
  adIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  adTextContainer: {
    flex: 1,
  },
  adTitle: {
    color: "#FFFFFF",
    marginBottom: Spacing.xs,
  },
  adDesc: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    lineHeight: 18,
  },
  adBadge: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  adBadgeRTL: {
    right: undefined,
    left: Spacing.sm,
  },
  adBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  section: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionHeaderRTL: {
    flexDirection: "row-reverse",
  },
  categoriesContainer: {
    paddingRight: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  categoryLabel: {
    marginLeft: Spacing.xs,
  },
  carsRow: {
    gap: Spacing.md,
    paddingRight: Spacing.lg,
  },
  carsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -Spacing.xs,
  },
  rtlText: {
    writingDirection: "rtl",
  },
});
