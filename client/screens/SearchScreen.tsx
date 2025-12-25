import React, { useState, useMemo } from "react";
import { View, StyleSheet, FlatList, TextInput, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { CarCard } from "@/components/CarCard";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useCars } from "@/hooks/useCars";

type SearchScreenRouteProp = RouteProp<RootStackParamList, "Search">;

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<SearchScreenRouteProp>();
  const { cars } = useCars();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);

  const cities = [
    { id: "khartoum", labelKey: "khartoum" },
    { id: "omdurman", labelKey: "omdurman" },
    { id: "bahri", labelKey: "bahri" },
    { id: "portSudan", labelKey: "portSudan" },
    { id: "kassala", labelKey: "kassala" },
  ];

  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      const matchesSearch = car.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.model.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCity = !selectedCity || car.city === selectedCity;
      const matchesPrice = car.price >= priceRange[0] && car.price <= priceRange[1];
      const matchesCategory = !route.params?.category || car.category === route.params.category;
      return matchesSearch && matchesCity && matchesPrice && matchesCategory;
    });
  }, [cars, searchQuery, selectedCity, priceRange, route.params?.category]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.searchContainer, { backgroundColor: theme.backgroundDefault, paddingTop: insets.top + Spacing.sm }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.backgroundSecondary }, isRTL && styles.searchBarRTL]}>
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }, isRTL && styles.searchInputRTL]}
            placeholder={t("searchCars")}
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign={isRTL ? "right" : "left"}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={20} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>
        <View style={[styles.filtersRow, isRTL && styles.filtersRowRTL]}>
          {cities.map((city) => (
            <Pressable
              key={city.id}
              onPress={() => setSelectedCity(selectedCity === city.id ? null : city.id)}
              style={[
                styles.filterChip,
                { backgroundColor: theme.backgroundSecondary },
                selectedCity === city.id && { backgroundColor: theme.primary },
              ]}
            >
              <ThemedText
                type="small"
                style={[
                  selectedCity === city.id ? { color: "#FFFFFF" } : undefined,
                  isRTL && styles.rtlText,
                ]}
              >
                {t(city.labelKey)}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredCars}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{
          paddingHorizontal: Spacing.lg,
          paddingTop: Spacing.md,
          paddingBottom: tabBarHeight + Spacing.xl,
        }}
        columnWrapperStyle={styles.columnWrapper}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        renderItem={({ item }) => (
          <CarCard
            car={item}
            onPress={() => navigation.navigate("CarDetail", { carId: item.id })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="search" size={48} color={theme.textSecondary} />
            <ThemedText type="h4" style={[styles.emptyTitle, isRTL && styles.rtlText]}>{t("noCarsFound")}</ThemedText>
            <ThemedText style={[{ color: theme.textSecondary, textAlign: "center" }, isRTL && styles.rtlText]}>
              {t("adjustFilters")}
            </ThemedText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  searchBarRTL: {
    flexDirection: "row-reverse",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchInputRTL: {
    textAlign: "right",
  },
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  filtersRowRTL: {
    flexDirection: "row-reverse",
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: Spacing["5xl"],
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  rtlText: {
    writingDirection: "rtl",
  },
});
