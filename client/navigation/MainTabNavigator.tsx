import React from "react";
import { View, Pressable, StyleSheet, Text } from "react-native";
import { createBottomTabNavigator, BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HomeStackNavigator from "@/navigation/HomeStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import SearchScreen from "@/screens/SearchScreen";
import ServicesScreen from "@/screens/ServicesScreen";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";

export type MainTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  PostTab: undefined;
  ServicesTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function EmptyScreen() {
  return <View />;
}

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const tabs = [
    { name: "HomeTab", icon: "home" as const, labelKey: "home" },
    { name: "PostTab", icon: "plus-circle" as const, labelKey: "sell" },
    { name: "ServicesTab", icon: "tool" as const, labelKey: "services" },
    { name: "ProfileTab", icon: "user" as const, labelKey: "profile" },
  ];

  return (
    <View style={[styles.floatingNavContainer, { bottom: insets.bottom + Spacing.md }]}>
      <LinearGradient
        colors={[theme.primary, theme.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.navButtonsRow, { borderColor: theme.border }]}
      >
        {tabs.map((tab) => {
          const currentRouteName = state.routes[state.index]?.name;
          const isActive = currentRouteName === tab.name;

          const handlePress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (tab.name === "PostTab") {
              navigation.navigate("PostCar"); // Directly navigate to PostCar
            } else {
              navigation.navigate(tab.name);
            }
          };

          return (
            <Pressable key={tab.name} onPress={handlePress} style={styles.navButton}>
              <View style={[styles.navIconContainer, isActive && { backgroundColor: "rgba(255,255,255,0.25)" }]}>
                <Feather name={tab.icon} size={28} color="#FFFFFF" style={{ opacity: isActive ? 1 : 0.9 }} />
              </View>
              <Text style={[styles.navLabel, { color: "#FFFFFF", fontWeight: "700", opacity: isActive ? 1 : 0.9, fontSize: 12 }]}>
                {t(tab.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </LinearGradient>
    </View>
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} />
      <Tab.Screen name="SearchTab" component={SearchScreen} />
      <Tab.Screen name="PostTab" component={EmptyScreen} />
      <Tab.Screen name="ServicesTab" component={ServicesScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  floatingNavContainer: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: "center",
    gap: Spacing.sm,
  },
  navButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  navButton: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  navIconContainer: {
    width: 44,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
});
