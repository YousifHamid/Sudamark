import React from "react";
import { View, StyleSheet, ScrollView, Pressable, Dimensions, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { CarCard } from "@/components/CarCard";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useCars } from "@/hooks/useCars";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
        paddingBottom: tabBarHeight + Spacing.xl,
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
