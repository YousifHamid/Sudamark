import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  Linking,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useServiceProviders } from "@/hooks/useServiceProviders";
import { useCars } from "@/hooks/useCars";
import { apiRequest } from "@/lib/query-client";

type RequestInspectionRouteProp = RouteProp<
  RootStackParamList,
  "RequestInspection"
>;

export default function RequestInspectionScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const navigation = useNavigation();
  const route = useRoute<RequestInspectionRouteProp>();
  const { providers } = useServiceProviders();
  const { cars } = useCars();

  const car = cars.find((c) => c.id === route.params.carId);
  const inspectionCenters = providers.filter(
    (p) => p.role === "inspection",
  );

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [locationType, setLocationType] = useState<"seller" | "agreed">(
    "seller",
  );
  const [agreedLocationText, setAgreedLocationText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sellerPhone = "+249123456789";
  const sellerWhatsApp = "+249123456789";

  const dates = [
    { id: "1", label: t("tomorrow"), date: `${t("december")} 27` },
    { id: "2", label: t("saturday"), date: `${t("december")} 28` },
    { id: "3", label: t("sunday"), date: `${t("december")} 29` },
    { id: "4", label: t("monday"), date: `${t("december")} 30` },
    { id: "5", label: t("tuesday"), date: `${t("december")} 31` },
  ];

  const handleCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${sellerPhone}`);
  };

  const handleWhatsApp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const message = isRTL
      ? `سلام عليكم يا غالي 👋
جاي من تطبيق سودامارك
مهتم صراحة بـ (${car?.make} ${car?.model} ${car?.year}).
ممكن تفاصيل الحالة، الممشى، وأي ملاحظات مع السعر النهائي؟

اذا في مجال تفاوض معقول نتفق من بدري عشان نوفر الزمن لينا الاتنين. واوصلك للمعاينة ونتم البيعة ان شاء الله.

منتظر ردك 🙏 يامحترم`
      : `Hello, I'm interested in the car: ${car?.make} ${car?.model} ${car?.year}. Can you share details about the condition, mileage, and final price? If there's room for negotiation, let's agree early to save time. Looking forward to your response.`;



    const cleanPhone = sellerWhatsApp.replace(/[^0-9]/g, "");
    const whatsappUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    const webWhatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    try {
      await Linking.openURL(whatsappUrl);
    } catch (err) {
      try {
        await Linking.openURL(webWhatsappUrl);
      } catch (err2) {
        Alert.alert(t("error"), t("whatsappNotAvailable"));
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate) {
      Alert.alert(t("error"), t("selectDateRequired"));
      return;
    }

    setIsLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      await apiRequest("POST", "/api/inspection-requests", {
        carId: car?.id,
        scheduledAt: selectedDate, // In a real app, map this ID to a real date string
        location: locationType === "agreed" ? agreedLocationText : "Seller Location",
        message: "New inspection request",
      });

      Alert.alert(t("requestSubmitted"), t("requestSubmittedMessage"), [
        { text: t("ok"), onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Inspection request error:", error);
      Alert.alert(t("error"), t("requestFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing["2xl"] },
        ]}
      >
        {car ? (
          <View
            style={[
              styles.carPreview,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <ThemedText type="h4" style={isRTL ? styles.rtlText : undefined}>
              {car.title}
            </ThemedText>
            <ThemedText
              type="small"
              style={[{ color: theme.textSecondary }, isRTL && styles.rtlText]}
            >
              {car.make} {car.model} - {car.year}
            </ThemedText>
            <ThemedText
              type="body"
              style={[
                { color: theme.primary, marginTop: Spacing.xs },
                isRTL && styles.rtlText,
              ]}
            >
              {car.price.toLocaleString()} {t("sdg")}
            </ThemedText>
          </View>
        ) : null}

        <View
          style={[styles.section, { backgroundColor: theme.backgroundDefault }]}
        >
          <ThemedText
            type="h4"
            style={[styles.sectionTitle, isRTL && styles.rtlText]}
          >
            {t("sellerContact")}
          </ThemedText>
          <View style={styles.contactRow}>
            <Pressable
              style={[
                styles.contactButton,
                {
                  backgroundColor: theme.success + "20",
                  borderColor: theme.success,
                },
              ]}
              onPress={handleCall}
            >
              <Feather name="phone" size={20} color={theme.success} />
              <ThemedText
                style={{
                  color: theme.success,
                  marginLeft: isRTL ? 0 : Spacing.sm,
                  marginRight: isRTL ? Spacing.sm : 0,
                  fontWeight: "600",
                }}
              >
                {t("callSeller")}
              </ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.contactButton,
                { backgroundColor: "#25D366" + "20", borderColor: "#25D366" },
              ]}
              onPress={handleWhatsApp}
            >
              <Feather name="message-circle" size={20} color="#25D366" />
              <ThemedText
                style={{
                  color: "#25D366",
                  marginLeft: isRTL ? 0 : Spacing.sm,
                  marginRight: isRTL ? Spacing.sm : 0,
                  fontWeight: "600",
                }}
              >
                {t("whatsappSeller")}
              </ThemedText>
            </Pressable>
          </View>
        </View>

        <ThemedText
          type="h4"
          style={[styles.sectionTitle, isRTL && styles.rtlText]}
        >
          {t("chooseLocation")}
        </ThemedText>
        <View
          style={styles.locationOptions}
        >
          <Pressable
            style={[
              styles.locationOption,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.border,
              },
              locationType === "seller" && {
                borderColor: theme.primary,
                borderWidth: 2,
              },
            ]}
            onPress={() => {
              setLocationType("seller");
              Haptics.selectionAsync();
            }}
          >
            <View
              style={[
                styles.locationIcon,
                { backgroundColor: theme.primary + "20" },
              ]}
            >
              <Feather name="map-pin" size={20} color={theme.primary} />
            </View>
            <ThemedText
              style={[{ fontWeight: "600" }, isRTL && styles.rtlText]}
            >
              {t("sellerLocation")}
            </ThemedText>
            {locationType === "seller" ? (
              <View
                style={[styles.checkmark, { backgroundColor: theme.primary }]}
              >
                <Feather name="check" size={14} color="#FFFFFF" />
              </View>
            ) : null}
          </Pressable>

          <Pressable
            style={[
              styles.locationOption,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.border,
              },
              locationType === "agreed" && {
                borderColor: theme.primary,
                borderWidth: 2,
              },
            ]}
            onPress={() => {
              setLocationType("agreed");
              Haptics.selectionAsync();
            }}
          >
            <View
              style={[
                styles.locationIcon,
                { backgroundColor: theme.secondary + "20" },
              ]}
            >
              <Feather name="navigation" size={20} color={theme.secondary} />
            </View>
            <ThemedText
              style={[{ fontWeight: "600" }, isRTL && styles.rtlText]}
            >
              {t("agreedLocation")}
            </ThemedText>
            {locationType === "agreed" ? (
              <View
                style={[styles.checkmark, { backgroundColor: theme.primary }]}
              >
                <Feather name="check" size={14} color="#FFFFFF" />
              </View>
            ) : null}
          </Pressable>
        </View>

        {locationType === "agreed" ? (
          <TextInput
            style={[
              styles.locationInput,
              {
                backgroundColor: theme.backgroundDefault,
                color: theme.text,
                borderColor: theme.border,
              },
              isRTL && styles.rtlText,
            ]}
            placeholder={t("enterAgreedLocation")}
            placeholderTextColor={theme.textSecondary}
            value={agreedLocationText}
            onChangeText={setAgreedLocationText}
            textAlign={isRTL ? "right" : "left"}
          />
        ) : null}

        <ThemedText
          type="h4"
          style={[styles.sectionTitle, isRTL && styles.rtlText]}
        >
          {t("selectDate")}
        </ThemedText>
        <View style={styles.datesRow}>
          {dates.map((date) => (
            <Pressable
              key={date.id}
              onPress={() => {
                setSelectedDate(date.id);
                Haptics.selectionAsync();
              }}
              style={[
                styles.dateCard,
                { backgroundColor: theme.backgroundDefault },
                selectedDate === date.id && { backgroundColor: theme.primary },
              ]}
            >
              <ThemedText
                type="small"
                style={
                  selectedDate === date.id
                    ? { color: "#FFFFFF" }
                    : { color: theme.textSecondary }
                }
              >
                {date.label}
              </ThemedText>
              <ThemedText
                type="body"
                style={[
                  { fontWeight: "600" },
                  selectedDate === date.id && { color: "#FFFFFF" },
                ]}
              >
                {date.date}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <View
          style={[styles.infoBox, { backgroundColor: theme.backgroundDefault }]}
        >
          <Feather name="info" size={20} color={theme.primary} />
          <ThemedText
            type="small"
            style={[
              {
                flex: 1,
                marginLeft: isRTL ? 0 : Spacing.md,
                marginRight: isRTL ? Spacing.md : 0,
                color: theme.textSecondary,
              },
              isRTL && styles.rtlText,
            ]}
          >
            {t("inspectionInfo")}
          </ThemedText>
        </View>

        <Button
          onPress={handleSubmit}
          disabled={isLoading || !selectedDate}
          style={styles.submitButton}
        >
          {isLoading ? t("submitting") : t("submitRequest")}
        </Button>
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  carPreview: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  section: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  contactRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  contactRowRTL: {
    flexDirection: "row-reverse",
  },
  contactButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  locationOptions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  locationOptionsRTL: {
    flexDirection: "row-reverse",
  },
  locationOption: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  locationInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    fontSize: 16,
  },
  centersContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  centerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  centerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  centerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  centerInfoRTL: {
    marginLeft: 0,
    marginRight: Spacing.md,
    alignItems: "flex-end",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  ratingRowRTL: {
    flexDirection: "row-reverse",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  locationRowRTL: {
    flexDirection: "row-reverse",
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  datesRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  datesRowRTL: {
    flexDirection: "row-reverse",
  },
  dateCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
  rtlText: {
    textAlign: "right",
  },
});
