import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiUrl } from "@/lib/query-client";

export type UserRole =
  | "buyer"
  | "seller"
  | "mechanic"
  | "electrician"
  | "lawyer"
  | "inspection_center";

export interface User {
  id: string;
  phone: string;
  email?: string;
  emailVerified?: boolean;
  phoneNumber?: string;
  name: string;
  roles: UserRole[];
  avatar?: string;
  countryCode?: string;
  currentCity?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasSeenOnboarding: boolean;
  loginWithPhone: (
    phone: string,
    countryCode?: string,
  ) => Promise<{ isNewUser: boolean; user?: User }>;
  setUserRoles: (
    roles: UserRole[],
    name: string,
    email?: string,
    city?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  pendingPhoneNumber: string | null;
  pendingCountryCode: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "@sudmark_user";
const TOKEN_STORAGE_KEY = "@sudmark_token";
const ONBOARDING_STORAGE_KEY = "@sudmark_onboarding";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState<string | null>(
    null,
  );
  const [pendingCountryCode, setPendingCountryCode] = useState<string>("+249");

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const [userData, tokenData, onboardingData] = await Promise.all([
        AsyncStorage.getItem(AUTH_STORAGE_KEY),
        AsyncStorage.getItem(TOKEN_STORAGE_KEY),
        AsyncStorage.getItem(ONBOARDING_STORAGE_KEY),
      ]);
      if (userData && tokenData) {
        setUser(JSON.parse(userData));
        setToken(tokenData);
      }
      if (onboardingData === "true") {
        setHasSeenOnboarding(true);
      }
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    setHasSeenOnboarding(true);
  };

  const loginWithPhone = async (
    phone: string,
    countryCode: string = "+249",
  ): Promise<{ isNewUser: boolean; user?: User }> => {
    try {
      const fullPhone = `${countryCode}${phone.replace(/\s/g, "")}`;
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/auth/phone-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, countryCode }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (data.isNewUser) {
        setPendingPhoneNumber(phone);
        setPendingCountryCode(countryCode);
        return { isNewUser: true };
      }

      const userData: User = {
        ...data.user,
        phoneNumber: data.user.phone,
      };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      setUser(userData);
      setToken(data.token);

      return { isNewUser: false, user: userData };
    } catch (error) {
      console.error("Phone login error:", error);
      throw error;
    }
  };

  const setUserRoles = async (
    roles: UserRole[],
    name: string,
    email?: string,
    city?: string,
  ) => {
    if (!pendingPhoneNumber) return;

    try {
      const phone = `${pendingCountryCode}${pendingPhoneNumber.replace(/\s/g, "")}`;
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          email: email || null,
          name,
          roles,
          countryCode: pendingCountryCode,
          city,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      const userData: User = {
        ...data.user,
        phoneNumber: data.user.phone,
      };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      setUser(userData);
      setToken(data.token);
      setPendingPhoneNumber(null);
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove([AUTH_STORAGE_KEY, TOKEN_STORAGE_KEY]);
    setUser(null);
    setToken(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user || !token) return;

    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Update failed");
      }

      const updatedUser = { ...user, ...data };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error("Profile update error:", error);
      const updatedUser = { ...user, ...updates };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        hasSeenOnboarding,
        loginWithPhone,
        setUserRoles,
        logout,
        updateProfile,
        completeOnboarding,
        pendingPhoneNumber,
        pendingCountryCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
