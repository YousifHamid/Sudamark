import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiUrl } from "@/lib/query-client";

export type UserRole = "buyer" | "seller" | "mechanic" | "electrician" | "lawyer" | "inspection_center";

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
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasSeenOnboarding: boolean;
  sendMagicLink: (email: string, phone: string, countryCode?: string) => Promise<{ success: boolean; demoToken?: string }>;
  verifyMagicToken: (magicToken: string) => Promise<{ isNewUser: boolean; user?: User; email?: string; phone?: string }>;
  setUserRoles: (roles: UserRole[], name: string, email?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  pendingEmail: string | null;
  pendingPhoneNumber: string | null;
  pendingCountryCode: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "@arabaty_user";
const TOKEN_STORAGE_KEY = "@arabaty_token";
const ONBOARDING_STORAGE_KEY = "@arabaty_onboarding";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState<string | null>(null);
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

  const sendMagicLink = async (email: string, phone: string, countryCode: string = "+249"): Promise<{ success: boolean; demoToken?: string }> => {
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/auth/send-magic-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone, countryCode }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send magic link");
      }
      
      setPendingEmail(email);
      setPendingPhoneNumber(phone);
      setPendingCountryCode(countryCode);
      
      return { success: true, demoToken: data.demoToken };
    } catch (error) {
      console.error("Send magic link error:", error);
      throw error;
    }
  };

  const verifyMagicToken = async (magicToken: string): Promise<{ isNewUser: boolean; user?: User; email?: string; phone?: string }> => {
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/auth/verify-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: magicToken }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Invalid token");
      }
      
      if (data.isNewUser) {
        setPendingEmail(data.email);
        setPendingPhoneNumber(data.phone);
        return { isNewUser: true, email: data.email, phone: data.phone };
      }
      
      const userData: User = {
        ...data.user,
        phoneNumber: data.user.phone,
      };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      setUser(userData);
      setToken(data.token);
      setPendingEmail(null);
      setPendingPhoneNumber(null);
      
      return { isNewUser: false, user: userData };
    } catch (error) {
      console.error("Token verification error:", error);
      throw error;
    }
  };

  const setUserRoles = async (roles: UserRole[], name: string, email?: string) => {
    if (!pendingPhoneNumber) return;

    try {
      const phone = `${pendingCountryCode}${pendingPhoneNumber.replace(/\s/g, "")}`;
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phone,
          email: email || pendingEmail,
          name, 
          roles,
          countryCode: pendingCountryCode 
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
      setPendingEmail(null);
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
          "Authorization": `Bearer ${token}`,
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
        sendMagicLink,
        verifyMagicToken,
        setUserRoles,
        logout,
        updateProfile,
        completeOnboarding,
        pendingEmail,
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
