import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Modal,
  FlatList,
  Platform,
  Image,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

import { SUPPORTED_COUNTRIES, Country } from "@/constants/countries";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const { login, setUserRoles } = useAuth();

  const [step, setStep] = useState<"phone" | "role">("phone");
  const [isRegistering, setIsRegistering] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<
    (
      | "buyer"
      | "seller"
      | "mechanic"
      | "electrician"
      | "lawyer"
      | "inspection_center"
    )[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    SUPPORTED_COUNTRIES[0],
  );
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const roles = [
    { id: "buyer", labelKey: "buyer", icon: "shopping-cart" as const },
    { id: "seller", labelKey: "seller", icon: "tag" as const },
    { id: "mechanic", labelKey: "mechanic", icon: "tool" as const },
    { id: "electrician", labelKey: "electrician", icon: "zap" as const },
    {
      id: "inspection_center",
      labelKey: "inspectionCenter",
      icon: "clipboard" as const,
    },
  ];

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: "574389309781-tgrd9bq2t36coqij03uicm0u07863q01.apps.googleusercontent.com",
    webClientId: "574389309781-kkg2pvlq04ibkm9mm57s8rljfft30ifa.apps.googleusercontent.com",
    redirectUri: makeRedirectUri({
      scheme: "sudmark",
    }),
  });

  React.useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      if (authentication?.idToken) {
        handleGoogleLogin(authentication.idToken);
      } else if (authentication?.accessToken) {
        // If idToken is missing, try creating a user flow that verifies accessToken on backend?
        // Or just use accessToken if backend supports strict verification via userinfo endpoint.
        // For now, let's assume idToken is returned (needs configuration).
        // If not, we might need to fetch user info manually.
        // Let's rely on idToken.
        handleGoogleLogin(authentication.idToken || authentication.accessToken);
      }
    }
  }, [response]);

  const handleGoogleLogin = async (token: string) => {
    setIsLoading(true);
    setError("");
    try {
      // Pass token as googleToken
      const result = await login(undefined, undefined, undefined, token);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (result.isNewUser) {
        setStep("role");
        if (result.googleData?.name) setName(result.googleData.name);
      }
    } catch (err: any) {
      setError(err.message || t("error"));
      console.error("Google Login error:", err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthAction = async () => {
    const cleanNumber = phoneNumber.replace(/\s/g, "");

    // Strict validation based on selected country
    if (
      cleanNumber.length < selectedCountry.minLength ||
      cleanNumber.length > selectedCountry.maxLength
    ) {
      setError(
        isRTL
          ? `رقم الهاتف غير صحيح. يجب أن يتكون من ${selectedCountry.minLength} إلى ${selectedCountry.maxLength} رقم`
          : `Invalid phone number. Must be ${selectedCountry.minLength}-${selectedCountry.maxLength} digits`,
      );
      return;
    }

    if (!password || password.length < 6) {
      setError(isRTL ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters");
      return;
    }

    if (isRegistering) {
      // Proceed to Role Selection for Registration
      setError("");
      setStep("role");
      return;
    }

    // Login Logic
    handleLogin();
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError("");
    const cleanNumber = phoneNumber.replace(/\s/g, "");

    try {
      const result = await login(
        cleanNumber,
        password,
        selectedCountry.dialCode,
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (result.isNewUser) {
        setStep("role");
      }
    } catch (err: any) {
      // Show actual server error message if available
      const serverMessage = err.message || t("error");
      setError(serverMessage);
      console.error("Login error:", err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCountry = (country: Country) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
    setPhoneNumber("");
    Haptics.selectionAsync();
  };

  const handleCompleteSignup = async () => {
    if (!name.trim()) {
      setError(t("enterName"));
      return;
    }
    if (selectedRoles.length === 0) {
      setError(t("selectRole"));
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const cleanPhone = phoneNumber.replace(/\s/g, "");
      await setUserRoles(
        selectedRoles,
        name,
        undefined,
        undefined, // city 
        password,
        undefined, // googleId
        cleanPhone,
        selectedCountry.dialCode
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError(t("error"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoles((prev) => {
      if (prev.includes(roleId as any)) {
        return prev.filter((id) => id !== roleId);
      }
      return [...prev, roleId as any];
    });
    Haptics.selectionAsync();
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing["4xl"],
            paddingBottom: insets.bottom + Spacing["2xl"],
          },
        ]}
      >
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/sudmark_logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText
            type="body"
            style={[
              styles.subtitle,
              { color: theme.textSecondary },
              isRTL && styles.rtlText,
            ]}
          >
            {step === "phone" && (isRegistering ? t("createAccount") : t("enterPhoneToStart"))}
            {step === "role" && t("completeProfile")}
          </ThemedText>
        </View>

        {error ? (
          <View
            style={[
              styles.errorContainer,
              { backgroundColor: theme.error + "20" },
            ]}
          >
            <ThemedText style={{ color: theme.error }}>{error}</ThemedText>
          </View>
        ) : null}

        {step === "phone" ? (
          <View style={styles.form}>
            <ThemedText
              type="small"
              style={[
                styles.label,
                { color: theme.textSecondary },
                isRTL && styles.rtlText,
              ]}
            >
              {t("phoneNumber")}
            </ThemedText>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: theme.border,
                  flexDirection: "row",
                },
              ]}
            >
              <Pressable
                onPress={() => setShowCountryPicker(true)}
                style={[styles.countrySelector, { flexDirection: "row" }]}
              >
                <ThemedText style={styles.countryFlag}>
                  {selectedCountry.flag}
                </ThemedText>
                <ThemedText style={styles.countryCode}>
                  {selectedCountry.dialCode}
                </ThemedText>
                <Feather
                  name="chevron-down"
                  size={16}
                  color={theme.textSecondary}
                />
              </Pressable>
              <View
                style={[styles.inputDivider, { backgroundColor: theme.border }]}
              />
              <TextInput
                style={[styles.input, { color: theme.text, textAlign: "left" }]}
                placeholder={selectedCountry.placeholder}
                placeholderTextColor={theme.textSecondary}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                maxLength={selectedCountry.maxLength + 2}
              />
            </View>

            <View style={{ height: 16 }} />
            <ThemedText
              type="small"
              style={[
                styles.label,
                { color: theme.textSecondary },
                isRTL && styles.rtlText,
              ]}
            >
              {isRTL ? "كلمة المرور" : "Password"}
            </ThemedText>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: theme.border,
                },
              ]}
            >
              <TextInput
                style={[styles.input, { color: theme.text, textAlign: "left" }]}
                placeholder={isRTL ? "••••••" : "••••••"}
                placeholderTextColor={theme.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <Button
              onPress={handleAuthAction}
              disabled={isLoading}
              style={styles.button}
            >
              {isLoading ? t("loading") : (isRegistering ? t("continue") : t("continue"))}
            </Button>

            <Pressable
              onPress={() => {
                setIsRegistering(!isRegistering);
                setError("");
                Haptics.selectionAsync();
              }}
              style={{ marginTop: 16, alignItems: 'center' }}
            >
              <ThemedText style={{ color: theme.primary }}>
                {isRegistering
                  ? (isRTL ? "لديك حساب بالفعل؟ تسجيل الدخول" : "Already have an account? Login")
                  : (isRTL ? "ليس لديك حساب؟ إنشاء حساب جديد" : "Don't have an account? Sign Up")
                }
              </ThemedText>
            </Pressable>

            <View style={{ height: 16 }} />
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                promptAsync();
              }}
              style={[
                styles.button,
                {
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1,
                  borderColor: theme.border,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8
                }
              ]}
            >
              {/* Simplified Google G Icon */}
              <ThemedText style={{ fontWeight: 'bold', color: '#000' }}>G</ThemedText>
              <ThemedText style={{ color: "#000000" }}>
                {isRTL ? "المتابعة باستخدام Google" : "Continue with Google"}
              </ThemedText>
            </Pressable>
          </View>
        ) : null}

        <Modal
          visible={showCountryPicker}
          animationType="slide"
          transparent
          onRequestClose={() => setShowCountryPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: theme.backgroundDefault },
              ]}
            >
              <View style={styles.modalHeader}>
                <ThemedText type="h4">{t("selectCountry")}</ThemedText>
                <Pressable onPress={() => setShowCountryPicker(false)}>
                  <Feather name="x" size={24} color={theme.text} />
                </Pressable>
              </View>
              <FlatList
                data={SUPPORTED_COUNTRIES}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => handleSelectCountry(item)}
                    style={[
                      styles.countryItem,
                      { borderBottomColor: theme.border },
                      selectedCountry.id === item.id && {
                        backgroundColor: theme.primary + "15",
                      },
                    ]}
                  >
                    <ThemedText style={styles.countryItemFlag}>
                      {item.flag}
                    </ThemedText>
                    <ThemedText style={styles.countryItemName}>
                      {item.name}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.countryItemCode,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {item.dialCode}
                    </ThemedText>
                    {selectedCountry.id === item.id ? (
                      <Feather name="check" size={20} color={theme.primary} />
                    ) : null}
                  </Pressable>
                )}
              />
            </View>
          </View>
        </Modal>

        {step === "role" ? (
          <View style={styles.form}>
            <ThemedText
              type="small"
              style={[
                styles.label,
                { color: theme.textSecondary },
                isRTL && styles.rtlText,
              ]}
            >
              {t("yourName")}
            </ThemedText>
            <TextInput
              style={[
                styles.nameInput,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                  textAlign: isRTL ? "right" : "left",
                },
              ]}
              placeholder={t("enterYourName")}
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={setName}
              autoFocus
            />



            <ThemedText
              type="small"
              style={[
                styles.label,
                { color: theme.textSecondary, marginTop: Spacing.xl },
                isRTL && styles.rtlText,
              ]}
            >
              {t("selectYourRole")}
            </ThemedText>
            <View style={styles.rolesGrid}>
              {roles.map((role) => {
                const isSelected = selectedRoles.includes(role.id as any);
                return (
                  <Pressable
                    key={role.id}
                    onPress={() => toggleRole(role.id)}
                    style={[
                      styles.roleCard,
                      {
                        backgroundColor: theme.backgroundSecondary,
                        borderColor: theme.border,
                      },
                      isSelected && {
                        borderColor: theme.primary,
                        backgroundColor: theme.primary + "15",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.roleIconCircle,
                        isSelected && { backgroundColor: theme.primary },
                      ]}
                    >
                      <Feather
                        name={role.icon}
                        size={20}
                        color={isSelected ? "#FFFFFF" : theme.primary}
                      />
                    </View>
                    <ThemedText
                      type="small"
                      style={[
                        styles.roleLabel,
                        isSelected && { color: theme.primary },
                      ]}
                    >
                      {t(role.labelKey)}
                    </ThemedText>
                    {isSelected ? (
                      <View
                        style={[
                          styles.checkMark,
                          { backgroundColor: "#FF6B35" },
                        ]}
                      >
                        <Feather name="check" size={12} color="#FFFFFF" />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
            <Button
              onPress={handleCompleteSignup}
              disabled={isLoading}
              style={styles.button}
            >
              {isLoading ? t("creatingAccount") : t("getStarted")}
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
  logo: {
    width: 180,
    height: 100,
    marginBottom: Spacing.lg,
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
  },
  countrySelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  countryFlag: {
    fontSize: 18,
  },
  countryCode: {
    fontSize: 16,
  },
  inputDivider: {
    width: 1,
    height: 24,
    marginHorizontal: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  button: {
    marginTop: Spacing["2xl"],
  },
  nameInput: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
  },
  rolesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    justifyContent: "space-between",
  },
  roleCard: {
    width: "47%",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    position: "relative",
  },
  roleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  roleLabel: {
    textAlign: "center",
  },
  checkMark: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: "70%",
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
  },
  countryItemFlag: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  countryItemName: {
    flex: 1,
    fontSize: 16,
  },
  countryItemCode: {
    fontSize: 14,
    marginRight: Spacing.sm,
  },
  rtlText: {
    textAlign: "right",
  },
});
