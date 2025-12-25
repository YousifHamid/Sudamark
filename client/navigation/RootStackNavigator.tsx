import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import LoginScreen from "@/screens/LoginScreen";
import CarDetailScreen from "@/screens/CarDetailScreen";
import RequestInspectionScreen from "@/screens/RequestInspectionScreen";
import PostCarScreen from "@/screens/PostCarScreen";
import SearchScreen from "@/screens/SearchScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAuth } from "@/contexts/AuthContext";

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  CarDetail: { carId: string };
  RequestInspection: { carId: string };
  PostCar: undefined;
  Search: { category?: string };
  ProviderDetail: { providerId: string };
  EditProfile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions({ transparent: false });
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {!isAuthenticated ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CarDetail"
            component={CarDetailScreen}
            options={{
              presentation: "modal",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="RequestInspection"
            component={RequestInspectionScreen}
            options={{
              presentation: "modal",
              headerTitle: "Request Inspection",
            }}
          />
          <Stack.Screen
            name="PostCar"
            component={PostCarScreen}
            options={{
              presentation: "modal",
              headerTitle: "New Listing",
            }}
          />
          <Stack.Screen
            name="Search"
            component={SearchScreen}
            options={{
              headerTitle: "Search",
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
