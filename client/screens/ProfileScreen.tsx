import React from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";
import { CompositeNavigationProp } from "@react-navigation/native";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { t, language, setLanguage, isRTL } = useLanguage();
  const navigation = useNavigation<CompositeNavigationProp<
    NativeStackNavigationProp<ProfileStackParamList>,
    NativeStackNavigationProp<RootStackParamList>
  >>();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      t("logout"),
      isRTL ? "هل أنت متأكد من تسجيل الخروج؟" : "Are you sure you want to log out?",
      [
        { text: isRTL ? "إلغاء" : "Cancel", style: "cancel" },
        {
          text: t("logout"),
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await logout();
          },
        },
      ]
    );
  };

  const handleLanguageToggle = async () => {
    Haptics.selectionAsync();
    await setLanguage(language === "ar" ? "en" : "ar");
  };

  const handleMenuPress = (id: string) => {
    Haptics.selectionAsync();
    if (id === "listings") {
      navigation.navigate("Search", { category: "my-listings" });
    } else if (id === "favorites") {
      navigation.navigate("Search", { category: "favorites" });
    }
  };

  const menuItems = [
    { id: "listings", labelKey: "myListings", icon: "list" as const, badge: undefined },
    { id: "favorites", labelKey: "favorites", icon: "heart" as const },
  ];

  const settingsItems = [
    { id: "language", labelKey: "language", icon: "globe" as const, value: language === "ar" ? "العربية" : "English", onPress: handleLanguageToggle },
    { id: "privacy", label: isRTL ? "سياسة الخصوصية" : "Privacy Policy", icon: "shield" as const, onPress: () => navigation.navigate("PrivacyPolicy") },
    { id: "settings", labelKey: "settings", icon: "settings" as const },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={[styles.profileCard, { backgroundColor: theme.backgroundDefault }]}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <ThemedText type="h2" style={{ color: "#FFFFFF" }}>
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </ThemedText>
        </View>
        <View style={styles.profileInfo}>
          <ThemedText type="h3">{user?.name || (isRTL ? "مستخدم" : "User")}</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {user?.phoneNumber || "+249 9XX XXX XXXX"}
          </ThemedText>
          <View style={[styles.roleBadge, { backgroundColor: theme.primary + "20" }]}>
            <ThemedText type="small" style={{ color: theme.primary }}>
              {t(user?.roles?.[0] === "inspection_center" ? "inspectionCenter" : (user?.roles?.[0] || "buyer"))}
            </ThemedText>
          </View>
        </View>
        <Pressable
          style={[styles.editButton, { backgroundColor: theme.backgroundSecondary }]}
          onPress={() => {
            Haptics.selectionAsync();
            // @ts-ignore
            navigation.navigate("EditProfile");
          }}
        >
          <Feather name="edit-2" size={18} color={theme.text} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }, isRTL && styles.rtlText]}>
          {isRTL ? "النشاط" : "Activity"}
        </ThemedText>
        <View style={[styles.menuCard, { backgroundColor: theme.backgroundDefault }]}>
          {menuItems.map((item, index) => (
            <Pressable
              key={item.id}
              style={[
                styles.menuItem,
                index < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
              ]}
              onPress={() => handleMenuPress(item.id)}
            >
              <View style={[styles.menuItemLeft, isRTL && styles.menuItemLeftRTL]}>
                <View style={[styles.iconContainer, { backgroundColor: theme.backgroundSecondary }]}>
                  <Feather name={item.icon} size={18} color={theme.primary} />
                </View>
                <ThemedText style={isRTL ? styles.rtlText : undefined}>{t(item.labelKey)}</ThemedText>
              </View>
              <View style={[styles.menuItemRight, isRTL && styles.menuItemRightRTL]}>
                {item.badge ? (
                  <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                    <ThemedText type="small" style={{ color: "#FFFFFF" }}>{item.badge}</ThemedText>
                  </View>
                ) : null}
                <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={20} color={theme.textSecondary} />
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }, isRTL && styles.rtlText]}>
          {t("settings")}
        </ThemedText>
        <View style={[styles.menuCard, { backgroundColor: theme.backgroundDefault }]}>
          {settingsItems.map((item, index) => (
            <Pressable
              key={item.id}
              style={[
                styles.menuItem,
                index < settingsItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
              ]}
              onPress={item.onPress || (() => Haptics.selectionAsync())}
            >
              <View style={[styles.menuItemLeft, isRTL && styles.menuItemLeftRTL]}>
                <View style={[styles.iconContainer, { backgroundColor: theme.backgroundSecondary }]}>
                  <Feather name={item.icon} size={18} color={theme.primary} />
                </View>
                <ThemedText style={isRTL ? styles.rtlText : undefined}>{"label" in item ? item.label : t(item.labelKey)}</ThemedText>
              </View>
              <View style={[styles.menuItemRight, isRTL && styles.menuItemRightRTL]}>
                {"value" in item && item.value ? (
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>{item.value}</ThemedText>
                ) : null}
                <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={20} color={theme.textSecondary} />
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable
        style={[styles.logoutButton, { backgroundColor: theme.error + "15" }]}
        onPress={handleLogout}
      >
        <Feather name="log-out" size={20} color={theme.error} />
        <ThemedText style={{ color: theme.error, marginLeft: Spacing.sm }}>{t("logout")}</ThemedText>
      </Pressable>

      <ThemedText type="small" style={[styles.version, { color: theme.textSecondary }]}>
        {isRTL ? "الإصدار 1.0.0" : "Version 1.0.0"}
      </ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  menuCard: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  menuItemLeftRTL: {
    flexDirection: "row-reverse",
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  menuItemRightRTL: {
    flexDirection: "row-reverse",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  version: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  rtlText: {
    writingDirection: "rtl",
  },
});
