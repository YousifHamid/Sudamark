import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

export interface ServiceProvider {
  id: string;
  name: string;
  role: "mechanic" | "electrician" | "lawyer" | "inspection_center";
  city: string;
  rating: number;
  reviewCount: number;
  phone?: string;
  description?: string;
}

interface ServiceProviderCardProps {
  provider: ServiceProvider;
  onPress: () => void;
}

const ROLE_ICONS: Record<string, string> = {
  mechanic: "tool",
  electrician: "zap",
  lawyer: "briefcase",
  inspection_center: "clipboard",
};

const ROLE_LABELS: Record<string, string> = {
  mechanic: "Mechanic",
  electrician: "Electrician",
  lawyer: "Lawyer",
  inspection_center: "Inspection Center",
};

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ServiceProviderCard({ provider, onPress }: ServiceProviderCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const iconName = ROLE_ICONS[provider.role] || "user";

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, { backgroundColor: theme.cardBackground }, animatedStyle]}
    >
      <View style={[styles.iconContainer, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name={iconName as any} size={24} color={theme.primary} />
      </View>
      <View style={styles.content}>
        <ThemedText type="body" style={styles.name}>{provider.name}</ThemedText>
        <View style={[styles.roleBadge, { backgroundColor: theme.primary + "15" }]}>
          <ThemedText type="small" style={{ color: theme.primary }}>
            {ROLE_LABELS[provider.role]}
          </ThemedText>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.ratingContainer}>
            <Feather name="star" size={14} color={theme.secondary} />
            <ThemedText type="small" style={{ marginLeft: 4 }}>
              {provider.rating.toFixed(1)}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: 2 }}>
              ({provider.reviewCount})
            </ThemedText>
          </View>
          <View style={styles.locationContainer}>
            <Feather name="map-pin" size={12} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: 4 }}>
              {provider.city}
            </ThemedText>
          </View>
        </View>
      </View>
      <Pressable style={[styles.contactButton, { backgroundColor: theme.primary }]}>
        <Feather name="phone" size={18} color="#FFFFFF" />
      </Pressable>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  name: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
