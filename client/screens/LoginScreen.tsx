import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Modal, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

type LoginStep = "phone" | "otp" | "role";

interface Country {
  id: string;
  name: string;
  dialCode: string;
  flag: string;
  placeholder: string;
  minLength: number;
  maxLength: number;
}

const SUPPORTED_COUNTRIES: Country[] = [
  { id: "sd", name: "Sudan", dialCode: "+249", flag: "SD", placeholder: "9X XXX XXXX", minLength: 9, maxLength: 9 },
  { id: "sa", name: "Saudi Arabia", dialCode: "+966", flag: "SA", placeholder: "5X XXX XXXX", minLength: 9, maxLength: 9 },
  { id: "om", name: "Oman", dialCode: "+968", flag: "OM", placeholder: "9XXX XXXX", minLength: 8, maxLength: 8 },
  { id: "qa", name: "Qatar", dialCode: "+974", flag: "QA", placeholder: "XXXX XXXX", minLength: 8, maxLength: 8 },
  { id: "us", name: "USA", dialCode: "+1", flag: "US", placeholder: "XXX XXX XXXX", minLength: 10, maxLength: 10 },
  { id: "gb", name: "UK", dialCode: "+44", flag: "GB", placeholder: "XXXX XXXXXX", minLength: 10, maxLength: 11 },
  { id: "ca", name: "Canada", dialCode: "+1", flag: "CA", placeholder: "XXX XXX XXXX", minLength: 10, maxLength: 10 },
  { id: "eg", name: "Egypt", dialCode: "+20", flag: "EG", placeholder: "1X XXXX XXXX", minLength: 10, maxLength: 11 },
];

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const { login, verifyOtp, setUserRole } = useAuth();

  const [step, setStep] = useState<LoginStep>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country>(SUPPORTED_COUNTRIES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const roles = [
    { id: "buyer", labelKey: "buyer", icon: "shopping-cart" as const },
    { id: "seller", labelKey: "seller", icon: "tag" as const },
    { id: "mechanic", labelKey: "mechanic", icon: "tool" as const },
    { id: "electrician", labelKey: "electrician", icon: "zap" as const },
    { id: "lawyer", labelKey: "lawyer", icon: "briefcase" as const },
    { id: "inspection_center", labelKey: "inspectionCenter", icon: "clipboard" as const },
  ];

  const handleSendOtp = async () => {
    const cleanNumber = phoneNumber.replace(/\s/g, "");
    if (cleanNumber.length < selectedCountry.minLength || cleanNumber.length > selectedCountry.maxLength) {
      setError(t("invalidPhoneNumber"));
      return;
    }
    setError("");
    setIsLoading(true);
    const fullNumber = selectedCountry.dialCode + cleanNumber;
    await login(fullNumber);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsLoading(false);
    setStep("otp");
  };

  const handleSelectCountry = (country: Country) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
    setPhoneNumber("");
    Haptics.selectionAsync();
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError(t("enter6DigitCode"));
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
      setError(t("invalidCode"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleCompleteSignup = async () => {
    if (!name.trim()) {
      setError(t("enterName"));
      return;
    }
    if (!selectedRole) {
      setError(t("selectRole"));
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
          <Image
            source={require("../../attached_assets/ARABATY2_1766663501110.png")}
            style={styles.logo}
            contentFit="contain"
          />
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }, isRTL && styles.rtlText]}>
            {step === "phone" && t("enterPhoneToStart")}
            {step === "otp" && t("enterVerificationCode")}
            {step === "role" && t("completeProfile")}
          </ThemedText>
        </View>

        {error ? (
          <View style={[styles.errorContainer, { backgroundColor: theme.error + "20" }]}>
            <ThemedText style={{ color: theme.error }}>{error}</ThemedText>
          </View>
        ) : null}

        {step === "phone" ? (
          <View style={styles.form}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }, isRTL && styles.rtlText]}>
              {t("phoneNumber")}
            </ThemedText>
            <View style={[styles.inputContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
              <Pressable
                onPress={() => setShowCountryPicker(true)}
                style={styles.countrySelector}
              >
                <ThemedText style={styles.countryFlag}>{selectedCountry.flag}</ThemedText>
                <ThemedText style={styles.countryCode}>{selectedCountry.dialCode}</ThemedText>
                <Feather name="chevron-down" size={16} color={theme.textSecondary} />
              </Pressable>
              <View style={[styles.inputDivider, { backgroundColor: theme.border }]} />
              <TextInput
                style={[styles.input, { color: theme.text, textAlign: isRTL ? "right" : "left" }]}
                placeholder={selectedCountry.placeholder}
                placeholderTextColor={theme.textSecondary}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                maxLength={selectedCountry.maxLength + 2}
                autoFocus
              />
            </View>
            <Button onPress={handleSendOtp} disabled={isLoading} style={styles.button}>
              {isLoading ? t("sending") : t("sendVerificationCode")}
            </Button>
          </View>
        ) : null}

        <Modal
          visible={showCountryPicker}
          animationType="slide"
          transparent
          onRequestClose={() => setShowCountryPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
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
                      selectedCountry.id === item.id && { backgroundColor: theme.primary + "15" },
                    ]}
                  >
                    <ThemedText style={styles.countryItemFlag}>{item.flag}</ThemedText>
                    <ThemedText style={styles.countryItemName}>{item.name}</ThemedText>
                    <ThemedText style={[styles.countryItemCode, { color: theme.textSecondary }]}>
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

        {step === "otp" ? (
          <View style={styles.form}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }, isRTL && styles.rtlText]}>
              {t("verificationCode")}
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
            <ThemedText type="small" style={[styles.hint, { color: theme.textSecondary }, isRTL && styles.rtlText]}>
              {t("demoCode")}
            </ThemedText>
            <Button onPress={handleVerifyOtp} disabled={isLoading} style={styles.button}>
              {isLoading ? t("verifying") : t("verifyCode")}
            </Button>
            <Pressable onPress={() => setStep("phone")} style={styles.backLink}>
              <ThemedText type="link">{t("changePhoneNumber")}</ThemedText>
            </Pressable>
          </View>
        ) : null}

        {step === "role" ? (
          <View style={styles.form}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }, isRTL && styles.rtlText]}>
              {t("yourName")}
            </ThemedText>
            <TextInput
              style={[styles.nameInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border, textAlign: isRTL ? "right" : "left" }]}
              placeholder={t("enterYourName")}
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={setName}
              autoFocus
            />
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.xl }, isRTL && styles.rtlText]}>
              {t("selectYourRole")}
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
                    {t(role.labelKey)}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
            <Button onPress={handleCompleteSignup} disabled={isLoading} style={styles.button}>
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
    marginBottom: Spacing.xl,
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
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "60%",
    paddingBottom: Spacing.xl,
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
    fontSize: 20,
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
  rtlText: {
    writingDirection: "rtl",
  },
});
