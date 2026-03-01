import { Feather } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ServiceProviderCard } from "@/components/ServiceProviderCard";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useServiceProviders } from "@/hooks/useServiceProviders";
import { useTheme } from "@/hooks/useTheme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getApiUrl } from "@/lib/query-client";
import { CITIES } from "@shared/constants";


interface ServiceCategory {
  id: string;
  key: string;
  nameAr: string;
  nameEn: string;
  icon: string;
}

export default function ServicesScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { providers, refreshProviders } = useServiceProviders();
  const [activeTab, setActiveTab] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [showCityModal, setShowCityModal] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${getApiUrl()}api/service-categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (e) {
      console.error("Failed to fetch categories", e);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshProviders();
      await fetchCategories();
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }, [refreshProviders]);

  const fallbackCategories = [
    { key: "mechanic", nameAr: "ميكانيكي", nameEn: "Mechanic", icon: "tool" },
    { key: "electrician", nameAr: "كهربائي", nameEn: "Electrician", icon: "zap" },
    { key: "inspectionCenter", nameAr: "مركز فحص", nameEn: "Inspection Center", icon: "search" },
    { key: "spare_parts", nameAr: "اسبيرات وقطع غيار", nameEn: "Spare Parts", icon: "settings" },
    { key: "lawyer", nameAr: "محامي", nameEn: "Lawyer", icon: "briefcase" },
  ];

  const activeCategories = categories.length > 0 ? categories : fallbackCategories;

  const tabs = [
    { id: "all", label: t("all"), icon: "grid" as const },
    ...activeCategories.map(c => ({
      id: c.key,
      label: isRTL ? c.nameAr : c.nameEn,
      icon: (c.icon || "tool") as any
    }))
  ];

  const filteredProviders = useMemo(() => {
    return providers.filter((p) => {
      const matchesTab = activeTab === "all" || p.role === activeTab;
      const trimmedQuery = searchQuery.trim().toLowerCase();
      const matchesQuery = !trimmedQuery || p.name.toLowerCase().includes(trimmedQuery);
      const matchesCity = !selectedCity || p.city === selectedCity;
      return matchesTab && matchesQuery && matchesCity;
    });
  }, [providers, activeTab, searchQuery, selectedCity]);


  const CityChip = ({ label, isSelected, onPress }: { label: string; isSelected: boolean; onPress: () => void }) => (
    <Pressable
      onPress={onPress}
      style={[
        styles.cityChip,
        { backgroundColor: theme.backgroundSecondary },
        isSelected && { backgroundColor: theme.primary },
      ]}
    >
      <ThemedText
        type="small"
        style={[isSelected ? { color: "#FFFFFF" } : undefined, isRTL && styles.rtlText]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      {/* Search Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.backgroundSecondary }, isRTL && styles.searchBarRTL]}>
          <Feather name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }, isRTL && styles.searchInputRTL]}
            placeholder={isRTL ? "ابحث عن اسم الفني او المحل التجاري..." : "Search for a technician or store..."}
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign={isRTL ? "right" : "left"}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={18} color={theme.textSecondary} />
            </Pressable>
          ) : null}
          <View style={[styles.verticalDivider, { backgroundColor: theme.border }]} />
          <Pressable
            onPress={() => setShowCityModal(true)}
            style={styles.citySelector}
          >
            <Feather name="map-pin" size={16} color={selectedCity ? theme.primary : theme.textSecondary} />
            <ThemedText type="small" numberOfLines={1} style={[styles.cityText, { color: selectedCity ? theme.primary : theme.textSecondary }]}>
              {selectedCity ? t(CITIES.find(c => c.id === selectedCity)?.labelKey || selectedCity) : (isRTL ? "المدينة" : "City")}
            </ThemedText>
            <Feather name="chevron-down" size={14} color={theme.textSecondary} />
          </Pressable>
        </View>

        {(searchQuery || selectedCity || activeTab !== "all") && (
          <Pressable
            onPress={() => {
              setSearchQuery("");
              setSelectedCity(null);
              setActiveTab("all");
            }}
            style={styles.clearFilters}
          >
            <ThemedText type="small" style={{ color: theme.primary }}>
              {isRTL ? "إلغاء البحث المخصص" : "Clear Filters"}
            </ThemedText>
            <Feather name="refresh-cw" size={12} color={theme.primary} />
          </Pressable>
        )}
      </View>

      <Pressable
        onPress={() => navigation.navigate("AddServiceRequest")}
        style={[
          styles.addServiceButton,
          { backgroundColor: theme.primary },
        ]}
      >
        <Feather name="plus" size={18} color="#FFFFFF" />
        <ThemedText
          style={[
            styles.addServiceButtonText,
            isRTL && styles.rtlText,
          ]}
        >
          {t("addServiceRequest")}
        </ThemedText>
      </Pressable>


      <View
        style={[styles.tabsContainer]}
      >
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={tabs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.tabsContent}
          inverted={isRTL}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setActiveTab(item.id)}
              style={[
                styles.tab,
                { backgroundColor: theme.backgroundSecondary },
                activeTab === item.id && { backgroundColor: theme.primary },
              ]}
            >
              <Feather
                name={item.icon}
                size={16}
                color={activeTab === item.id ? "#FFFFFF" : theme.textSecondary}
              />
              <ThemedText
                type="small"
                style={[
                  activeTab === item.id ? { color: "#FFFFFF" } : undefined,
                  isRTL && styles.rtlText,
                ]}
              >
                {item.label}
              </ThemedText>
            </Pressable>
          )}
        />
      </View>

      <FlatList
        data={filteredProviders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: Spacing.lg,
          paddingTop: Spacing.md,
          paddingBottom: tabBarHeight + Spacing.xl,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        renderItem={({ item }) => {
          const cat = activeCategories.find(c => c.key === item.role);
          return (
            <ServiceProviderCard
              provider={item}
              categoryLabel={cat ? (isRTL ? cat.nameAr : cat.nameEn) : t(item.role)}
              categoryIcon={cat?.icon}
              onPress={() =>
                navigation.navigate("ServiceProviderDetail", { provider: item })
              }
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="users" size={48} color={theme.textSecondary} />
            <ThemedText
              type="h4"
              style={[styles.emptyTitle, isRTL && styles.rtlText]}
            >
              {t("noProvidersFound")}
            </ThemedText>
            <ThemedText
              style={[
                { color: theme.textSecondary, textAlign: "center" },
                isRTL && styles.rtlText,
              ]}
            >
              {t("checkBackLater")}
            </ThemedText>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      />

      {/* City Picker Modal */}
      <Modal
        visible={showCityModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={[styles.modalHeader, isRTL && styles.modalHeaderRTL]}>
              <ThemedText type="h3">{isRTL ? "اختر المدينة" : "Select City"}</ThemedText>
              <Pressable onPress={() => setShowCityModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalScroll}>
              <View style={[styles.chipsContainer, isRTL && styles.chipsContainerRTL]}>
                <CityChip
                  label={isRTL ? "كل المدن" : "All Cities"}
                  isSelected={selectedCity === null}
                  onPress={() => {
                    setSelectedCity(null);
                    setShowCityModal(false);
                  }}
                />
                {CITIES.map((city) => (
                  <CityChip
                    key={city.id}
                    label={t(city.labelKey)}
                    isSelected={selectedCity === city.id}
                    onPress={() => {
                      setSelectedCity(city.id);
                      setShowCityModal(false);
                    }}
                  />
                ))}
              </View>
            </ScrollView>
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
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  searchBarRTL: {
    flexDirection: "row-reverse",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: "100%",
  },
  searchInputRTL: {
    textAlign: "right",
  },
  verticalDivider: {
    width: 1,
    height: "60%",
    marginHorizontal: Spacing.xs,
  },
  citySelector: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: 100,
    gap: 4,
  },
  cityText: {
    fontSize: 12,
  },
  tabsContainer: {
    paddingVertical: Spacing.sm,
  },
  tabsContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
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
  addServiceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  addServiceButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
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
    paddingVertical: Spacing.lg,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  chipsContainerRTL: {
    flexDirection: "row-reverse",
  },
  cityChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  clearFilters: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
});


