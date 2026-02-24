import { Feather } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ServiceProviderCard } from "@/components/ServiceProviderCard";
import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useServiceProviders } from "@/hooks/useServiceProviders";
import { useTheme } from "@/hooks/useTheme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getApiUrl } from "@/lib/query-client";

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

  const tabs = [
    { id: "all", label: t("all"), icon: "grid" as const },
    ...categories.map(c => ({
      id: c.key,
      label: isRTL ? c.nameAr : c.nameEn,
      icon: (c.icon || "tool") as any
    }))
  ];

  const filteredProviders =
    activeTab === "all"
      ? providers
      : providers.filter((p) => p.role === activeTab);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View
        style={[styles.tabsContainer, { paddingTop: insets.top + Spacing.sm }]}
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

      {/* Add Service Request Button */}
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
          const cat = categories.find(c => c.key === item.role);
          return (
            <ServiceProviderCard
              provider={item}
              categoryLabel={cat ? (isRTL ? cat.nameAr : cat.nameEn) : item.role}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});
