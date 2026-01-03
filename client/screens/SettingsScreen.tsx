import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function SettingsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { isRTL, language, setLanguage } = useLanguage();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  const toggleSwitch = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    Haptics.selectionAsync();
    setter((previousState) => !previousState);
  };

  const handleLanguageChange = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await setLanguage(language === "ar" ? "en" : "ar");
  };



  const handleDeleteAccount = () => {
    Alert.alert(
      isRTL ? "حذف الحساب" : "Delete Account",
      isRTL
        ? "هل أنت متأكد أنك تريد حذف حسابك؟ لا يمكن التراجع عن هذا الإجراء."
        : "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: isRTL ? "إلغاء" : "Cancel", style: "cancel" },
        {
          text: isRTL ? "حذف" : "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // In a real app, this would call an API
            Alert.alert(
              isRTL ? "تم الحذف" : "Deleted",
              isRTL ? "تم حذف حسابك بنجاح." : "Your account has been deleted.",
            );
          },
        },
      ],
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <View
          style={[
            styles.section,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <ThemedText
            type="h4"
            style={[styles.sectionTitle, isRTL && styles.rtlText]}
          >
            {isRTL ? "التفضيلات" : "Preferences"}
          </ThemedText>

          <View style={[styles.row, isRTL && styles.rowRTL]}>
            <View style={[styles.labelContainer, isRTL && styles.rowRTL]}>
              <Feather name="bell" size={20} color={theme.text} />
              <ThemedText style={{ marginHorizontal: Spacing.sm }}>
                {isRTL ? "الإشعارات" : "Notifications"}
              </ThemedText>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={() => toggleSwitch(setNotificationsEnabled)}
              trackColor={{ false: theme.border, true: theme.primary }}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={[styles.row, isRTL && styles.rowRTL]}>
            <View style={[styles.labelContainer, isRTL && styles.rowRTL]}>
              <Feather name="map-pin" size={20} color={theme.text} />
              <ThemedText style={{ marginHorizontal: Spacing.sm }}>
                {isRTL ? "خدمات الموقع" : "Location Services"}
              </ThemedText>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={() => toggleSwitch(setLocationEnabled)}
              trackColor={{ false: theme.border, true: theme.primary }}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={[styles.row, isRTL && styles.rowRTL]}>
            <View style={[styles.labelContainer, isRTL && styles.rowRTL]}>
              <Feather name="globe" size={20} color={theme.text} />
              <ThemedText style={{ marginHorizontal: Spacing.sm }}>
                {isRTL ? "لغة التطبيق" : "App Language"}
              </ThemedText>
            </View>
            <Pressable
              onPress={handleLanguageChange}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <ThemedText
                style={{ color: theme.primary, marginHorizontal: Spacing.xs }}
              >
                {language === "ar" ? "العربية" : "English"}
              </ThemedText>
              <Feather name="refresh-cw" size={14} color={theme.primary} />
            </Pressable>
          </View>
        </View>

        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.backgroundSecondary,
              marginTop: Spacing.lg,
            },
          ]}
        >
          <ThemedText
            type="h4"
            style={[styles.sectionTitle, isRTL && styles.rtlText]}
          >
            {isRTL ? "إعدادات تسجيل الحساب" : "Account Settings"}
          </ThemedText>



          <Pressable
            style={[styles.dangerButton, { borderColor: theme.error }]}
            onPress={handleDeleteAccount}
          >
            <ThemedText style={{ color: theme.error }}>
              {isRTL ? "حذف الحساب" : "Delete Account"}
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  section: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.xs,
  },
  rowRTL: {
    flexDirection: "row-reverse",
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  dangerButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rtlText: {
    textAlign: "right",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
});
