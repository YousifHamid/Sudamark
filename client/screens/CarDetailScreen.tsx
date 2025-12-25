import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Dimensions, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useCars } from "@/hooks/useCars";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type CarDetailRouteProp = RouteProp<RootStackParamList, "CarDetail">;

export default function CarDetailScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<CarDetailRouteProp>();
  const { cars, toggleFavorite, isFavorite } = useCars();

  const car = cars.find((c) => c.id === route.params.carId);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(car ? isFavorite(car.id) : false);

  if (!car) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Car not found</ThemedText>
      </ThemedView>
    );
  }

  const handleFavorite = () => {
    toggleFavorite(car.id);
    setIsLiked(!isLiked);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleContact = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Contact Seller", "This would open a chat or call with the seller.");
  };

  const handleRequestInspection = () => {
    navigation.navigate("RequestInspection", { carId: car.id });
  };

  const specs = [
    { label: "Year", value: car.year.toString(), icon: "calendar" as const },
    { label: "Mileage", value: `${car.mileage?.toLocaleString() || "N/A"} km`, icon: "activity" as const },
    { label: "City", value: car.city, icon: "map-pin" as const },
    { label: "Category", value: car.category, icon: "tag" as const },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setCurrentImageIndex(index);
            }}
          >
            {car.images.map((uri, index) => (
              <Image
                key={index}
                source={{ uri }}
                style={styles.image}
                contentFit="cover"
              />
            ))}
          </ScrollView>
          <View style={styles.imageIndicators}>
            {car.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  { backgroundColor: index === currentImageIndex ? "#FFFFFF" : "rgba(255,255,255,0.5)" },
                ]}
              />
            ))}
          </View>
          <Pressable
            style={[styles.closeButton, { top: insets.top + Spacing.sm }]}
            onPress={() => navigation.goBack()}
          >
            <Feather name="x" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={[styles.headerActions, { top: insets.top + Spacing.sm }]}>
            <Pressable
              style={styles.headerActionButton}
              onPress={() => Haptics.selectionAsync()}
            >
              <Feather name="share" size={20} color="#FFFFFF" />
            </Pressable>
            <Pressable style={styles.headerActionButton} onPress={handleFavorite}>
              <Feather
                name="heart"
                size={20}
                color={isLiked ? "#EF4444" : "#FFFFFF"}
                fill={isLiked ? "#EF4444" : "transparent"}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.priceRow}>
            <ThemedText type="h2" style={{ color: theme.primary }}>
              SAR {car.price.toLocaleString()}
            </ThemedText>
          </View>

          <ThemedText type="h3" style={styles.title}>{car.title}</ThemedText>

          <View style={styles.locationRow}>
            <Feather name="map-pin" size={16} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
              {car.city}
            </ThemedText>
          </View>

          <View style={[styles.specsGrid, { backgroundColor: theme.backgroundDefault }]}>
            {specs.map((spec) => (
              <View key={spec.label} style={styles.specItem}>
                <Feather name={spec.icon} size={20} color={theme.primary} />
                <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
                  {spec.label}
                </ThemedText>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  {spec.value}
                </ThemedText>
              </View>
            ))}
          </View>

          {car.description ? (
            <View style={styles.section}>
              <ThemedText type="h4" style={styles.sectionTitle}>Description</ThemedText>
              <ThemedText style={{ color: theme.textSecondary }}>{car.description}</ThemedText>
            </View>
          ) : null}

          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>Seller Info</ThemedText>
            <View style={[styles.sellerCard, { backgroundColor: theme.backgroundDefault }]}>
              <View style={[styles.sellerAvatar, { backgroundColor: theme.primary }]}>
                <ThemedText type="h4" style={{ color: "#FFFFFF" }}>S</ThemedText>
              </View>
              <View style={styles.sellerInfo}>
                <ThemedText type="body" style={{ fontWeight: "600" }}>Seller</ThemedText>
                <View style={styles.ratingRow}>
                  <Feather name="star" size={14} color={theme.secondary} />
                  <ThemedText type="small" style={{ marginLeft: Spacing.xs }}>4.8 (24 reviews)</ThemedText>
                </View>
              </View>
              <Pressable
                style={[styles.callButton, { backgroundColor: theme.success }]}
                onPress={handleContact}
              >
                <Feather name="phone" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md, backgroundColor: theme.backgroundRoot }]}>
        <Button onPress={handleContact} style={styles.contactButton}>
          Contact Seller
        </Button>
        <Pressable
          style={[styles.inspectionButton, { backgroundColor: theme.backgroundSecondary }]}
          onPress={handleRequestInspection}
        >
          <Feather name="clipboard" size={20} color={theme.primary} />
          <ThemedText style={{ color: theme.primary, marginLeft: Spacing.sm }}>Request Inspection</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.75,
  },
  imageIndicators: {
    position: "absolute",
    bottom: Spacing.lg,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  closeButton: {
    position: "absolute",
    left: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerActions: {
    position: "absolute",
    right: Spacing.lg,
    flexDirection: "row",
    gap: Spacing.sm,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: Spacing.lg,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    marginTop: Spacing.sm,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  specsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: Spacing.xl,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  specItem: {
    width: "50%",
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  sellerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  sellerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  contactButton: {
    flex: 1,
  },
  inspectionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    height: Spacing.buttonHeight,
  },
});
