import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type ServiceProviderDetailRouteProp = RouteProp<
  RootStackParamList,
  "ServiceProviderDetail"
>;

export default function ServiceProviderDetailScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<ServiceProviderDetailRouteProp>();
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const { provider } = route.params;

  const handleCall = () => {
    Haptics.selectionAsync();
    const phoneUrl = `tel:${provider.phone}`;
    Linking.canOpenURL(phoneUrl).then((supported) => {
      if (supported) {
        Linking.openURL(phoneUrl);
      } else {
        Alert.alert(
          isRTL ? "خطأ" : "Error",
          isRTL ? "لا يمكن إجراء المكالمة" : "Cannot make call",
        );
      }
    });
  };

  const handleWhatsApp = () => {
    Haptics.selectionAsync();
    const whatsappNumber = provider.whatsapp || provider.phone;
    const cleanNumber = whatsappNumber.replace(/[^0-9]/g, "");
    const whatsappUrl = `https://wa.me/${cleanNumber}`;
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert(
        isRTL ? "خطأ" : "Error",
        isRTL ? "لا يمكن فتح واتساب" : "Cannot open WhatsApp",
      );
    });
  };

  const handleLocation = () => {
    Haptics.selectionAsync();
    if (provider.latitude && provider.longitude) {
      const url = Platform.select({
        ios: `maps:0,0?q=${provider.latitude},${provider.longitude}`,
        android: `geo:${provider.latitude},${provider.longitude}?q=${provider.latitude},${provider.longitude}`,
        default: `https://www.google.com/maps/search/?api=1&query=${provider.latitude},${provider.longitude}`,
      });
      Linking.openURL(url);
    } else if (provider.address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(provider.address + ", " + provider.city)}`;
      Linking.openURL(url);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "mechanic":
        return t("mechanic");
      case "electrician":
        return t("electrician");
      case "lawyer":
        return t("lawyer");
      default:
        return type;
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Feather
          key={i}
          name="star"
          size={18}
          color={i <= rating ? "#F59E0B" : theme.border}
          style={{ marginRight: 2 }}
        />,
      );
    }
    return stars;
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing["2xl"] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.header, { backgroundColor: theme.backgroundDefault }]}
        >
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Feather
              name={
                provider.type === "mechanic"
                  ? "tool"
                  : provider.type === "electrician"
                    ? "zap"
                    : "briefcase"
              }
              size={32}
              color="#FFFFFF"
            />
          </View>
          <ThemedText type="h2" style={[styles.name, isRTL && styles.rtlText]}>
            {provider.name}
          </ThemedText>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: theme.primary + "15" },
            ]}
          >
            <ThemedText style={{ color: theme.primary }}>
              {getTypeLabel(provider.type)}
            </ThemedText>
          </View>
          {provider.isVerified ? (
            <View
              style={[
                styles.verifiedBadge,
                { backgroundColor: "#10B981" + "15" },
              ]}
            >
              <Feather name="check-circle" size={14} color="#10B981" />
              <ThemedText
                type="small"
                style={{ color: "#10B981", marginLeft: 4 }}
              >
                {isRTL ? "موثق" : "Verified"}
              </ThemedText>
            </View>
          ) : null}
        </View>

        <View
          style={[
            styles.ratingSection,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <View style={styles.ratingRow}>
            <View style={styles.starsContainer}>
              {renderStars(provider.rating || 0)}
            </View>
            <ThemedText style={{ color: theme.textSecondary }}>
              ({provider.reviewCount || 0} {t("reviews")})
            </ThemedText>
          </View>
        </View>

        <View
          style={[
            styles.infoSection,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <ThemedText
            type="h4"
            style={[styles.sectionTitle, isRTL && styles.rtlText]}
          >
            {isRTL ? "معلومات التواصل" : "Contact Info"}
          </ThemedText>

          <View style={[styles.infoRow, isRTL && styles.infoRowRTL]}>
            <View
              style={[
                styles.infoIcon,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <Feather name="map-pin" size={18} color={theme.primary} />
            </View>
            <View style={styles.infoContent}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {isRTL ? "الموقع" : "Location"}
              </ThemedText>
              <ThemedText style={isRTL ? styles.rtlText : undefined}>
                {provider.address ? `${provider.address}, ` : ""}
                {t(provider.city) || provider.city}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.infoRow, isRTL && styles.infoRowRTL]}>
            <View
              style={[
                styles.infoIcon,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <Feather name="phone" size={18} color={theme.primary} />
            </View>
            <View style={styles.infoContent}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {isRTL ? "الهاتف" : "Phone"}
              </ThemedText>
              <ThemedText>{provider.phone}</ThemedText>
            </View>
          </View>

          {provider.price ? (
            <View style={[styles.infoRow, isRTL && styles.infoRowRTL]}>
              <View
                style={[
                  styles.infoIcon,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
              >
                <Feather name="dollar-sign" size={18} color={theme.primary} />
              </View>
              <View style={styles.infoContent}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {isRTL ? "السعر" : "Price"}
                </ThemedText>
                <ThemedText style={isRTL ? styles.rtlText : undefined}>
                  {provider.price}
                </ThemedText>
              </View>
            </View>
          ) : null}
        </View>

        {provider.description ? (
          <View
            style={[
              styles.descSection,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <ThemedText
              type="h4"
              style={[styles.sectionTitle, isRTL && styles.rtlText]}
            >
              {isRTL ? "نبذة" : "About"}
            </ThemedText>
            <ThemedText style={[styles.description, isRTL && styles.rtlText]}>
              {provider.description}
            </ThemedText>
          </View>
        ) : null}

        {provider.services && provider.services.length > 0 ? (
          <View
            style={[
              styles.servicesSection,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <ThemedText
              type="h4"
              style={[styles.sectionTitle, isRTL && styles.rtlText]}
            >
              {isRTL ? "الخدمات" : "Services"}
            </ThemedText>
            <View style={styles.servicesGrid}>
              {provider.services.map((service: string, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.serviceChip,
                    { backgroundColor: theme.backgroundSecondary },
                  ]}
                >
                  <Feather name="check" size={14} color={theme.primary} />
                  <ThemedText type="small" style={{ marginLeft: 6 }}>
                    {service}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.actionsContainer}>
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: "#25D366" }]}
              onPress={handleWhatsApp}
            >
              <Feather name="message-circle" size={20} color="#FFFFFF" />
              <ThemedText style={styles.actionButtonText}>
                {isRTL ? "واتساب" : "WhatsApp"}
              </ThemedText>
            </Pressable>

            <Pressable
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              onPress={handleCall}
            >
              <Feather name="phone" size={20} color="#FFFFFF" />
              <ThemedText style={styles.actionButtonText}>
                {isRTL ? "اتصال" : "Call"}
              </ThemedText>
            </Pressable>
          </View>

          {(provider.latitude && provider.longitude) || provider.address ? (
            <Button onPress={handleLocation} style={styles.locationButton}>
              <View style={styles.locationButtonContent}>
                <Feather name="map-pin" size={18} color="#FFFFFF" />
                <ThemedText style={styles.locationButtonText}>
                  {isRTL ? "عرض على الخريطة" : "View on Map"}
                </ThemedText>
              </View>
            </Button>
          ) : null}
        </View>
      </ScrollView>
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
  header: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  name: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  ratingSection: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  starsContainer: {
    flexDirection: "row",
  },
  infoSection: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  infoRowRTL: {
    flexDirection: "row-reverse",
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  descSection: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  description: {
    lineHeight: 24,
  },
  servicesSection: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  serviceChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  actionsContainer: {
    marginTop: Spacing.md,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  locationButton: {
    width: "100%",
  },
  locationButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  locationButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  rtlText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
});
