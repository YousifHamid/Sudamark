import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert, Linking, TextInput } from "react-native";
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

type RequestInspectionRouteProp = RouteProp<RootStackParamList, "RequestInspection">;

export default function RequestInspectionScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const navigation = useNavigation();
  const route = useRoute<RequestInspectionRouteProp>();
  const { providers } = useServiceProviders();
  const { cars } = useCars();

  const car = cars.find((c) => c.id === route.params.carId);
  const inspectionCenters = providers.filter((p) => p.role === "inspection_center");

  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [locationType, setLocationType] = useState<"seller" | "agreed">("seller");
  const [agreedLocationText, setAgreedLocationText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sellerPhone = "+249123456789";
  const sellerWhatsApp = "+249123456789";

  const dates = [
    { id: "1", label: t("tomorrow"), date: "Dec 27" },
    { id: "2", label: isRTL ? "السبت" : "Sat", date: "Dec 28" },
    { id: "3", label: isRTL ? "الأحد" : "Sun", date: "Dec 29" },
    { id: "4", label: isRTL ? "الاثنين" : "Mon", date: "Dec 30" },
    { id: "5", label: isRTL ? "الثلاثاء" : "Tue", date: "Dec 31" },
  ];

  const handleCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${sellerPhone}`);
  };

  const handleWhatsApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const message = isRTL 
      ? `مرحباً، أريد الاستفسار عن السيارة: ${car?.title}` 
      : `Hello, I'm interested in the car: ${car?.title}`;
    Linking.openURL(`whatsapp://send?phone=${sellerWhatsApp}&text=${encodeURIComponent(message)}`);
  };

  const handleSubmit = async () => {
    if (!selectedCenter || !selectedDate) {
      Alert.alert(t("error"), t("selectCenterAndDate"));
      return;
    }

    setIsLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        t("requestSubmitted"),
        t("requestSubmittedMessage"),
        [{ text: t("ok"), onPress: () => navigation.goBack() }]
      );
    }, 1000);
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
          <View style={[styles.carPreview, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={isRTL ? styles.rtlText : undefined}>{car.title}</ThemedText>
            <ThemedText type="small" style={[{ color: theme.textSecondary }, isRTL && styles.rtlText]}>
              {car.make} {car.model} - {car.year}
            </ThemedText>
            <ThemedText type="body" style={[{ color: theme.primary, marginTop: Spacing.xs }, isRTL && styles.rtlText]}>
              {car.price.toLocaleString()} {t("sdg")}
            </ThemedText>
          </View>
        ) : null}

        <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h4" style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t("sellerContact")}</ThemedText>
          <View style={[styles.contactRow, isRTL && styles.contactRowRTL]}>
            <Pressable 
              style={[styles.contactButton, { backgroundColor: theme.success + "20", borderColor: theme.success }]}
              onPress={handleCall}
            >
              <Feather name="phone" size={20} color={theme.success} />
              <ThemedText style={{ color: theme.success, marginLeft: isRTL ? 0 : Spacing.sm, marginRight: isRTL ? Spacing.sm : 0, fontWeight: "600" }}>
                {t("callSeller")}
              </ThemedText>
            </Pressable>
            <Pressable 
              style={[styles.contactButton, { backgroundColor: "#25D366" + "20", borderColor: "#25D366" }]}
              onPress={handleWhatsApp}
            >
              <Feather name="message-circle" size={20} color="#25D366" />
              <ThemedText style={{ color: "#25D366", marginLeft: isRTL ? 0 : Spacing.sm, marginRight: isRTL ? Spacing.sm : 0, fontWeight: "600" }}>
                {t("whatsappSeller")}
              </ThemedText>
            </Pressable>
          </View>
          <ThemedText type="small" style={[{ color: theme.textSecondary, marginTop: Spacing.sm }, isRTL && styles.rtlText]}>
            {sellerPhone}
          </ThemedText>
        </View>

        <ThemedText type="h4" style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t("chooseLocation")}</ThemedText>
        <View style={[styles.locationOptions, isRTL && styles.locationOptionsRTL]}>
          <Pressable
            style={[
              styles.locationOption,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
              locationType === "seller" && { borderColor: theme.primary, borderWidth: 2 },
            ]}
            onPress={() => {
              setLocationType("seller");
              Haptics.selectionAsync();
            }}
          >
            <View style={[styles.locationIcon, { backgroundColor: theme.primary + "20" }]}>
              <Feather name="map-pin" size={20} color={theme.primary} />
            </View>
            <ThemedText style={[{ fontWeight: "600" }, isRTL && styles.rtlText]}>{t("sellerLocation")}</ThemedText>
            {locationType === "seller" ? (
              <View style={[styles.checkmark, { backgroundColor: theme.primary }]}>
                <Feather name="check" size={14} color="#FFFFFF" />
              </View>
            ) : null}
          </Pressable>
          
          <Pressable
            style={[
              styles.locationOption,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
              locationType === "agreed" && { borderColor: theme.primary, borderWidth: 2 },
            ]}
            onPress={() => {
              setLocationType("agreed");
              Haptics.selectionAsync();
            }}
          >
            <View style={[styles.locationIcon, { backgroundColor: theme.secondary + "20" }]}>
              <Feather name="navigation" size={20} color={theme.secondary} />
            </View>
            <ThemedText style={[{ fontWeight: "600" }, isRTL && styles.rtlText]}>{t("agreedLocation")}</ThemedText>
            {locationType === "agreed" ? (
              <View style={[styles.checkmark, { backgroundColor: theme.primary }]}>
                <Feather name="check" size={14} color="#FFFFFF" />
              </View>
            ) : null}
          </Pressable>
        </View>

        {locationType === "agreed" ? (
          <TextInput
            style={[
              styles.locationInput,
              { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border },
              isRTL && styles.rtlText,
            ]}
            placeholder={t("enterAgreedLocation")}
            placeholderTextColor={theme.textSecondary}
            value={agreedLocationText}
            onChangeText={setAgreedLocationText}
            textAlign={isRTL ? "right" : "left"}
          />
        ) : null}

        <ThemedText type="h4" style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t("selectInspectionCenter")}</ThemedText>
        <View style={styles.centersContainer}>
          {inspectionCenters.map((center) => (
            <Pressable
              key={center.id}
              onPress={() => {
                setSelectedCenter(center.id);
                Haptics.selectionAsync();
              }}
              style={[
                styles.centerCard,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
                selectedCenter === center.id && { borderColor: theme.primary, borderWidth: 2 },
              ]}
            >
              <View style={[styles.centerIcon, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="clipboard" size={24} color={theme.primary} />
              </View>
              <View style={[styles.centerInfo, isRTL && styles.centerInfoRTL]}>
                <ThemedText type="body" style={[{ fontWeight: "600" }, isRTL && styles.rtlText]}>{center.name}</ThemedText>
                <View style={[styles.ratingRow, isRTL && styles.ratingRowRTL]}>
                  <Feather name="star" size={14} color={theme.secondary} />
                  <ThemedText type="small" style={{ marginLeft: isRTL ? 0 : Spacing.xs, marginRight: isRTL ? Spacing.xs : 0 }}>
                    {center.rating} ({center.reviewCount} {t("reviews")})
                  </ThemedText>
                </View>
                <View style={[styles.locationRow, isRTL && styles.locationRowRTL]}>
                  <Feather name="map-pin" size={12} color={theme.textSecondary} />
                  <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: isRTL ? 0 : Spacing.xs, marginRight: isRTL ? Spacing.xs : 0 }}>
                    {center.city}
                  </ThemedText>
                </View>
              </View>
              {selectedCenter === center.id ? (
                <View style={[styles.checkmark, { backgroundColor: theme.primary }]}>
                  <Feather name="check" size={16} color="#FFFFFF" />
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>

        <ThemedText type="h4" style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t("selectDate")}</ThemedText>
        <View style={[styles.datesRow, isRTL && styles.datesRowRTL]}>
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
                style={selectedDate === date.id ? { color: "#FFFFFF" } : { color: theme.textSecondary }}
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

        <View style={[styles.infoBox, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="info" size={20} color={theme.primary} />
          <ThemedText type="small" style={[{ flex: 1, marginLeft: isRTL ? 0 : Spacing.md, marginRight: isRTL ? Spacing.md : 0, color: theme.textSecondary }, isRTL && styles.rtlText]}>
            {t("inspectionInfo")}
          </ThemedText>
        </View>

        <Button onPress={handleSubmit} disabled={isLoading || !selectedCenter || !selectedDate} style={styles.submitButton}>
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
