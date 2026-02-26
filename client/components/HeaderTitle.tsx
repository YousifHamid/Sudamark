import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  Pressable
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { SUPPORTED_COUNTRIES } from "@/constants/countries";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/hooks/useTheme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { AnimatedHeaderBackground } from "./AnimatedHeaderBackground";
import { ThemedText } from "./ThemedText";

export function HeaderTitle() {
  const { t, isRTL } = useLanguage();
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

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
    <View style={[styles.stackContainer, { paddingTop: insets.top }]}>
      <View style={[styles.backgroundLayer, { backgroundColor: '#FFEEF2' }]}>
        <AnimatedHeaderBackground />
      </View>

      {/* Foreground content */}
      <View style={styles.contentContainer}>
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

        <View style={[styles.searchBarContainer, { paddingHorizontal: Spacing.lg }]}>
          <View style={[styles.searchBar, { backgroundColor: theme.backgroundSecondary }]}>
            <Pressable
              onPress={() => navigation.navigate("Search", {})}
              style={[styles.filterButton, { backgroundColor: theme.primary + "15" }]}
            >
              <Feather name="sliders" size={20} color={theme.primary} />
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate("Search", {})}
              style={styles.searchInputArea}
            >
              <View style={{ flex: 1, justifyContent: "center" }}>
                <ThemedText
                  style={[
                    styles.searchPlaceholder,
                    {
                      color: theme.textSecondary,
                      textAlign: isRTL ? "right" : "left",
                    },
                  ]}
                >
                  {t("searchCars")}
                </ThemedText>
              </View>
              <Feather name="search" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stackContainer: {
    width: "100%",
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  contentContainer: {
    width: "100%",
    paddingBottom: Spacing.sm,
  },
  outerContainer: {
    flexDirection: "row", // Start -> End
    justifyContent: "space-between", // Center everything together
    alignItems: "center",
    width: "100%",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    paddingTop: Spacing.sm,
    zIndex: 1,
  },
  searchBarContainer: {
    width: "100%",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    height: 50,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    gap: Spacing.sm,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  searchInputArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: "100%",
  },
  searchPlaceholder: {
    fontSize: 14,
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
  },
  logo: {
    width: 800,
    height: 80,
  },
  separator: {
    display: "none",
  },
});
