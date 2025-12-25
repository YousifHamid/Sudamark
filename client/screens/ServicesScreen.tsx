import React, { useState } from "react";
import { View, StyleSheet, FlatList, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { ServiceProviderCard } from "@/components/ServiceProviderCard";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useServiceProviders } from "@/hooks/useServiceProviders";

export default function ServicesScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { providers } = useServiceProviders();
  const [activeTab, setActiveTab] = useState("all");

  const TABS = [
    { id: "all", labelKey: "all", icon: "grid" as const },
    { id: "mechanic", labelKey: "mechanics", icon: "tool" as const },
    { id: "electrician", labelKey: "electricians", icon: "zap" as const },
    { id: "lawyer", labelKey: "lawyers", icon: "briefcase" as const },
    { id: "inspection_center", labelKey: "inspection", icon: "clipboard" as const },
  ];

  const filteredProviders = activeTab === "all"
    ? providers
    : providers.filter((p) => p.role === activeTab);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.tabsContainer, { paddingTop: insets.top + Spacing.sm }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TABS}
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
                {t(item.labelKey)}
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
        renderItem={({ item }) => (
          <ServiceProviderCard
            provider={item}
            onPress={() => navigation.navigate("ProviderDetail", { providerId: item.id })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="users" size={48} color={theme.textSecondary} />
            <ThemedText type="h4" style={[styles.emptyTitle, isRTL && styles.rtlText]}>{t("noProvidersFound")}</ThemedText>
            <ThemedText style={[{ color: theme.textSecondary, textAlign: "center" }, isRTL && styles.rtlText]}>
              {t("checkBackLater")}
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
});
