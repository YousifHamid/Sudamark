import React from "react";
import { View, Pressable, StyleSheet, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
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

export default function MainTabNavigator() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const handlePostPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("PostCar");
  };

  const isSeller = user?.roles?.includes("seller");

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        initialRouteName="HomeTab"
        screenOptions={{
          tabBarStyle: { display: "none" },
          headerShown: false,
        }}
      >
        <Tab.Screen name="HomeTab" component={HomeStackNavigator} />
        <Tab.Screen name="SearchTab" component={SearchScreen} />
        <Tab.Screen name="PostTab" component={EmptyScreen} />
        <Tab.Screen name="ServicesTab" component={ServicesScreen} />
        <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} />
      </Tab.Navigator>

      <View style={[styles.floatingNavContainer, { bottom: insets.bottom + Spacing.md }]}>
        <Pressable
          onPress={handlePostPress}
          style={[styles.fabButton, { backgroundColor: theme.primary }]}
        >
          <Feather name={isSeller ? "plus-circle" : "file-text"} size={20} color="#FFFFFF" />
          <Text style={styles.fabText}>{isSeller ? t("listYourCar") : t("request")}</Text>
        </Pressable>

        <View style={[styles.navButtonsRow, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <NavButton
            icon="home"
            label={t("home")}
            tabName="HomeTab"
            theme={theme}
          />
          <NavButton
            icon="search"
            label={t("search")}
            tabName="SearchTab"
            theme={theme}
          />
          <NavButton
            icon="tool"
            label={t("services")}
            tabName="ServicesTab"
            theme={theme}
          />
          <NavButton
            icon="user"
            label={t("profile")}
            tabName="ProfileTab"
            theme={theme}
          />
        </View>
      </View>
    </View>
  );
}

interface NavButtonProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  tabName: keyof MainTabParamList;
  theme: any;
}

function NavButton({ icon, label, tabName, theme }: NavButtonProps) {
  const navigation = useNavigation<any>();
  const state = navigation.getState();
  const currentRoute = state?.routes[state?.index]?.name;
  const isActive = currentRoute === tabName;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate(tabName);
  };

  return (
    <Pressable onPress={handlePress} style={styles.navButton}>
      <View style={[styles.navIconContainer, isActive && { backgroundColor: theme.primary + "20" }]}>
        <Feather name={icon} size={26} color={isActive ? theme.primary : theme.text} strokeWidth={isActive ? 2.5 : 2} />
      </View>
      <Text style={[styles.navLabel, { color: isActive ? theme.primary : theme.text, fontWeight: isActive ? "700" : "600" }]}>
        {label}
      </Text>
    </Pressable>
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
  fabButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  fabText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
  navButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  navButton: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  navIconContainer: {
    width: 52,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
  },
});
