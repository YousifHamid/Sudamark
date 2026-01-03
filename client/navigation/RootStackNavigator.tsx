import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import LoginScreen from "@/screens/LoginScreen";
import OnboardingScreen from "@/screens/OnboardingScreen";
import CarDetailScreen from "@/screens/CarDetailScreen";
import RequestInspectionScreen from "@/screens/RequestInspectionScreen";
import PostCarScreen from "@/screens/PostCarScreen";
import SearchScreen from "@/screens/SearchScreen";
import ServiceProviderDetailScreen from "@/screens/ServiceProviderDetailScreen";
import NotificationsScreen from "@/screens/NotificationsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAuth } from "@/contexts/AuthContext";
import { useAppReview } from "@/hooks/useAppReview";

export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Main: undefined;
  CarDetail: { carId: string };
  RequestInspection: { carId: string };
  PostCar: { carData?: any } | undefined;
  Search: { category?: string };
  ServiceProviderDetail: { provider: any };
  MyListings: undefined;
  MyFavorites: undefined;
  EditProfile: undefined;
  Report: {
    userId?: string;
    targetId?: string;
    targetType?: string;
    targetName?: string;
  };
  Notifications: undefined;
  Settings: undefined;
  PrivacyPolicy: undefined;
  AdminUsers: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions({ transparent: false });
  const { isAuthenticated, isLoading, hasSeenOnboarding, completeOnboarding } =
    useAuth();
  useAppReview();

  if (isLoading) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {!isAuthenticated ? (
        !hasSeenOnboarding ? (
          <Stack.Screen name="Onboarding" options={{ headerShown: false }}>
            {() => <OnboardingScreen onComplete={completeOnboarding} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        )
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
          <Stack.Screen
            name="ServiceProviderDetail"
            component={ServiceProviderDetailScreen}
            options={{
              presentation: "modal",
              headerTitle: "",
            }}
          />
          <Stack.Screen
            name="Report"
            // @ts-ignore
            component={require("@/screens/ReportScreen").default}
            options={{
              presentation: "modal",
              headerTitle: "",
            }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{
              presentation: "card",
              headerTitle: "Notifications",
            }}
          />
          <Stack.Screen
            name="EditProfile"
            // @ts-ignore
            component={require("@/screens/EditProfileScreen").default}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Settings"
            // @ts-ignore
            component={require("@/screens/SettingsScreen").default}
            options={{
              headerTitle: "", // Will be set by screen or hidden
            }}
          />
          <Stack.Screen
            name="PrivacyPolicy"
            // @ts-ignore
            component={require("@/screens/PrivacyPolicyScreen").PrivacyPolicyScreen}
            options={{
              headerTitle: "Privacy Policy",
            }}
          />
          <Stack.Screen
            name="AdminUsers"
            // @ts-ignore
            component={require("@/screens/AdminUsersScreen").default}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
