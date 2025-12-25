import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useServiceProviders } from "@/hooks/useServiceProviders";
import { useCars } from "@/hooks/useCars";

type RequestInspectionRouteProp = RouteProp<RootStackParamList, "RequestInspection">;

export default function RequestInspectionScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RequestInspectionRouteProp>();
  const { providers } = useServiceProviders();
  const { cars } = useCars();

  const car = cars.find((c) => c.id === route.params.carId);
  const inspectionCenters = providers.filter((p) => p.role === "inspection_center");

  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const dates = [
    { id: "1", label: "Tomorrow", date: "Dec 26" },
    { id: "2", label: "Thu", date: "Dec 27" },
    { id: "3", label: "Fri", date: "Dec 28" },
    { id: "4", label: "Sat", date: "Dec 29" },
    { id: "5", label: "Sun", date: "Dec 30" },
  ];

  const handleSubmit = async () => {
    if (!selectedCenter || !selectedDate) {
      Alert.alert("Error", "Please select an inspection center and date");
      return;
    }

    setIsLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        "Request Submitted",
        "Your inspection request has been sent. The inspection center will contact you shortly.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
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
            <ThemedText type="h4">{car.title}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {car.make} {car.model} - {car.year}
            </ThemedText>
          </View>
        ) : null}

        <ThemedText type="h4" style={styles.sectionTitle}>Select Inspection Center</ThemedText>
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
              <View style={styles.centerInfo}>
                <ThemedText type="body" style={{ fontWeight: "600" }}>{center.name}</ThemedText>
                <View style={styles.ratingRow}>
                  <Feather name="star" size={14} color={theme.secondary} />
                  <ThemedText type="small" style={{ marginLeft: Spacing.xs }}>
                    {center.rating} ({center.reviewCount} reviews)
                  </ThemedText>
                </View>
                <View style={styles.locationRow}>
                  <Feather name="map-pin" size={12} color={theme.textSecondary} />
                  <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
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

        <ThemedText type="h4" style={styles.sectionTitle}>Select Date</ThemedText>
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
          <ThemedText type="small" style={{ flex: 1, marginLeft: Spacing.md, color: theme.textSecondary }}>
            The inspection center will contact you to confirm the exact time. Standard inspection takes 1-2 hours.
          </ThemedText>
        </View>

        <Button onPress={handleSubmit} disabled={isLoading || !selectedCenter || !selectedDate} style={styles.submitButton}>
          {isLoading ? "Submitting..." : "Submit Request"}
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
  sectionTitle: {
    marginBottom: Spacing.md,
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
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
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
});
