import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

import ProfileScreen from "@/screens/ProfileScreen";
import { PrivacyPolicyScreen } from "@/screens/PrivacyPolicyScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";

export type ProfileStackParamList = {
  Profile: undefined;
  PrivacyPolicy: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  const screenOptions = useScreenOptions();
  const { theme } = useTheme();
  const { isRTL } = useLanguage();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerTitle: isRTL ? "الملف الشخصي" : "Profile",
          headerRight: () => (
            <Pressable style={{ padding: 8 }}>
              <Feather name="settings" size={22} color={theme.text} />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{
          headerTitle: isRTL ? "سياسة الخصوصية" : "Privacy Policy",
        }}
      />
    </Stack.Navigator>
  );
}
