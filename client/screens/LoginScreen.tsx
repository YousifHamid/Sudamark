import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Modal, FlatList, Platform, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

type LoginStep = "phone" | "role";

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
  { id: "ie", name: "Ireland", dialCode: "+353", flag: "IE", placeholder: "8X XXX XXXX", minLength: 9, maxLength: 9 },
  { id: "ly", name: "Libya", dialCode: "+218", flag: "LY", placeholder: "9X XXX XXXX", minLength: 9, maxLength: 9 },
  { id: "ye", name: "Yemen", dialCode: "+967", flag: "YE", placeholder: "7X XXX XXXX", minLength: 9, maxLength: 9 },
];

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const { loginWithPhone, setUserRoles } = useAuth();

  const [step, setStep] = useState<LoginStep>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<Array<"buyer" | "seller" | "mechanic" | "electrician" | "lawyer" | "inspection_center">>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country>(SUPPORTED_COUNTRIES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [userCity, setUserCity] = useState("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);

  const cities = [
    { id: "khartoum", label: isRTL ? "الخرطوم" : "Khartoum" },
    { id: "omdurman", label: isRTL ? "أم درمان" : "Omdurman" },
    { id: "bahri", label: isRTL ? "بحري" : "Bahri" },
    { id: "portSudan", label: isRTL ? "بورتسودان" : "Port Sudan" },
    { id: "kassala", label: isRTL ? "كسلا" : "Kassala" },
    { id: "other", label: isRTL ? "أخرى" : "Other" },
  ];

  const roles = [
    { id: "buyer", labelKey: "buyer", icon: "shopping-cart" as const },
    { id: "seller", labelKey: "seller", icon: "tag" as const },
    { id: "mechanic", labelKey: "mechanic", icon: "tool" as const },
    { id: "electrician", labelKey: "electrician", icon: "zap" as const },
    { id: "inspection_center", labelKey: "inspectionCenter", icon: "clipboard" as const },
  ];

  const handlePhoneLogin = async () => {
    const cleanNumber = phoneNumber.replace(/\s/g, "");

    // For testing ease: allow 4-15 digits
    if (cleanNumber.length < 4 || cleanNumber.length > 15) {
      setError(t("invalidPhoneNumber"));
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const result = await loginWithPhone(cleanNumber, selectedCountry.dialCode);
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
      await setUserRoles(selectedRoles, name, undefined, userCity || undefined);
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

  const detectLocation = async () => {
    if (Platform.OS === "web") {
      setError(isRTL ? "تحديد الموقع غير متاح على الويب" : "Location detection not available on web");
      return;
    }

    setIsDetectingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError(isRTL ? "لم يتم منح إذن الموقع" : "Location permission not granted");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = location.coords.latitude;
      const lng = location.coords.longitude;

      if (lat >= 15.4 && lat <= 16.0 && lng >= 32.3 && lng <= 32.7) {
        setUserCity("khartoum");
      } else if (lat >= 15.55 && lat <= 15.75 && lng >= 32.0 && lng <= 32.35) {
        setUserCity("omdurman");
      } else if (lat >= 15.6 && lat <= 15.8 && lng >= 32.45 && lng <= 32.65) {
        setUserCity("bahri");
      } else if (lat >= 19.5 && lat <= 19.7 && lng >= 37.1 && lng <= 37.3) {
        setUserCity("portSudan");
      } else if (lat >= 15.4 && lat <= 15.5 && lng >= 36.3 && lng <= 36.5) {
        setUserCity("kassala");
      } else {
        setUserCity("other");
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError(isRTL ? "فشل تحديد الموقع" : "Failed to detect location");
    } finally {
      setIsDetectingLocation(false);
    }
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
            source={require("../../assets/images/sudmark_logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }, isRTL && styles.rtlText]}>
            {step === "phone" && t("enterPhoneToStart")}
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
            <View style={[styles.inputContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, flexDirection: "row" }]}>
              <Pressable
                onPress={() => setShowCountryPicker(true)}
                style={[styles.countrySelector, { flexDirection: "row" }]}
              >
                <ThemedText style={styles.countryFlag}>{selectedCountry.flag}</ThemedText>
                <ThemedText style={styles.countryCode}>{selectedCountry.dialCode}</ThemedText>
                <Feather name="chevron-down" size={16} color={theme.textSecondary} />
              </Pressable>
              <View style={[styles.inputDivider, { backgroundColor: theme.border }]} />
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

            <Button onPress={handlePhoneLogin} disabled={isLoading} style={styles.button}>
              {isLoading ? t("loading") : t("continue")}
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

            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.lg }, isRTL && styles.rtlText]}>
              {isRTL ? "المدينة" : "City"}
            </ThemedText>
            <View style={[styles.cityRow, isRTL && styles.rowRTL]}>
              <Pressable
                style={[styles.citySelector, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
                onPress={() => setShowCityPicker(true)}
              >
                <ThemedText style={userCity ? {} : { color: theme.textSecondary }}>
                  {userCity ? cities.find(c => c.id === userCity)?.label : (isRTL ? "اختر المدينة" : "Select city")}
                </ThemedText>
                <Feather name="chevron-down" size={18} color={theme.textSecondary} />
              </Pressable>
              {Platform.OS !== "web" ? (
                <Pressable
                  style={[styles.detectButton, { backgroundColor: theme.primary }]}
                  onPress={detectLocation}
                  disabled={isDetectingLocation}
                >
                  {isDetectingLocation ? (
                    <ThemedText style={{ color: "#FFFFFF", fontSize: 12 }}>...</ThemedText>
                  ) : (
                    <Feather name="map-pin" size={18} color="#FFFFFF" />
                  )}
                </Pressable>
              ) : null}
            </View>

            <Modal
              visible={showCityPicker}
              animationType="fade"
              transparent
              onRequestClose={() => setShowCityPicker(false)}
            >
              <Pressable style={styles.modalOverlay} onPress={() => setShowCityPicker(false)}>
                <View style={[styles.cityPickerContent, { backgroundColor: theme.backgroundDefault }]}>
                  <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>{isRTL ? "اختر المدينة" : "Select City"}</ThemedText>
                  {cities.map((city) => (
                    <Pressable
                      key={city.id}
                      style={[styles.cityItem, { borderBottomColor: theme.border }, userCity === city.id && { backgroundColor: theme.primary + "15" }]}
                      onPress={() => { setUserCity(city.id); setShowCityPicker(false); Haptics.selectionAsync(); }}
                    >
                      <ThemedText>{city.label}</ThemedText>
                      {userCity === city.id ? <Feather name="check" size={18} color={theme.primary} /> : null}
                    </Pressable>
                  ))}
                </View>
              </Pressable>
            </Modal>

            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.xl }, isRTL && styles.rtlText]}>
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
                      { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
                      isSelected && { borderColor: theme.primary, backgroundColor: theme.primary + "15" },
                    ]}
                  >
                    <View style={[styles.roleIconCircle, isSelected && { backgroundColor: theme.primary }]}>
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
                      <View style={[styles.checkMark, { backgroundColor: "#FF6B35" }]}>
                        <Feather name="check" size={12} color="#FFFFFF" />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
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
    fontSize: 16,
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
  cityRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "center",
  },
  rowRTL: {
    flexDirection: "row-reverse",
  },
  citySelector: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.md,
  },
  detectButton: {
    width: Spacing.inputHeight,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  cityPickerContent: {
    margin: Spacing.xl,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  cityItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
  },
});
