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
    { id: "new", labelKey: "newCar", icon: "check-circle" as const, color: "#10B981" },
    { id: "used", labelKey: "usedCar", icon: "refresh-cw" as const, color: "#F59E0B" },
    { id: "orneek", labelKey: "orneek", icon: "file-text" as const, color: "#3B82F6" },
    { id: "customs", labelKey: "customs", icon: "package" as const, color: "#8B5CF6" },
    { id: "body", labelKey: "body", icon: "truck" as const, color: "#EF4444" },
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
            <View style={styles.sponsorLogo}>
              <Feather name="award" size={20} color="#F97316" />
            </View>
            <View style={styles.sponsorTextContainer}>
              <ThemedText style={[styles.sponsorLabel, isRTL && styles.rtlText]}>
                {t("officialSponsor")} - {t("sponsorName")}
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
              style={[styles.categoryChip, { backgroundColor: category.color + "15" }]}
              onPress={() => navigation.navigate("Search", { category: category.id })}
            >
              <Feather name={category.icon} size={18} color={category.color} />
              <ThemedText type="small" style={[styles.categoryLabel, { color: category.color }, isRTL && styles.rtlText]}>{t(category.labelKey)}</ThemedText>
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
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  sponsorCard: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  sponsorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  sponsorContentRTL: {
    flexDirection: "row-reverse",
  },
  sponsorLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  sponsorTextContainer: {
    flex: 1,
  },
  sponsorLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
});
