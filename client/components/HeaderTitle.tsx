import React from "react";
import { View, StyleSheet, Pressable, Text, Alert, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { ThemedText } from "./ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

import { Platform } from "react-native";

export function HeaderTitle() {
  const { t, isRTL } = useLanguage();
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleSellPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isAuthenticated) {
      Alert.alert(
        isRTL ? "تسجيل الدخول مطلوب" : "Login Required",
        isRTL ? "يجب تسجيل الدخول لإضافة إعلان" : "Please login to post a listing",
        [
          { text: isRTL ? "إلغاء" : "Cancel", style: "cancel" },
          {
            text: isRTL ? "تسجيل الدخول" : "Login",
            onPress: () => navigation.navigate("Login" as any)
          }
        ]
      );
      return;
    }
    navigation.navigate("PostCar");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const timeText = hour < 12
      ? (isRTL ? "صباح الخير" : "Good Morning")
      : (isRTL ? "مساء الخير" : "Good Evening");

    // Get first name safely
    const firstName = user?.name ? user.name.split(' ')[0] : (isRTL ? "يا غالي" : "Guest");
    return `${timeText}, ${firstName}`;
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.logoSection}>
        <Image
          source={require("../../assets/images/sudmark_logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.slogan, { color: theme.textSecondary }]}>
          {isRTL ? "يجمعنا كلنا والخير يعمنا" : "Bringing us together"}
        </Text>
      </View>

      <View style={styles.leftSection}>
        <View style={styles.greetingContainer}>
          <ThemedText style={{ fontSize: 11, fontWeight: "700", color: theme.primary }}>
            {getGreeting()}
          </ThemedText>
          <ThemedText style={{ fontSize: 9, color: theme.textSecondary, marginTop: 1 }}>
            {isRTL ? "السودان" : "Sudan"}
          </ThemedText>
        </View>

        <Pressable
          style={[styles.bellButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
          onPress={() => {
            Haptics.selectionAsync();
            Alert.alert(isRTL ? "الإشعارات" : "Notifications", isRTL ? "لا توجد إشعارات جديدة" : "No new notifications");
          }}
        >
          <Feather name="bell" size={16} color={theme.text} />
          <View style={[styles.notificationBadge, { backgroundColor: theme.primary }]} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    flexDirection: "row", // Start -> End
    justifyContent: "center", // Center everything together
    alignItems: "center",
    width: "100%",
    gap: 0, // Closes gap
    paddingHorizontal: 0,
    paddingRight: 70, // Increased shift inwards (Left in RTL)
  },
  logoSection: {
    alignItems: "center",
    marginTop: 14, // Moved down further
    marginLeft: 0, // Ensure no extra margin
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  greetingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 12, // Pushes text down to align with Logo
  },
  bellButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  notificationBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  slogan: {
    fontSize: 9,
    fontWeight: "500",
    textAlign: "center",
    marginTop: -4,
  },
  logo: {
    width: 220,
    height: 75,
  },
  separator: {
    display: 'none'
  },
});
