import React from "react";
import { View, Pressable, StyleSheet, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HomeStackNavigator from "@/navigation/HomeStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import SearchScreen from "@/screens/SearchScreen";
import ServicesScreen from "@/screens/ServicesScreen";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

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

function PostButton() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 65;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("PostCar");
  };

  const isSeller = user?.roles?.includes("seller");

  return (
    <View style={[styles.fabContainer, { bottom: TAB_BAR_HEIGHT + insets.bottom + Spacing["5xl"] }]}>
      <Pressable
        onPress={handlePress}
        style={[styles.fab, { backgroundColor: theme.primary }]}
      >
        <Feather name={isSeller ? "plus" : "file-text"} size={26} color="#FFFFFF" />
        <Text style={styles.fabText}>{isSeller ? t("sell") : t("request")}</Text>
      </Pressable>
    </View>
  );
}

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        initialRouteName="HomeTab"
        screenOptions={{
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textSecondary,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: Platform.select({
              ios: "transparent",
              android: theme.backgroundDefault,
            }),
            borderTopWidth: 1,
            borderTopColor: theme.border,
            height: 65,
            paddingTop: 8,
            paddingBottom: Platform.OS === "ios" ? 0 : 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginTop: 4,
          },
          tabBarIconStyle: {
            marginBottom: -2,
          },
          tabBarBackground: () =>
            Platform.OS === "ios" ? (
              <BlurView
                intensity={95}
                tint={isDark ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />
            ) : null,
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeStackNavigator}
          options={{
            title: t("home"),
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIconContainer, focused && { backgroundColor: color + "15" }]}>
                <Feather name="home" size={22} color={color} />
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="SearchTab"
          component={SearchScreen}
          options={{
            title: t("search"),
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIconContainer, focused && { backgroundColor: color + "15" }]}>
                <Feather name="search" size={22} color={color} />
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="PostTab"
          component={EmptyScreen}
          options={{
            title: "",
            tabBarIcon: () => null,
            tabBarButton: () => null,
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
            },
          }}
        />
        <Tab.Screen
          name="ServicesTab"
          component={ServicesScreen}
          options={{
            title: t("services"),
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIconContainer, focused && { backgroundColor: color + "15" }]}>
                <Feather name="tool" size={22} color={color} />
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileStackNavigator}
          options={{
            title: t("profile"),
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIconContainer, focused && { backgroundColor: color + "15" }]}>
                <Feather name="user" size={22} color={color} />
              </View>
            ),
          }}
        />
      </Tab.Navigator>
      <PostButton />
    </View>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
  },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  tabIconContainer: {
    width: 40,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
