import React from "react";
import { View, StyleSheet, ScrollView, Pressable, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { CarCard } from "@/components/CarCard";
import { ImageSlider } from "@/components/ImageSlider";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useCars } from "@/hooks/useCars";

const { width: SCREEN_WIDTH } = Dimensions.get("window");


const SLIDER_IMAGES = [
  { id: "1", imageUrl: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80" },
  { id: "2", imageUrl: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&q=80" },
  { id: "3", imageUrl: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80" },
  { id: "4", imageUrl: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80" },
  { id: "5", imageUrl: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80" },
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
      <ImageSlider images={SLIDER_IMAGES} autoPlayInterval={4000} />

      <Pressable
        onPress={handleSearchPress}
        style={[
          styles.searchBar,
          { backgroundColor: theme.backgroundSecondary },
          isRTL && styles.searchBarRTL,
        ]}
      >
        <Feather name="search" size={22} color={theme.textSecondary} />
        <ThemedText style={[styles.searchPlaceholder, { color: theme.textSecondary }, isRTL && styles.rtlText]}>
          {t("searchCars")}
        </ThemedText>
        <View style={[styles.searchHint, { backgroundColor: theme.primary + "15" }]}>
          <Feather name="sliders" size={18} color={theme.primary} />
        </View>
      </Pressable>

      <View style={styles.sponsorSection}>
        <LinearGradient
          colors={["#F97316", "#FB923C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sponsorCard}
        >
          <View style={[styles.sponsorContent, isRTL && styles.sponsorContentRTL]}>
            <View style={styles.sponsorLogoContainer}>
              <View style={styles.sponsorLogo}>
                <Feather name="award" size={32} color="#F97316" />
              </View>
            </View>
            <View style={styles.sponsorTextContainer}>
              <ThemedText style={[styles.sponsorLabel, isRTL && styles.rtlText]}>
                {t("officialSponsor")}
              </ThemedText>
              <ThemedText type="h3" style={[styles.sponsorName, isRTL && styles.rtlText]}>
                {t("sponsorName")}
              </ThemedText>
            </View>
          </View>
        </LinearGradient>
      </View>

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
              <Feather name={category.icon} size={20} color={theme.primary} />
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
    gap: Spacing.md,
  },
  rtlText: {
    writingDirection: "rtl",
  },
  sponsorSection: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  sponsorCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sponsorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  sponsorContentRTL: {
    flexDirection: "row-reverse",
  },
  sponsorLogoContainer: {
    padding: 4,
    borderRadius: BorderRadius.lg,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  sponsorLogo: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  sponsorTextContainer: {
    flex: 1,
  },
  sponsorLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    marginBottom: Spacing.xs,
  },
  sponsorName: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
