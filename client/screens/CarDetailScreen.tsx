import { Feather } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCars } from "@/hooks/useCars";
import { useTheme } from "@/hooks/useTheme";

import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { CITIES } from "@shared/constants";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type CarDetailRouteProp = RouteProp<RootStackParamList, "CarDetail">;

export default function CarDetailScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<CarDetailRouteProp>();
  const { cars, toggleFavorite, isFavorite, refreshCars } = useCars();
  const { token, user, isGuest, logout } = useAuth();

  const car = cars.find((c) => c.id === route.params.carId);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(car ? isFavorite(car.id) : false);

  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshCars();
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshCars]);

  if (!car) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={isRTL ? styles.rtlText : undefined}>
          {t("carNotFound")}
        </ThemedText>
      </ThemedView>
    );
  }

  const isOwnCar = user?.id === car.sellerId;
  const [showContactInfo, setShowContactInfo] = useState(false);

  const handleToggleSold = async () => {
    try {
      const response = await fetch(`${require("@/lib/query-client").getApiUrl()}/api/cars/${car.id}/sold`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isSold: !car.isSold }),
      });
      if (response.ok) {
        Alert.alert(
          isRTL ? "نجاح" : "Success",
          !car.isSold ? (isRTL ? "تم تحديث الحالة إلى مباع" : "Marked as sold") : (isRTL ? "تم إزالة حالة البيع" : "Unmarked as sold")
        );
        refreshCars();
      } else {
        throw new Error("Failed to update status");
      }
    } catch (error) {
      console.error(error);
      Alert.alert(isRTL ? "خطأ" : "Error", isRTL ? "حدث خطأ" : "An error occurred");
    }
  };

  const handleFavorite = () => {
    if (isGuest) {
      Alert.alert(
        t("loginRequired"),
        t("mustLoginToFavorite"),
        [
          { text: t("cancel"), style: "cancel" },
          { text: t("login"), onPress: () => logout() }
        ]
      );
      return;
    }
    toggleFavorite(car.id);
    setIsLiked(!isLiked);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleContact = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      t("contactSeller"),
      isRTL
        ? "سيتم فتح محادثة أو مكالمة مع البائع."
        : "This would open a chat or call with the seller.",
    );
  };

  const handleRequestInspection = () => {
    navigation.navigate("RequestInspection", { carId: car.id });
  };

  const handleMakeOffer = () => {
    if (isGuest) {
      Alert.alert(
        t("loginRequired"),
        t("mustLoginToOffer"),
        [
          { text: t("cancel"), style: "cancel" },
          { text: t("login"), onPress: () => logout() }
        ]
      );
      return;
    }

    if (isOwnCar) {
      Alert.alert(
        isRTL ? "خطأ" : "Error",
        isRTL
          ? "لا يمكنك تقديم عرض على سيارتك"
          : "You cannot make an offer on your own car",
      );
      return;
    }
    setOfferPrice(car.price.toString());
    setShowOfferModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSubmitOffer = async () => {
    if (!offerPrice || parseInt(offerPrice) <= 0) {
      Alert.alert(
        isRTL ? "خطأ" : "Error",
        isRTL ? "يرجى إدخال سعر صحيح" : "Please enter a valid price",
      );
      return;
    }

    setShowOfferModal(false);

    // @ts-ignore
    const sellerPhone = car.owner?.phone || car.contactPhone || "+249123456789";
    const message = isRTL
      ? `مرحباً، أريد تقديم عرض سعر للسيارة: ${car.title}\nالسعر المقترح: ${parseInt(offerPrice).toLocaleString()} جنيه`
      : `Hello, I would like to make an offer for the car: ${car.title}\nOffered Price: ${parseInt(offerPrice).toLocaleString()} SDG`;

    const cleanPhone = sellerPhone.replace(/[^0-9]/g, "");
    const whatsappUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    const webWhatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    try {
      try {
        await Linking.openURL(whatsappUrl);
      } catch (err) {
        try {
          await Linking.openURL(webWhatsappUrl);
        } catch (err2) {
          Alert.alert(
            isRTL ? "تنبيه" : "Alert",
            isRTL ? "واتساب غير مثبت" : "WhatsApp is not installed"
          );
        }
      }
    } catch (e) {
      console.error("WhatsApp error:", e);
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      // In a real app, this would be a dynamic link (e.g., Firebase Dynamic Link or Branch.io)
      // that handles the redirection logic (App vs Store).
      // const appScheme = "sudamark://car/" + car.id;
      const webUrl = "https://sudamark.cloud/"; // Fallback/Landing page
      const palyStoreUrl = "https://play.google.com/store/apps/details?id=com.sudamark.app"; // Fallback/Landing page

      const shareMessage = isRTL
        ? `${car.title}\n${car.price.toLocaleString()} جنيه\n${car.city}\n\nشاهد التفاصيل في تطبيق سودامارك:\n${webUrl}\n\nأو افتح التطبيق في play store:\n${palyStoreUrl}`
        : `${car.title}\n${car.price.toLocaleString()} SDG\n${car.city}\n\nCheck it out on Sudamark App:\n${webUrl}\n\nOr open in play store:\n${palyStoreUrl}`;

      await Share.share({
        message: shareMessage,
        title: car.title,
        url: webUrl, // iOS sometimes uses this
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const handleCallSeller = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // @ts-ignore - owner is joined from backend
    const sellerPhone = car.owner?.phone || car.contactPhone || "+249123456789";
    // Sanitize phone number to remove spaces and special characters that might break the URL
    const cleanPhone = sellerPhone.replace(/[\s\-\(\)]/g, "");
    const url = `tel:${cleanPhone}`;

    try {
      await Linking.openURL(url);
    } catch (e) {
      console.error("Call error:", e);
      Alert.alert(
        isRTL ? "خطأ" : "Error",
        isRTL ? "لا يمكن إجراء مكالمة" : "Cannot make a call",
      );
    }
  };

  const handleWhatsAppSeller = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // @ts-ignore
    const sellerPhone = car.owner?.phone || car.contactPhone || "+249123456789";
    const message = isRTL
      ? `مرحباً، أريد الاستفسار عن السيارة: ${car.title}`
      : `Hello, I'm interested in the car: ${car.title}`;
    const cleanPhone = sellerPhone.replace(/[^0-9]/g, "");
    const whatsappUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    const webWhatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    try {
      await Linking.openURL(whatsappUrl);
    } catch {
      Linking.openURL(webWhatsappUrl).catch(() => { });
    }
  };

  const specs = [
    { labelKey: "year", value: car.year.toString(), icon: "calendar" as const },
    {
      labelKey: "mileage",
      value: `${car.mileage?.toLocaleString() || "N/A"} ${t("km")}`,
      icon: "activity" as const,
    },
    { labelKey: "city", value: t(CITIES.find((c) => c.id === car.city)?.labelKey || car.city), icon: "map-pin" as const },
    { labelKey: "category", value: t(car.category), icon: "tag" as const },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(
                e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
              );
              setCurrentImageIndex(index);
            }}
          >
            {car.images.map((uri, index) => (
              <Image
                key={index}
                source={{
                  uri: uri?.startsWith("http")
                    ? uri
                    : `${require("@/lib/query-client").getApiUrl().replace(/\/$/, "")}${uri}`
                }}
                style={styles.image}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          <View style={styles.imageIndicators}>
            {car.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  {
                    backgroundColor:
                      index === currentImageIndex
                        ? "#FFFFFF"
                        : "rgba(255,255,255,0.5)",
                  },
                ]}
              />
            ))}
          </View>
          {car.isSold && (
            <View style={[styles.soldBadge, isRTL ? styles.soldBadgeRTL : styles.soldBadgeLTR]}>
              <ThemedText style={styles.soldText}>
                {isRTL ? "تم البيع" : "Sold"}
              </ThemedText>
            </View>
          )}
          <Pressable
            style={[styles.closeButton, { top: insets.top + Spacing.sm }]}
            onPress={() => navigation.goBack()}
          >
            <Feather name="x" size={24} color="#FFFFFF" />
          </Pressable>
          <View
            style={[styles.headerActions, { top: insets.top + Spacing.sm }]}
          >
            <Pressable
              style={styles.headerActionButton}
              onPress={() => {
                if (isGuest) {
                  Alert.alert(
                    t("loginRequired"),
                    t("mustLoginToReport"),
                    [
                      { text: t("cancel"), style: "cancel" },
                      { text: t("login"), onPress: () => logout() }
                    ]
                  );
                  return;
                }
                navigation.navigate("Report", {
                  userId: car.sellerId,
                  targetId: car.id,
                  targetType: "car",
                  targetName: car.title
                });
              }
              }
            >
              <Feather name="flag" size={20} color="#EF4444" />
            </Pressable>
            <Pressable style={styles.headerActionButton} onPress={handleShare}>
              <Feather name="share" size={20} color="#FFFFFF" />
            </Pressable>
            <Pressable
              style={styles.headerActionButton}
              onPress={handleFavorite}
            >
              <Feather
                name="heart"
                size={20}
                color={isLiked ? "#EF4444" : "#FFFFFF"}
                fill={isLiked ? "#EF4444" : "transparent"}
              />
            </Pressable>
          </View>
        </View>

        <View style={[styles.content, { backgroundColor: theme.backgroundRoot, marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: Spacing.xl }]}>
          <View
            style={{
              backgroundColor: theme.backgroundSecondary,
              padding: Spacing.lg,
              borderRadius: BorderRadius.lg,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <View style={[styles.priceRow, { marginBottom: Spacing.xs }]}>
              <ThemedText type="h2" style={{ color: theme.primary }}>
                {car.price.toLocaleString()} {t("sdg")}
              </ThemedText>
            </View>

            <ThemedText type="h3" style={[styles.title, { marginTop: 0, marginBottom: Spacing.xs }, isRTL && styles.rtlText]}>
              {car.title}
            </ThemedText>

            <View style={[styles.locationRow, { marginTop: 0 }]}>
              <Feather name="map-pin" size={16} color={theme.textSecondary} />
              <ThemedText
                type="small"
                style={[
                  {
                    color: theme.textSecondary,
                    marginLeft: isRTL ? Spacing.xs : 4,
                    marginRight: isRTL ? Spacing.xs : 4,
                  },
                  isRTL && styles.rtlText,
                ]}
              >
                {t(CITIES.find((c) => c.id === car.city)?.labelKey || car.city)}
              </ThemedText>
            </View>
          </View>

          <View
            style={[
              styles.specsGrid,
              {
                backgroundColor: theme.backgroundSecondary,
                borderWidth: 1,
                borderColor: theme.border,
              }
            ]}
          >
            {specs.map((spec) => (
              <View key={spec.labelKey} style={styles.specItem}>
                <Feather name={spec.icon} size={20} color={theme.primary} />
                <ThemedText
                  type="small"
                  style={[
                    { color: theme.textSecondary, marginTop: Spacing.xs },
                    isRTL && styles.rtlText,
                  ]}
                >
                  {t(spec.labelKey)}
                </ThemedText>
                <ThemedText
                  type="body"
                  style={[{ fontWeight: "600" }, isRTL && styles.rtlText]}
                >
                  {spec.value}
                </ThemedText>
              </View>
            ))}
          </View>

          {car.category !== 'motor_raksha' && (
            <View style={styles.section}>
              <ThemedText type="h4" style={[styles.sectionTitle, isRTL && styles.rtlText]}>
                {isRTL ? "تفاصيل إضافية" : "Additional Details"}
              </ThemedText>
              <View style={[styles.additionalSpecsGrid]}>
                {[
                  { label: t("doors"), value: car.doors || "-", key: "doors" },
                  { label: t("seats"), value: car.seats || "-", key: "seats" },
                  { label: t("seatType"), value: car.seatType ? t(car.seatType) : "-", key: "seatType" },
                  { label: t("exteriorColor"), value: (car.exteriorColor || car.color) ? t(car.exteriorColor || car.color || "") : "-", key: "exteriorColor" },
                  { label: t("interiorColor"), value: car.interiorColor ? t(car.interiorColor) : "-", key: "interiorColor" },
                  { label: t("fuelType"), value: car.fuelType ? t(car.fuelType) : "-", key: "fuelType" },
                  { label: t("gearType"), value: car.gearType ? t(car.gearType) : (car.transmission ? t(car.transmission) : "-"), key: "gearType" },
                  { label: t("engineSize"), value: car.engineSize || "-", key: "engineSize" },
                  { label: t("cylinders"), value: car.cylinders || "-", key: "cylinders" },
                  { label: t("wheels"), value: car.wheels ? t(`rims${car.wheels}`) : "-", key: "wheels" },
                ].filter(spec => {
                  if (car.category === 'motor_raksha') {
                    const hiddenKeys = ['doors', 'seats', 'seatType', 'exteriorColor', 'interiorColor', 'fuelType', 'gearType', 'engineSize', 'cylinders', 'wheels'];
                    return !hiddenKeys.includes(spec.key);
                  }
                  return true;
                }).map((spec, index) => (
                  <View key={index} style={[styles.additionalSpecItem, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, borderWidth: 1 }]}>
                    <ThemedText
                      type="small"
                      style={[
                        { color: theme.textSecondary },
                        isRTL && styles.rtlText,
                      ]}
                    >
                      {spec.label}
                    </ThemedText>
                    <ThemedText
                      type="body"
                      style={[{ fontWeight: "600", marginTop: 4 }, isRTL && styles.rtlText]}
                    >
                      {spec.value}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {car.description ? (
            <View style={styles.section}>
              <ThemedText
                type="h4"
                style={[styles.sectionTitle, isRTL && styles.rtlText]}
              >
                {t("description")}
              </ThemedText>
              <View
                style={{
                  backgroundColor: theme.backgroundSecondary,
                  padding: Spacing.lg,
                  borderRadius: BorderRadius.lg,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <ThemedText
                  style={[
                    { color: theme.textSecondary },
                    isRTL && styles.rtlText,
                  ]}
                >
                  {car.description}
                </ThemedText>
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <ThemedText
              type="h4"
              style={[styles.sectionTitle, isRTL && styles.rtlText]}
            >
              {t("sellerInfo")}
            </ThemedText>
            <View
              style={[
                styles.sellerCard,
                {
                  backgroundColor: theme.backgroundSecondary,
                  borderWidth: 1,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.sellerButtons}>
                {!showContactInfo ? (
                  <Button onPress={() => setShowContactInfo(true)} style={{ flex: 1 }}>
                    {isRTL ? "اضغط هنا لظهور بيانات البائع" : "Click here to show seller info"}
                  </Button>
                ) : (
                  <>
                    <Pressable
                      style={[styles.callButton, { backgroundColor: theme.success }]}
                      onPress={handleCallSeller}
                    >
                      <Feather name="phone" size={28} color="#FFFFFF" />
                    </Pressable>
                    <Pressable
                      style={[styles.callButton, { backgroundColor: "#25D366" }]}
                      onPress={handleWhatsAppSeller}
                    >
                      <Feather name="message-circle" size={28} color="#FFFFFF" />
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + Spacing.md,
            backgroundColor: theme.backgroundRoot,
          },
        ]}
      >
        {isOwnCar ? (
          <View style={{ flexDirection: 'row', flex: 1, gap: Spacing.sm }}>
            <Button onPress={() => navigation.navigate("PostCar", { carData: car })} style={styles.contactButton}>
              {isRTL ? "تعديل" : "Edit"}
            </Button>
            <Button
              onPress={handleToggleSold}
              style={[styles.contactButton, { backgroundColor: car.isSold ? theme.error : theme.success }]}
            >
              {car.isSold
                ? (isRTL ? "إلغاء البيع" : "Unmark Sold")
                : (isRTL ? "تم البيع" : "Mark as Sold")}
            </Button>
          </View>
        ) : (
          <>
            <Button onPress={handleMakeOffer} style={styles.contactButton}>
              {isRTL ? "تقديم عرض" : "Make Offer"}
            </Button>
            {/* <Pressable
              style={[
                styles.inspectionButton,
                { backgroundColor: theme.backgroundSecondary },
              ]}
              onPress={handleRequestInspection}
            >
              <Feather name="clipboard" size={20} color={theme.primary} />
              <ThemedText
                style={[
                  {
                    color: theme.primary,
                    marginLeft: isRTL ? 0 : Spacing.sm,
                    marginRight: isRTL ? Spacing.sm : 0,
                  },
                  isRTL && styles.rtlText,
                ]}
              >
                {t("requestInspection")}
              </ThemedText>
            </Pressable> */}
          </>
        )}
      </View>

      <Modal
        visible={showOfferModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowOfferModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowOfferModal(false)}
        >
          <Pressable
            style={[
              styles.modalContent,
              { backgroundColor: theme.backgroundRoot },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: theme.border },
              ]}
            >
              <ThemedText type="h3" style={isRTL ? styles.rtlText : undefined}>
                {isRTL ? "تقديم عرض" : "Make an Offer"}
              </ThemedText>
              <Pressable onPress={handleShare}>
                <Feather name="share" size={24} color={theme.text} />
              </Pressable>
              <Pressable
                onPress={() =>
                  navigation.navigate("Report", { userId: car.sellerId })
                }
                style={{ marginLeft: 8 }}
              >
                <Feather name="flag" size={24} color={theme.error} />
              </Pressable>
              <Pressable
                onPress={() => setShowOfferModal(false)}
                style={{ marginLeft: 8 }}
              >
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <KeyboardAwareScrollViewCompat style={styles.modalBody}>
              <View
                style={[
                  styles.carSummary,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
              >
                <ThemedText
                  type="body"
                  style={[{ fontWeight: "600" }, isRTL && styles.rtlText]}
                >
                  {car.title}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {isRTL ? "السعر المطلوب:" : "Asking price:"}{" "}
                  {car.price.toLocaleString()} {t("sdg")}
                </ThemedText>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText
                  type="body"
                  style={[styles.inputLabel, isRTL && styles.rtlText]}
                >
                  {isRTL ? "عرضك (جنيه)" : "Your Offer (SDG)"}
                </ThemedText>
                <TextInput
                  style={[
                    styles.priceInput,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  value={offerPrice}
                  onChangeText={setOfferPrice}
                  keyboardType="numeric"
                  placeholder={isRTL ? "أدخل السعر" : "Enter your offer"}
                  placeholderTextColor={theme.textSecondary}
                  textAlign={isRTL ? "right" : "left"}
                />
              </View>
            </KeyboardAwareScrollViewCompat>

            <View
              style={[
                styles.modalFooter,
                { paddingBottom: insets.bottom + Spacing.md },
              ]}
            >
              <Button
                onPress={handleSubmitOffer}
                disabled={isSubmittingOffer}
                style={styles.submitButton}
              >
                {isSubmittingOffer
                  ? isRTL
                    ? "جاري الإرسال..."
                    : "Sending..."
                  : isRTL
                    ? "إرسال العرض"
                    : "Submit Offer"}
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
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
    bottom: Spacing.lg + 30, // Push up out of the overlapping sheet's way
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
  priceRowRTL: {
    flexDirection: "row-reverse",
  },
  offerBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  title: {
    marginTop: Spacing.sm,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  locationRowRTL: {
    flexDirection: "row-reverse",
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
  additionalSpecsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  additionalSpecItem: {
    width: "48%",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
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
  sellerCardRTL: {
    flexDirection: "row-reverse",
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
  sellerInfoRTL: {
    marginLeft: 0,
    marginRight: Spacing.md,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  ratingRowRTL: {
    flexDirection: "row-reverse",
  },
  sellerButtons: {
    flexDirection: "row",
    gap: Spacing.xl,
    justifyContent: "center",
    width: "100%",
  },
  sellerButtonsRTL: {
    flexDirection: "row-reverse",
  },
  callButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
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
  footerRTL: {
    flexDirection: "row-reverse",
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
  rtlText: {
    writingDirection: "rtl",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
  },
  modalHeaderRTL: {
    flexDirection: "row-reverse",
  },
  modalBody: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  carSummary: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    marginBottom: Spacing.sm,
    fontWeight: "500",
  },
  priceInput: {
    height: 56,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 18,
    fontWeight: "600",
  },
  messageInput: {
    minHeight: 100,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    fontSize: 16,
  },
  modalFooter: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  submitButton: {
    width: "100%",
  },
  soldBadge: {
    position: "absolute",
    top: 10,
    backgroundColor: "#FF3B30",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  soldBadgeLTR: {
    right: 10,
  },
  soldBadgeRTL: {
    left: 10,
  },
  soldText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
});
