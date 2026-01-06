import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  Share,
  Linking,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useCars } from "@/hooks/useCars";
import { apiRequest } from "@/lib/query-client";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type CarDetailRouteProp = RouteProp<RootStackParamList, "CarDetail">;

export default function CarDetailScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<CarDetailRouteProp>();
  const { cars, toggleFavorite, isFavorite } = useCars();
  const { token, user } = useAuth();

  const car = cars.find((c) => c.id === route.params.carId);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(car ? isFavorite(car.id) : false);

  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

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

  const handleFavorite = () => {
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

    const whatsappUrl = `whatsapp://send?phone=${sellerPhone}&text=${encodeURIComponent(message)}`;
    const webWhatsappUrl = `https://wa.me/${sellerPhone.replace("+", "")}?text=${encodeURIComponent(message)}`;

    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        Linking.openURL(whatsappUrl);
      } else {
        const canOpenWeb = await Linking.canOpenURL(webWhatsappUrl);
        if (canOpenWeb) {
          Linking.openURL(webWhatsappUrl);
        } else {
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
    const url = `tel:${sellerPhone}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          isRTL ? "خطأ" : "Error",
          isRTL ? "لا يمكن إجراء مكالمة" : "Cannot make a call",
        );
      }
    } catch (e) {
      console.error("Call error:", e);
    }
  };

  const handleWhatsAppSeller = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // @ts-ignore
    const sellerPhone = car.owner?.phone || car.contactPhone || "+249123456789";
    const message = isRTL
      ? `مرحباً، أريد الاستفسار عن السيارة: ${car.title}`
      : `Hello, I'm interested in the car: ${car.title}`;
    const whatsappUrl = `whatsapp://send?phone=${sellerPhone}&text=${encodeURIComponent(message)}`;
    const webWhatsappUrl = `https://wa.me/${sellerPhone.replace("+", "")}?text=${encodeURIComponent(message)}`;

    const canOpen = await Linking.canOpenURL(whatsappUrl);
    if (canOpen) {
      Linking.openURL(whatsappUrl);
    } else {
      const canOpenWeb = await Linking.canOpenURL(webWhatsappUrl);
      if (canOpenWeb) {
        Linking.openURL(webWhatsappUrl);
      }
    }
  };

  const specs = [
    { labelKey: "year", value: car.year.toString(), icon: "calendar" as const },
    {
      labelKey: "mileage",
      value: `${car.mileage?.toLocaleString() || "N/A"} ${t("km")}`,
      icon: "activity" as const,
    },
    { labelKey: "city", value: car.city, icon: "map-pin" as const },
    { labelKey: "category", value: t(car.category), icon: "tag" as const },
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
              onPress={() =>
                navigation.navigate("Report", {
                  userId: car.sellerId,
                  targetId: car.id,
                  targetType: "car",
                  targetName: car.title
                })
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

        <View style={styles.content}>
          <View style={[styles.priceRow, isRTL && styles.priceRowRTL]}>
            <ThemedText type="h2" style={{ color: theme.primary }}>
              {car.price.toLocaleString()} {t("sdg")}
            </ThemedText>
          </View>

          <ThemedText type="h3" style={[styles.title, isRTL && styles.rtlText]}>
            {car.title}
          </ThemedText>

          <View style={[styles.locationRow, isRTL && styles.locationRowRTL]}>
            <Feather name="map-pin" size={16} color={theme.textSecondary} />
            <ThemedText
              type="small"
              style={[
                {
                  color: theme.textSecondary,
                  marginLeft: isRTL ? 0 : Spacing.xs,
                  marginRight: isRTL ? Spacing.xs : 0,
                },
                isRTL && styles.rtlText,
              ]}
            >
              {car.city}
            </ThemedText>
          </View>

          <View
            style={[
              styles.specsGrid,
              { backgroundColor: theme.backgroundDefault },
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

          {car.description ? (
            <View style={styles.section}>
              <ThemedText
                type="h4"
                style={[styles.sectionTitle, isRTL && styles.rtlText]}
              >
                {t("description")}
              </ThemedText>
              <ThemedText
                style={[
                  { color: theme.textSecondary },
                  isRTL && styles.rtlText,
                ]}
              >
                {car.description}
              </ThemedText>
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
                { backgroundColor: theme.backgroundDefault },
                isRTL && styles.sellerCardRTL,
              ]}
            >
              <View
                style={[styles.sellerButtons, isRTL && styles.sellerButtonsRTL]}
              >
                <Pressable
                  style={[
                    styles.callButton,
                    { backgroundColor: theme.success },
                  ]}
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
          isRTL && styles.footerRTL,
        ]}
      >
        {isOwnCar ? (
          <Button onPress={() => navigation.navigate("PostCar", { carData: car })} style={styles.contactButton}>
            {isRTL ? "تعديل الإعلان" : "Edit Listing"}
          </Button>
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
                isRTL && styles.modalHeaderRTL,
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
});
