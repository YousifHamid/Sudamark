import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Pressable, Image, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import HomeScreen from "@/screens/HomeScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { AnimatedHeaderBackground } from "@/components/AnimatedHeaderBackground";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";

export type HomeStackParamList = {
  Home: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
  const screenOptions = useScreenOptions();
  const { theme } = useTheme();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: () => <HeaderTitle />,
          headerTitleAlign: "left", // Allow custom component to fill width from start
          headerBackground: () => <AnimatedHeaderBackground />,
          headerStyle: {
            backgroundColor: "transparent",
          }
        }}
      />
    </Stack.Navigator>
  );
}
