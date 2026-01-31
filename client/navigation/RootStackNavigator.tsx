import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppReview } from "@/hooks/useAppReview";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import CarDetailScreen from "@/screens/CarDetailScreen";
import CustomSplashScreen from "@/screens/CustomSplashScreen";
import LoginScreen from "@/screens/LoginScreen";
import NotificationsScreen from "@/screens/NotificationsScreen";
import OnboardingScreen from "@/screens/OnboardingScreen";
import PostCarScreen from "@/screens/PostCarScreen";
import RequestInspectionScreen from "@/screens/RequestInspectionScreen";
import SearchScreen from "@/screens/SearchScreen";
import ServiceProviderDetailScreen from "@/screens/ServiceProviderDetailScreen";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Main: undefined;
  CarDetail: { carId: string };
  RequestInspection: { carId: string };
  PostCar: { carData?: any } | undefined;
  Search: { category?: string };
  ServiceProviderDetail: { provider: any };
  AddServiceRequest: undefined;
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
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions({ transparent: false });
  const { isAuthenticated, isGuest, isLoading, hasSeenOnboarding, completeOnboarding } =
    useAuth();
  const { t } = useLanguage();
  useAppReview();

  const [showSplash, setShowSplash] = React.useState(true);

  if (isLoading) {
    return null;
  }

  if (showSplash) {
    return <CustomSplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {!isAuthenticated && !isGuest ? (
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
              headerTitle: t("requestInspection"),
            }}
          />
          <Stack.Screen
            name="PostCar"
            component={PostCarScreen}
            options={{
              presentation: "modal",
              headerTitle: t("newListing"),
            }}
          />
          <Stack.Screen
            name="Search"
            component={SearchScreen}
            options={{
              headerTitle: t("search"),
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
            name="AddServiceRequest"
            // @ts-ignore
            component={require("@/screens/AddServiceRequestScreen").default}
            options={{
              presentation: "modal",
              headerTitle: t("addServiceRequest"),
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
              headerTitle: t("notifications"),
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
              headerTitle: t("privacyPolicy"),
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
