import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiUrl } from "@/lib/query-client";

export type UserRole = "buyer" | "seller" | "mechanic" | "electrician" | "lawyer" | "inspection_center";

export interface User {
  id: string;
  phone: string;
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
  login: (phoneNumber: string, countryCode?: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<{ isNewUser: boolean; user?: User }>;
  setUserRoles: (roles: UserRole[], name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
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
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState<string | null>(null);
  const [pendingCountryCode, setPendingCountryCode] = useState<string>("+249");
  const [pendingFullPhone, setPendingFullPhone] = useState<string | null>(null);

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

  const login = async (phoneNumber: string, countryCode: string = "+249") => {
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber, countryCode }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }
      
      setPendingPhoneNumber(phoneNumber);
      setPendingCountryCode(countryCode);
    } catch (error) {
      console.error("Login error:", error);
      setPendingPhoneNumber(phoneNumber);
      setPendingCountryCode(countryCode);
    }
  };

  const verifyOtp = async (otp: string): Promise<{ isNewUser: boolean; user?: User }> => {
    if (!pendingPhoneNumber) {
      return { isNewUser: false };
    }
    
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phone: pendingPhoneNumber, 
          otp,
          countryCode: pendingCountryCode 
        }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Invalid OTP");
      }
      
      if (data.isNewUser) {
        setPendingFullPhone(data.phone);
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
      setPendingPhoneNumber(null);
      
      return { isNewUser: false, user: userData };
    } catch (error) {
      console.error("OTP verification error:", error);
      throw error;
    }
  };

  const setUserRoles = async (roles: UserRole[], name: string) => {
    if (!pendingFullPhone && !pendingPhoneNumber) return;

    try {
      const phone = pendingFullPhone || `${pendingCountryCode}${pendingPhoneNumber}`;
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phone,
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
      setPendingFullPhone(null);
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
        login,
        verifyOtp,
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
