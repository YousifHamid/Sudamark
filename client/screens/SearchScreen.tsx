import React, { useState, useMemo } from "react";
import { View, StyleSheet, FlatList, TextInput, Pressable, Modal, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { CarCard } from "@/components/CarCard";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useCars } from "@/hooks/useCars";
import { useAuth } from "@/contexts/AuthContext";

type SearchScreenRouteProp = RouteProp<RootStackParamList, "Search">;

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 65;
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<SearchScreenRouteProp>();
  const { cars, favorites } = useCars();
  const { user } = useAuth();

  const isSpecialCategory = route.params?.category === "my-listings" || route.params?.category === "favorites";
  const specialMode = route.params?.category;

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    isSpecialCategory ? null : (route.params?.category || null)
  );
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [tempCity, setTempCity] = useState<string | null>(selectedCity);
  const [tempCategory, setTempCategory] = useState<string | null>(null);
  const [tempCondition, setTempCondition] = useState<string | null>(selectedCondition);
  const [tempMinPrice, setTempMinPrice] = useState(minPrice);
  const [tempMaxPrice, setTempMaxPrice] = useState(maxPrice);

  const cities = [
    { id: "khartoum", labelKey: "khartoum" },
    { id: "omdurman", labelKey: "omdurman" },
    { id: "bahri", labelKey: "bahri" },
    { id: "portSudan", labelKey: "portSudan" },
    { id: "kassala", labelKey: "kassala" },
  ];

  const categories = [
    { id: "sedan", labelKey: "sedan" },
    { id: "suv", labelKey: "suv" },
    { id: "truck", labelKey: "truck" },
  ];

  const conditions = [
    { id: "excellent", labelKey: "excellent", ar: "ممتازة", en: "Excellent" },
    { id: "good", labelKey: "good", ar: "جيدة", en: "Good" },
    { id: "fair", labelKey: "fair", ar: "مقبولة", en: "Fair" },
  ];

  const filteredCars = useMemo(() => {
    let baseCars = cars;

    if (specialMode === "my-listings") {
      baseCars = cars.filter((car) => car.sellerId === user?.id);
    } else if (specialMode === "favorites") {
      baseCars = cars.filter((car) => favorites.includes(car.id));
    }

    return baseCars.filter((car) => {
      const matchesSearch = car.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.model.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCity = !selectedCity || car.city === selectedCity;
      const matchesCategory = !selectedCategory || car.category === selectedCategory;
      const matchesCondition = !selectedCondition || car.condition === selectedCondition;
      const matchesMinPrice = !minPrice || car.price >= parseInt(minPrice);
      const matchesMaxPrice = !maxPrice || car.price <= parseInt(maxPrice);
      return matchesSearch && matchesCity && matchesCategory && matchesCondition && matchesMinPrice && matchesMaxPrice;
    });
  }, [cars, searchQuery, selectedCity, selectedCategory, selectedCondition, minPrice, maxPrice, favorites, user?.id, specialMode]);

  const activeFiltersCount = [selectedCity, selectedCategory, selectedCondition, minPrice, maxPrice].filter(Boolean).length;

  const openFilterModal = () => {
    setTempCity(selectedCity);
    setTempCategory(isSpecialCategory ? null : selectedCategory);
    setTempCondition(selectedCondition);
    setTempMinPrice(minPrice);
    setTempMaxPrice(maxPrice);
    setShowFilterModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const applyFilters = () => {
    setSelectedCity(tempCity);
    setSelectedCategory(tempCategory);
    setSelectedCondition(tempCondition);
    setMinPrice(tempMinPrice);
    setMaxPrice(tempMaxPrice);
    setShowFilterModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const resetFilters = () => {
    setTempCity(null);
    setTempCategory(null);
    setTempCondition(null);
    setTempMinPrice("");
    setTempMaxPrice("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const FilterChip = ({ label, isSelected, onPress }: { label: string; isSelected: boolean; onPress: () => void }) => (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterChip,
        { backgroundColor: theme.backgroundSecondary },
        isSelected && { backgroundColor: theme.primary },
      ]}
    >
      <ThemedText
        type="small"
        style={[
          isSelected ? { color: "#FFFFFF" } : undefined,
          isRTL && styles.rtlText,
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  const getScreenTitle = () => {
    if (specialMode === "my-listings") {
      return t("myListings");
    } else if (specialMode === "favorites") {
      return t("favorites");
    }
    return t("searchCars");
  };

  const getEmptyMessage = () => {
    if (specialMode === "my-listings") {
      return isRTL ? "لم تقم بإضافة أي إعلانات بعد" : "You haven't posted any listings yet";
    } else if (specialMode === "favorites") {
      return isRTL ? "لم تقم بإضافة أي سيارات للمفضلة" : "You haven't added any favorites yet";
    }
    return t("adjustFilters");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.searchContainer, { backgroundColor: theme.backgroundDefault, paddingTop: insets.top + Spacing.sm }]}>
        {isSpecialCategory ? (
          <ThemedText type="h3" style={[styles.screenTitle, isRTL && styles.rtlText]}>
            {getScreenTitle()}
          </ThemedText>
        ) : null}
        <View style={[styles.searchBar, { backgroundColor: theme.backgroundSecondary }, isRTL && styles.searchBarRTL]}>
          <Pressable onPress={openFilterModal} style={[styles.filterButton, { backgroundColor: theme.primary + "15" }]}>
            <Feather name="sliders" size={20} color={theme.primary} />
            {activeFiltersCount > 0 ? (
              <View style={[styles.filterBadge, { backgroundColor: theme.primary }]}>
                <ThemedText style={styles.filterBadgeText}>{activeFiltersCount}</ThemedText>
              </View>
            ) : null}
          </Pressable>
          <TextInput
            style={[styles.searchInput, { color: theme.text }, isRTL && styles.searchInputRTL]}
            placeholder={t("searchCars")}
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign={isRTL ? "right" : "left"}
          />
          <Feather name="search" size={20} color={theme.textSecondary} />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={20} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={filteredCars}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{
          paddingHorizontal: Spacing.lg,
          paddingTop: Spacing.md,
          paddingBottom: tabBarHeight + Spacing.xl + 80,
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
            <Feather name={isSpecialCategory ? (route.params?.category === "favorites" ? "heart" : "list") : "search"} size={48} color={theme.textSecondary} />
            <ThemedText type="h4" style={[styles.emptyTitle, isRTL && styles.rtlText]}>{t("noCarsFound")}</ThemedText>
            <ThemedText style={[{ color: theme.textSecondary, textAlign: "center" }, isRTL && styles.rtlText]}>
              {getEmptyMessage()}
            </ThemedText>
          </View>
        }
      />

      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={[styles.modalHeader, isRTL && styles.modalHeaderRTL]}>
              <ThemedText type="h3" style={isRTL ? styles.rtlText : undefined}>{t("filters")}</ThemedText>
              <Pressable onPress={() => setShowFilterModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.filterSection}>
                <ThemedText type="h4" style={[styles.filterSectionTitle, isRTL && styles.rtlText]}>{t("filterPrice")}</ThemedText>
                <View style={[styles.priceInputsRow, isRTL && styles.priceInputsRowRTL]}>
                  <View style={styles.priceInputContainer}>
                    <TextInput
                      style={[styles.priceInput, { backgroundColor: theme.backgroundSecondary, color: theme.text }, isRTL && styles.rtlText]}
                      placeholder={t("minPrice")}
                      placeholderTextColor={theme.textSecondary}
                      value={tempMinPrice}
                      onChangeText={setTempMinPrice}
                      keyboardType="numeric"
                      textAlign={isRTL ? "right" : "left"}
                    />
                  </View>
                  <ThemedText style={{ color: theme.textSecondary }}>-</ThemedText>
                  <View style={styles.priceInputContainer}>
                    <TextInput
                      style={[styles.priceInput, { backgroundColor: theme.backgroundSecondary, color: theme.text }, isRTL && styles.rtlText]}
                      placeholder={t("maxPrice")}
                      placeholderTextColor={theme.textSecondary}
                      value={tempMaxPrice}
                      onChangeText={setTempMaxPrice}
                      keyboardType="numeric"
                      textAlign={isRTL ? "right" : "left"}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.filterSection}>
                <ThemedText type="h4" style={[styles.filterSectionTitle, isRTL && styles.rtlText]}>{t("filterLocation")}</ThemedText>
                <View style={[styles.chipsContainer, isRTL && styles.chipsContainerRTL]}>
                  <FilterChip
                    label={t("allLocations")}
                    isSelected={tempCity === null}
                    onPress={() => setTempCity(null)}
                  />
                  {cities.map((city) => (
                    <FilterChip
                      key={city.id}
                      label={t(city.labelKey)}
                      isSelected={tempCity === city.id}
                      onPress={() => setTempCity(city.id)}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <ThemedText type="h4" style={[styles.filterSectionTitle, isRTL && styles.rtlText]}>{t("filterType")}</ThemedText>
                <View style={[styles.chipsContainer, isRTL && styles.chipsContainerRTL]}>
                  <FilterChip
                    label={t("allTypes")}
                    isSelected={tempCategory === null}
                    onPress={() => setTempCategory(null)}
                  />
                  {categories.map((category) => (
                    <FilterChip
                      key={category.id}
                      label={t(category.labelKey)}
                      isSelected={tempCategory === category.id}
                      onPress={() => setTempCategory(category.id)}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <ThemedText type="h4" style={[styles.filterSectionTitle, isRTL && styles.rtlText]}>{t("filterCondition")}</ThemedText>
                <View style={[styles.chipsContainer, isRTL && styles.chipsContainerRTL]}>
                  <FilterChip
                    label={t("allConditions")}
                    isSelected={tempCondition === null}
                    onPress={() => setTempCondition(null)}
                  />
                  {conditions.map((condition) => (
                    <FilterChip
                      key={condition.id}
                      label={isRTL ? condition.ar : condition.en}
                      isSelected={tempCondition === condition.id}
                      onPress={() => setTempCondition(condition.id)}
                    />
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, isRTL && styles.modalFooterRTL]}>
              <Pressable
                style={[styles.resetButton, { borderColor: theme.border }]}
                onPress={resetFilters}
              >
                <ThemedText style={{ color: theme.text }}>{t("resetFilters")}</ThemedText>
              </Pressable>
              <Button onPress={applyFilters} style={styles.applyButton}>
                {t("applyFilters")}
              </Button>
            </View>
          </ThemedView>
        </View>
      </Modal>
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
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchInputRTL: {
    textAlign: "right",
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
  screenTitle: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  rtlText: {
    writingDirection: "rtl",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalHeaderRTL: {
    flexDirection: "row-reverse",
  },
  modalScroll: {
    paddingHorizontal: Spacing.lg,
  },
  filterSection: {
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  filterSectionTitle: {
    marginBottom: Spacing.md,
  },
  priceInputsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  priceInputsRowRTL: {
    flexDirection: "row-reverse",
  },
  priceInputContainer: {
    flex: 1,
  },
  priceInput: {
    height: 48,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  chipsContainerRTL: {
    flexDirection: "row-reverse",
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  modalFooterRTL: {
    flexDirection: "row-reverse",
  },
  resetButton: {
    flex: 1,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  applyButton: {
    flex: 2,
  },
});
