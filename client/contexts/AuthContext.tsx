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
  login: (
    phone?: string,
    password?: string,
    countryCode?: string,
    googleToken?: string,
  ) => Promise<{ isNewUser: boolean; user?: User; googleToken?: string; googleData?: any }>;
  setUserRoles: (
    roles: UserRole[],
    name: string,
    email?: string,
    city?: string,
    password?: string,
    googleId?: string,
    providedPhone?: string,
    providedCountryCode?: string,
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

  const login = async (
    phone?: string,
    password?: string,
    countryCode: string = "+249",
    googleToken?: string,
  ): Promise<{ isNewUser: boolean; user?: User; googleToken?: string; googleData?: any }> => {
    try {
      const baseUrl = getApiUrl();
      let body: any = {};

      if (googleToken) {
        body = { googleToken }; // Changed from googleId to googleToken
      } else if (phone && password) {
        const fullPhone = `${countryCode}${phone.replace(/\s/g, "")}`;
        body = { phone: fullPhone, password };
      } else {
        throw new Error("Invalid login credentials");
      }

      const response = await fetch(`${baseUrl}api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (data.isNewUser) {
        setPendingPhoneNumber(phone || null);
        setPendingCountryCode(countryCode);
        // Return extra data for pre-filling registration
        return {
          isNewUser: true,
          googleToken: data.googleId || googleToken, // backend returns verified googleId as 'googleId' field usually, or we keep token
          googleData: {
            email: data.email,
            name: data.name,
            picture: data.picture,
            googleId: data.googleId // verified ID
          }
        };
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
      console.error("Login error:", error);
      throw error;
    }
  };

  const setUserRoles = async (
    roles: UserRole[],
    name: string,
    email?: string,
    city?: string,
    password?: string,
    googleId?: string,
    providedPhone?: string,
    providedCountryCode?: string,
  ) => {
    // If googleId is present, we might not have a pendingPhoneNumber if it's a fresh google sign in
    // However, if we are in manual signup flow, we have providedPhone.

    // Priority: provided phone > pending phone
    const targetPhone = providedPhone || pendingPhoneNumber;
    const targetCountry = providedCountryCode || pendingCountryCode;

    if (!googleId && !targetPhone) return;

    try {
      let phone = targetPhone ? `${targetCountry}${targetPhone.replace(/\s/g, "")}` : undefined;

      // If google auth, and we don't have phone, we might need to ask for it? 
      // For now, assume if phone flow, phone is there.

      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          email: email || null,
          name,
          roles,
          countryCode: targetCountry,
          city,
          password,
          googleId,
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
        login,
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
