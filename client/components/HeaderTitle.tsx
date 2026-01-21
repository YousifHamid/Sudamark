import React from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  Alert,
  Image,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { ThemedText } from "./ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { SUPPORTED_COUNTRIES } from "@/constants/countries";

export function HeaderTitle() {
  const { t, isRTL } = useLanguage();
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const handleSellPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isAuthenticated) {
      Alert.alert(
        isRTL ? "تسجيل الدخول مطلوب" : "Login Required",
        isRTL
          ? "يجب تسجيل الدخول لإضافة إعلان"
          : "Please login to post a listing",
        [
          { text: isRTL ? "إلغاء" : "Cancel", style: "cancel" },
          {
            text: isRTL ? "تسجيل الدخول" : "Login",
            onPress: () => navigation.navigate("Login" as any),
          },
        ],
      );
      return;
    }
    navigation.navigate("PostCar");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const timeText =
      hour < 12
        ? isRTL
          ? "صباح الخير"
          : "Good Morning"
        : isRTL
          ? "مساء الخير"
          : "Good Evening";

    // Get first name safely
    const firstName = user?.name
      ? user.name.split(" ")[0]
      : isRTL
        ? "يا غالي"
        : "Guest";
    return `${timeText}, ${firstName}`;
  };

  const getUserCountry = () => {
    if (!user?.countryCode) return isRTL ? "السودان" : "Sudan";
    const country = SUPPORTED_COUNTRIES.find(
      (c) => c.dialCode === user.countryCode,
    );
    if (!country) return isRTL ? "السودان" : "Sudan";
    return isRTL ? country.nameAr : country.name;
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.logoSection}>
        <Image
          source={require("../../assets/images/sudamark_logo.png")}
          style={styles.logo}
          resizeMode="contain"
          width={40}
          height={40}
        />
        <Text style={[styles.slogan, { color: theme.textSecondary }]}>
          {isRTL ? "يجمعنا كلنا والخير يعمنا" : "Bringing us together"}
        </Text>
      </View>

      <View style={styles.leftSection}>
        <View style={styles.greetingContainer}>
          <ThemedText
            style={{ fontSize: 12, fontWeight: "700", color: theme.primary }}
          >
            {getGreeting()}
          </ThemedText>
          <ThemedText
            style={{ fontSize: 12, color: theme.textSecondary, marginTop: .5 }}
          >
            {getUserCountry()}
          </ThemedText>
        </View>


      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    flexDirection: "row", // Start -> End
    justifyContent: "space-between", // Center everything together
    alignItems: "center",
    width: "100%",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  logoSection: {
    alignItems: "center",
    marginTop: 0,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  greetingContainer: {
    alignItems: "flex-end", // Align text to the end
    justifyContent: "center",
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
    display: "none",
  },
});
