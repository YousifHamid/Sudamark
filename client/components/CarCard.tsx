import React from "react";
import { View, StyleSheet, Pressable, Dimensions, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";

export interface Car {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  city: string;
  images: string[];
  category: string;
  condition?: string;
  description?: string;
  sellerId: string;
  createdAt: string;
  insuranceType?: string;
  advertiserType?: string;
  engineSize?: string;
  color?: string;
  owner?: {
    id: string;
    name: string;
    phone: string;
    avatar?: string;
  };
  contactPhone?: string;
  seats?: string;
  doors?: string;
  exteriorColor?: string;
  interiorColor?: string;
  fuelType?: string;
  gearType?: string;
  cylinders?: string;
  wheels?: string;
  seatType?: string;
  transmission?: string;
}

interface CarCardProps {
  car: Car;
  onPress: () => void;
  horizontal?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2;
const HORIZONTAL_CARD_WIDTH = SCREEN_WIDTH * 0.7;

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CarCard({ car, onPress, horizontal = false }: CarCardProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const cardWidth = horizontal ? HORIZONTAL_CARD_WIDTH : CARD_WIDTH;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        { backgroundColor: theme.cardBackground, width: cardWidth },
        animatedStyle,
      ]}
    >
      <Image
        source={{
          uri: car.images[0]?.startsWith("http")
            ? car.images[0]
            : `${require("@/lib/query-client").getApiUrl().replace(/\/$/, "")}${car.images[0]}`
        }}
        style={[styles.image, { width: cardWidth }]}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <ThemedText type="body" numberOfLines={1} style={styles.title}>
          {car.title}
        </ThemedText>
        <ThemedText type="h4" style={{ color: theme.primary }}>
          {car.price.toLocaleString()} {t("sdg")}
        </ThemedText>
        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Feather name="calendar" size={12} color={theme.textSecondary} />
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary, marginLeft: 4 }}
            >
              {car.year}
            </ThemedText>
          </View>
          <View style={styles.detailItem}>
            <Feather name="map-pin" size={12} color={theme.textSecondary} />
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary, marginLeft: 4 }}
            >
              {car.city}
            </ThemedText>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  image: {
    height: 120,
  },
  content: {
    padding: Spacing.md,
  },
  title: {
    fontWeight: "500",
    marginBottom: Spacing.xs,
  },
  details: {
    flexDirection: "row",
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
});
