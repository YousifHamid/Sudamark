import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

type LoginStep = "phone" | "otp" | "role";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { login, verifyOtp, setUserRole } = useAuth();

  const [step, setStep] = useState<LoginStep>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const roles = [
    { id: "buyer", label: "Buyer", icon: "shopping-cart" as const },
    { id: "seller", label: "Seller", icon: "tag" as const },
    { id: "mechanic", label: "Mechanic", icon: "tool" as const },
    { id: "electrician", label: "Electrician", icon: "zap" as const },
    { id: "lawyer", label: "Lawyer", icon: "briefcase" as const },
    { id: "inspection_center", label: "Inspection Center", icon: "clipboard" as const },
  ];

  const handleSendOtp = async () => {
    if (phoneNumber.length < 9) {
      setError("Please enter a valid phone number");
      return;
    }
    setError("");
    setIsLoading(true);
    await login(phoneNumber);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsLoading(false);
    setStep("otp");
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }
    setError("");
    setIsLoading(true);
    const success = await verifyOtp(otp);
    setIsLoading(false);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep("role");
    } else {
      setError("Invalid code. Try 123456");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleCompleteSignup = async () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!selectedRole) {
      setError("Please select a role");
      return;
    }
    setError("");
    setIsLoading(true);
    await setUserRole(selectedRole as any, name);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsLoading(false);
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing["4xl"], paddingBottom: insets.bottom + Spacing["2xl"] },
        ]}
      >
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary }]}>
            <Feather name="truck" size={40} color="#FFFFFF" />
          </View>
          <ThemedText type="h1" style={styles.title}>Car Marketplace</ThemedText>
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            {step === "phone" && "Enter your phone number to get started"}
            {step === "otp" && "Enter the verification code"}
            {step === "role" && "Complete your profile"}
          </ThemedText>
        </View>

        {error ? (
          <View style={[styles.errorContainer, { backgroundColor: theme.error + "20" }]}>
            <ThemedText style={{ color: theme.error }}>{error}</ThemedText>
          </View>
        ) : null}

        {step === "phone" ? (
          <View style={styles.form}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              Phone Number
            </ThemedText>
            <View style={[styles.inputContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
              <ThemedText style={styles.countryCode}>+966</ThemedText>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="5XX XXX XXXX"
                placeholderTextColor={theme.textSecondary}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                autoFocus
              />
            </View>
            <Button onPress={handleSendOtp} disabled={isLoading} style={styles.button}>
              {isLoading ? "Sending..." : "Send Verification Code"}
            </Button>
          </View>
        ) : null}

        {step === "otp" ? (
          <View style={styles.form}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              Verification Code
            </ThemedText>
            <TextInput
              style={[styles.otpInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
              placeholder="000000"
              placeholderTextColor={theme.textSecondary}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
            <ThemedText type="small" style={[styles.hint, { color: theme.textSecondary }]}>
              Demo: Use code 123456
            </ThemedText>
            <Button onPress={handleVerifyOtp} disabled={isLoading} style={styles.button}>
              {isLoading ? "Verifying..." : "Verify Code"}
            </Button>
            <Pressable onPress={() => setStep("phone")} style={styles.backLink}>
              <ThemedText type="link">Change phone number</ThemedText>
            </Pressable>
          </View>
        ) : null}

        {step === "role" ? (
          <View style={styles.form}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              Your Name
            </ThemedText>
            <TextInput
              style={[styles.nameInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
              placeholder="Enter your name"
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={setName}
              autoFocus
            />
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.xl }]}>
              Select Your Role
            </ThemedText>
            <View style={styles.rolesGrid}>
              {roles.map((role) => (
                <Pressable
                  key={role.id}
                  onPress={() => {
                    setSelectedRole(role.id);
                    Haptics.selectionAsync();
                  }}
                  style={[
                    styles.roleCard,
                    { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
                    selectedRole === role.id && { borderColor: theme.primary, backgroundColor: theme.primary + "15" },
                  ]}
                >
                  <Feather
                    name={role.icon}
                    size={24}
                    color={selectedRole === role.id ? theme.primary : theme.textSecondary}
                  />
                  <ThemedText
                    type="small"
                    style={[
                      styles.roleLabel,
                      selectedRole === role.id && { color: theme.primary },
                    ]}
                  >
                    {role.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
            <Button onPress={handleCompleteSignup} disabled={isLoading} style={styles.button}>
              {isLoading ? "Creating Account..." : "Get Started"}
            </Button>
          </View>
        ) : null}
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
  },
  errorContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  form: {
    flex: 1,
  },
  label: {
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
  },
  countryCode: {
    marginRight: Spacing.sm,
    fontSize: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  otpInput: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    fontSize: 24,
    textAlign: "center",
    letterSpacing: 8,
    marginBottom: Spacing.sm,
  },
  hint: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  nameInput: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  rolesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -Spacing.xs,
    marginBottom: Spacing.xl,
  },
  roleCard: {
    width: "30%",
    marginHorizontal: "1.5%",
    marginVertical: Spacing.xs,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  roleLabel: {
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  button: {
    marginTop: Spacing.lg,
  },
  backLink: {
    alignItems: "center",
    marginTop: Spacing.lg,
  },
});
