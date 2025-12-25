import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type UserRole = "buyer" | "seller" | "mechanic" | "electrician" | "lawyer" | "inspection_center";

export interface User {
  id: string;
  phoneNumber: string;
  name: string;
  roles: UserRole[];
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasSeenOnboarding: boolean;
  login: (phoneNumber: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<boolean>;
  setUserRoles: (roles: UserRole[], name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  pendingPhoneNumber: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "@car_marketplace_user";
const ONBOARDING_STORAGE_KEY = "@car_marketplace_onboarding";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const [userData, onboardingData] = await Promise.all([
        AsyncStorage.getItem(AUTH_STORAGE_KEY),
        AsyncStorage.getItem(ONBOARDING_STORAGE_KEY),
      ]);
      if (userData) {
        setUser(JSON.parse(userData));
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

  const login = async (phoneNumber: string) => {
    setPendingPhoneNumber(phoneNumber);
  };

  const verifyOtp = async (otp: string): Promise<boolean> => {
    if (otp === "123456" && pendingPhoneNumber) {
      return true;
    }
    return false;
  };

  const setUserRoles = async (roles: UserRole[], name: string) => {
    if (!pendingPhoneNumber) return;

    const newUser: User = {
      id: Date.now().toString(),
      phoneNumber: pendingPhoneNumber,
      name,
      roles,
    };

    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
    setPendingPhoneNumber(null);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
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
