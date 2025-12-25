import React from "react";
import { View, Pressable, StyleSheet, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HomeStackNavigator from "@/navigation/HomeStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import SearchScreen from "@/screens/SearchScreen";
import ServicesScreen from "@/screens/ServicesScreen";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";

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
  const insets = useSafeAreaInsets();

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
