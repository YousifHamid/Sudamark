import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  TextInput,
  Linking,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import {
  useNavigation,
  CompositeNavigationProp,
} from "@react-navigation/native";
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

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { t, language, setLanguage, isRTL } = useLanguage();
  const navigation =
    useNavigation<
      CompositeNavigationProp<
        NativeStackNavigationProp<ProfileStackParamList>,
        NativeStackNavigationProp<RootStackParamList>
      >
    >();
  const { user, logout, refreshUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUser();
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshUser]);

  const handleLogout = () => {
    Alert.alert(
      t("logout"),
      isRTL
        ? "هل أنت متأكد من تسجيل الخروج؟"
        : "Are you sure you want to log out?",
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
      ],
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
    {
      id: "listings",
      labelKey: "myListings",
      icon: "list" as const,
      badge: undefined,
    },
    { id: "favorites", labelKey: "favorites", icon: "heart" as const },
  ];

  const settingsItems = [
    {
      id: "advertise",
      label: isRTL ? "أعلن معنا / كن شريكاً" : "Advertise / Partner with us",
      icon: "briefcase" as const,
      onPress: () => setShowAdModal(true),
    },
    {
      id: "language",
      labelKey: "language",
      icon: "globe" as const,
      value: language === "ar" ? "العربية" : "English",
      onPress: handleLanguageToggle,
    },
    {
      id: "privacy",
      label: isRTL ? "سياسة الخصوصية" : "Privacy Policy",
      icon: "shield" as const,
      onPress: () => navigation.navigate("PrivacyPolicy"),
    },
    {
      id: "settings",
      labelKey: "settings",
      icon: "settings" as const,
      onPress: () => navigation.navigate("Settings"),
    },
  ];

  const [showAdModal, setShowAdModal] = useState(false);
  const [adName, setAdName] = useState("");
  const [adBusiness, setAdBusiness] = useState("");
  const [adMessage, setAdMessage] = useState("");

  const handleSendAdRequest = async () => {
    if (!adName || !adMessage) {
      Alert.alert(
        isRTL ? "خطأ" : "Error",
        isRTL ? "يرجى ملء الاسم والرسالة" : "Please fill name and message",
      );
      return;
    }

    // Default to main number, could offer choice
    const phone = "201157155248";
    const cleanPhone = phone.replace(/[^0-9]/g, "");

    const text = isRTL
      ? `*طلب إعلان / شراكة*\nالاسم: ${adName}\nالنشاط: ${adBusiness}\nالرسالة: ${adMessage}`
      : `*Ad/Partnership Request*\nName: ${adName}\nBusiness: ${adBusiness}\nMessage: ${adMessage}`;

    const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
    const webUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;

    try {
      await Linking.openURL(url);
      setShowAdModal(false);
    } catch (e) {
      try {
        await Linking.openURL(webUrl);
        setShowAdModal(false);
      } catch (e2) {
        Alert.alert("Error", "Could not open WhatsApp");
      }
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      alwaysBounceVertical={true}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
          colors={[theme.primary]}
          progressViewOffset={headerHeight + Spacing.xl}
        />
      }
    >
      <View
        style={[
          styles.profileCard,
          { backgroundColor: theme.backgroundDefault },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <ThemedText type="h2" style={{ color: "#FFFFFF" }}>
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </ThemedText>
        </View>
        <View style={styles.profileInfo}>
          <ThemedText type="h3">
            {user?.name || (isRTL ? "مستخدم" : "User")}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {user?.phoneNumber || "+249 9XX XXX XXXX"}
          </ThemedText>
          <View
            style={[
              styles.roleBadge,
              { backgroundColor: theme.primary + "20" },
            ]}
          >
            <ThemedText type="small" style={{ color: theme.primary }}>
              {t(
                user?.roles?.[0] === "inspection_center"
                  ? "inspectionCenter"
                  : user?.roles?.[0] || "buyer",
              )}
            </ThemedText>
          </View>
        </View>
        <Pressable
          style={[
            styles.editButton,
            { backgroundColor: theme.backgroundSecondary },
          ]}
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
        <ThemedText
          type="small"
          style={[
            styles.sectionTitle,
            { color: theme.textSecondary },
            isRTL && styles.rtlText,
          ]}
        >
          {isRTL ? "النشاط" : "Activity"}
        </ThemedText>
        <View
          style={[
            styles.menuCard,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          {menuItems.map((item, index) => (
            <Pressable
              key={item.id}
              style={[
                styles.menuItem,
                index < menuItems.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border,
                },
              ]}
              onPress={() => handleMenuPress(item.id)}
            >
              <View
                style={styles.menuItemLeft}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: theme.backgroundSecondary },
                  ]}
                >
                  <Feather name={item.icon} size={18} color={theme.primary} />
                </View>
                <ThemedText style={isRTL ? styles.rtlText : undefined}>
                  {t(item.labelKey)}
                </ThemedText>
              </View>
              <View
                style={styles.menuItemRight}
              >
                {item.badge ? (
                  <View
                    style={[styles.badge, { backgroundColor: theme.primary }]}
                  >
                    <ThemedText type="small" style={{ color: "#FFFFFF" }}>
                      {item.badge}
                    </ThemedText>
                  </View>
                ) : null}
                <Feather
                  name={isRTL ? "chevron-left" : "chevron-right"}
                  size={20}
                  color={theme.textSecondary}
                />
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText
          type="small"
          style={[
            styles.sectionTitle,
            { color: theme.textSecondary },
            isRTL && styles.rtlText,
          ]}
        >
          {t("settings")}
        </ThemedText>
        <View
          style={[
            styles.menuCard,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          {settingsItems.map((item, index) => (
            <Pressable
              key={item.id}
              style={[
                styles.menuItem,
                index < settingsItems.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border,
                },
              ]}
              onPress={item.onPress || (() => Haptics.selectionAsync())}
            >
              <View
                style={styles.menuItemLeft}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: theme.backgroundSecondary },
                  ]}
                >
                  <Feather name={item.icon} size={18} color={theme.primary} />
                </View>
                <ThemedText style={isRTL ? styles.rtlText : undefined}>
                  {"label" in item ? item.label : t(item.labelKey)}
                </ThemedText>
              </View>
              <View
                style={styles.menuItemRight}
              >
                {"value" in item && item.value ? (
                  <ThemedText
                    type="small"
                    style={{ color: theme.textSecondary }}
                  >
                    {item.value}
                  </ThemedText>
                ) : null}
                <Feather
                  name={isRTL ? "chevron-left" : "chevron-right"}
                  size={20}
                  color={theme.textSecondary}
                />
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
        <ThemedText style={{ color: theme.error, marginLeft: Spacing.sm }}>
          {t("logout")}
        </ThemedText>
      </Pressable>

      <ThemedText
        type="small"
        style={[styles.version, { color: theme.textSecondary }]}
      >
        {isRTL ? "الإصدار 1.0.0" : "Version 1.0.0"}
      </ThemedText>

      <Modal
        visible={showAdModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAdModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAdModal(false)}
        >
          <Pressable
            style={[
              styles.modalContent,
              { backgroundColor: theme.backgroundRoot, maxHeight: "90%" },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.modalHeader]}>
              <Pressable
                onPress={() => setShowAdModal(false)}
                style={{ zIndex: 1 }}
              >
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
              <ThemedText type="h3" style={styles.modalTitle}>
                {isRTL ? "أعلن معنا" : "Advertise with Us"}
              </ThemedText>
              <View style={{ width: 24 }} />
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <View style={styles.modalBody}>
                <ThemedText
                  style={{
                    marginBottom: 8,
                    textAlign: isRTL ? "right" : "left",
                  }}
                >
                  {isRTL ? "الاسم" : "Name"}
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      borderColor: theme.border,
                      textAlign: isRTL ? "right" : "left",
                    },
                  ]}
                  value={adName}
                  onChangeText={setAdName}
                  placeholder={isRTL ? "اسمك الكامل" : "Full Name"}
                  placeholderTextColor={theme.textSecondary}
                />

                <ThemedText
                  style={{
                    marginBottom: 8,
                    marginTop: 12,
                    textAlign: isRTL ? "right" : "left",
                  }}
                >
                  {isRTL ? "نوع النشاط" : "Business Type"}
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      borderColor: theme.border,
                      textAlign: isRTL ? "right" : "left",
                    },
                  ]}
                  value={adBusiness}
                  onChangeText={setAdBusiness}
                  placeholder={
                    isRTL ? "مثال: معرض سيارات" : "e.g. Car Showroom"
                  }
                  placeholderTextColor={theme.textSecondary}
                />

                <ThemedText
                  style={{
                    marginBottom: 8,
                    marginTop: 12,
                    textAlign: isRTL ? "right" : "left",
                  }}
                >
                  {isRTL ? "تفاصيل الطلب" : "Request Details"}
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      height: 100,
                      color: theme.text,
                      borderColor: theme.border,
                      textAlignVertical: "top",
                      textAlign: isRTL ? "right" : "left",
                    },
                  ]}
                  value={adMessage}
                  onChangeText={setAdMessage}
                  multiline
                  numberOfLines={4}
                  placeholder={
                    isRTL ? "اكتب تفاصيل إعلانك..." : "Enter details..."
                  }
                  placeholderTextColor={theme.textSecondary}
                />

                <Pressable
                  style={[styles.submitButton, { backgroundColor: "#25D366" }]}
                  onPress={handleSendAdRequest}
                >
                  <Feather
                    name="message-circle"
                    size={20}
                    color="white"
                    style={{ marginRight: 8 }}
                  />
                  <ThemedText style={{ color: "white", fontWeight: "bold" }}>
                    {isRTL ? "إرسال عبر واتساب" : "Send via WhatsApp"}
                  </ThemedText>
                </Pressable>

                <View style={{ marginTop: 16, alignItems: "center" }}>
                  <ThemedText
                    type="small"
                    style={{ color: theme.textSecondary }}
                  >
                    {isRTL
                      ? "أرقام التواصل المباشر:"
                      : "Direct Contact Numbers:"}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    style={{ color: theme.primary, marginTop: 4 }}
                  >
                    00201157155248 | 00249115222228
                  </ThemedText>
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView >
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
    width: "100%",
  },
  modalHeaderRTL: {
    flexDirection: "row-reverse",
  },
  modalTitle: {
    flex: 1,
    textAlign: "center",
  },
  modalBody: {},
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: 12,
    fontSize: 16,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
  },
});
