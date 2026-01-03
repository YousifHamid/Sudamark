import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  Platform,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useCars } from "@/hooks/useCars";
import { getApiUrl, apiRequest } from "@/lib/query-client";

type ScreenStep = "form" | "payment" | "coupon" | "waiting";
type PaymentMethod = "coupon" | "direct" | null;

interface ListingStatus {
  totalListings: number;
  freeLimit: number;
  requiresPayment: boolean;
  listingFee: number;
}

interface SelectionItem {
  id: string;
  labelAr: string;
  labelEn: string;
}

const SelectionModal = ({
  visible,
  onClose,
  title,
  items,
  onSelect,
  selectedId,
  theme,
  isRTL,
  t
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  items: SelectionItem[];
  onSelect: (id: string) => void;
  selectedId: string;
  theme: any;
  isRTL: boolean;
  t: any;
}) => (
  <Modal
    visible={visible}
    animationType="slide"
    transparent
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.modalHeader}>
          <ThemedText type="h4">{title}</ThemedText>
          <Pressable onPress={onClose}>
            <Feather name="x" size={24} color={theme.text} />
          </Pressable>
        </View>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                onSelect(item.id);
                onClose();
                Haptics.selectionAsync();
              }}
              style={[
                styles.modalItem,
                { borderBottomColor: theme.border },
                selectedId === item.id && { backgroundColor: theme.primary + "15" }
              ]}
            >
              <ThemedText style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                {isRTL ? item.labelAr : item.labelEn}
              </ThemedText>
              {selectedId === item.id && (
                <Feather name="check" size={20} color={theme.primary} />
              )}
            </Pressable>
          )}
        />
      </View>
    </View>
  </Modal>
);

export default function PostCarScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { addCar } = useCars();

  const categories = [
    { id: "small_salon", labelEn: "Small Salon", labelAr: "عربة صالون صغير" },
    { id: "4x4", labelEn: "4x4", labelAr: "دفع رباعي" },
    { id: "bus", labelEn: "Bus", labelAr: "حافلة" },
    { id: "truck", labelEn: "Truck", labelAr: "نقل ثقيل" },
  ];

  const conditions = [
    { id: "new", labelEn: "New", labelAr: "جديدة" },
    { id: "used", labelEn: "Used", labelAr: "مستعملة" },
  ];

  const advertiserTypes = [
    { id: "owner", labelAr: "مالك", labelEn: "Owner" },
    { id: "broker", labelAr: "وسيط", labelEn: "Broker" },
    { id: "office", labelAr: "مكتب", labelEn: "Office" },
  ];

  const insuranceTypes = [
    { id: "comprehensive", labelAr: "شامل", labelEn: "Comprehensive" },
    { id: "mandatory", labelAr: "إجباري", labelEn: "Mandatory" },
    { id: "none", labelAr: "لا يوجد", labelEn: "None" },
  ];

  const route = useRoute<any>();
  const carData = route.params?.carData;
  const isEditing = !!carData;

  const [step, setStep] = useState<ScreenStep>("form");
  const [activeModal, setActiveModal] = useState<'city' | 'category' | 'advertiser' | 'insurance' | 'condition' | null>(null);
  const [listingStatus, setListingStatus] = useState<ListingStatus | null>(
    null,
  );

  const [images, setImages] = useState<string[]>(carData?.images || []);
  const [title, setTitle] = useState(carData?.title || "");
  const [make, setMake] = useState(carData?.make || "");
  const [model, setModel] = useState(carData?.model || "");
  const [year, setYear] = useState(carData?.year?.toString() || "");
  const [price, setPrice] = useState(carData?.price?.toString() || "");
  const [mileage, setMileage] = useState(carData?.mileage?.toString() || "");
  const [description, setDescription] = useState(carData?.description || "");
  const [city, setCity] = useState(carData?.city || "");
  const [category, setCategory] = useState(carData?.category || "small_salon");
  const [condition, setCondition] = useState("used"); // Should ideally come from carData too
  const [insuranceType, setInsuranceType] = useState(carData?.insuranceType || "mandatory");
  const [advertiserType, setAdvertiserType] = useState(carData?.advertiserType || "owner");
  const [color, setColor] = useState(carData?.color || "");
  const [engineSize, setEngineSize] = useState(carData?.engineSize || "");

  const [carImages, setCarImages] = useState<Record<string, string | null>>({
    front: carData?.images?.[0] || null,
    rear: carData?.images?.[1] || null,
    right: carData?.images?.[2] || null,
    left: carData?.images?.[3] || null,
    interior: carData?.images?.[4] || null,
    extra: carData?.images?.[5] || null,
  });

  const getCategoryFee = (cat: string) => {
    return 10000;
  };

  const [isLoading, setIsLoading] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [isFormAgreed, setIsFormAgreed] = useState(false);

  const [trxNo, setTrxNo] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponValid, setCouponValid] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  const cities = [
    { id: "khartoum", nameEn: "Khartoum", nameAr: "الخرطوم" },
    { id: "bahri", nameEn: "Bahri", nameAr: "بحري" },
    { id: "omdurman", nameEn: "Omdurman", nameAr: "أم درمان" },
    { id: "portsudan", nameEn: "Port Sudan", nameAr: "بورتسودان" },
    { id: "kassala", nameEn: "Kassala", nameAr: "كسلا" },
    { id: "gezira", nameEn: "Al Gezira", nameAr: "الجزيرة" },
    { id: "kordofan", nameEn: "Kordofan", nameAr: "كردفان" },
    { id: "darfur", nameEn: "Darfur", nameAr: "دارفور" },
    { id: "river_nile", nameEn: "River Nile", nameAr: "نهر النيل" },
    { id: "white_nile", nameEn: "White Nile", nameAr: "النيل الأبيض" },
    { id: "blue_nile", nameEn: "Blue Nile", nameAr: "النيل الأزرق" },
    { id: "northern", nameEn: "Northern", nameAr: "الشمالية" },
    { id: "red_sea", nameEn: "Red Sea", nameAr: "البحر الأحمر" },
    { id: "gedaref", nameEn: "Al Qadarif", nameAr: "القضارف" },
    { id: "sennar", nameEn: "Sennar", nameAr: "سنار" },
  ];

  useEffect(() => {
    fetchListingStatus();
  }, []);

  const fetchListingStatus = async () => {
    try {
      const response = await fetch(
        new URL("/api/listings/status", getApiUrl()).toString(),
      );
      const data = await response.json();
      setListingStatus(data);
    } catch (error) {
      console.log("Could not fetch listing status");
    }
  };

  const pickImage = async (slot: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setCarImages((prev) => ({ ...prev, [slot]: result.assets[0].uri }));
      Haptics.selectionAsync();
    }
  };

  const removeImage = (slot: string) => {
    setCarImages((prev) => ({ ...prev, [slot]: null }));
    Haptics.selectionAsync();
  };

  const handleSubmit = async () => {
    if (!title || !make || !model || !year || !price || !city) {
      Alert.alert(t("error"), t("fillRequiredFields"));
      return;
    }

    if (!isFormAgreed) {
      Alert.alert(
        t("error"),
        isRTL
          ? "يجب الموافقة على الشروط والأحكام أولاً"
          : "You must agree to the terms and conditions first",
      );
      return;
    }

    if (listingStatus?.requiresPayment) {
      setPaymentModalVisible(true);
      return;
    }

    await submitCar();
  };

  const submitCar = async () => {
    setIsLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const newCar = {
      id: Date.now().toString(),
      title,
      make,
      model,
      year: parseInt(year),
      price: parseInt(price),
      mileage: mileage ? parseInt(mileage) : 0,
      description,
      city,
      images: Object.values(carImages).filter((img): img is string => img !== null),
      sellerId: user?.id || "",
      category,
      condition,
      insuranceType,
      advertiserType,
      engineSize,
      color,
      createdAt: new Date().toISOString(),
    };

    await addCar(newCar);
    setIsLoading(false);
    navigation.goBack();
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponMessage(isRTL ? "أدخل كود الخصم" : "Enter coupon code");
      setCouponValid(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/coupons/validate", {
        code: couponCode.toUpperCase(),
      });
      const data = await response.json();

      if (data.valid) {
        setCouponValid(true);
        setCouponMessage(data.message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setCouponValid(false);
        setCouponMessage(
          data.error || (isRTL ? "كود غير صالح" : "Invalid code"),
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      setCouponValid(false);
      setCouponMessage(isRTL ? "فشل التحقق" : "Validation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCouponSubmit = async () => {
    if (!couponValid) {
      Alert.alert(
        t("error"),
        isRTL ? "تحقق من الكود أولاً" : "Validate code first",
      );
      return;
    }

    setIsLoading(true);
    try {
      const newCar = {
        id: Date.now().toString(),
        title,
        make,
        model,
        year: parseInt(year),
        price: parseInt(price),
        mileage: mileage ? parseInt(mileage) : 0,
        description,
        city,
        images:
          images.length > 0
            ? images
            : [
              "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800",
            ],
        sellerId: user?.id || "",
        category: "sedan",
        condition,
        createdAt: new Date().toISOString(),
        isActive: true,
      };

      const createdCar = await addCar(newCar);
      const carId = createdCar?.id || newCar.id;

      const couponResponse = await apiRequest("POST", "/api/coupons/apply", {
        code: couponCode.toUpperCase(),
        carId,
      });

      if (!couponResponse.ok) {
        const errorData = await couponResponse.json();
        throw new Error(errorData.error || "Coupon application failed");
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        isRTL ? "تم بنجاح!" : "Success!",
        isRTL
          ? "تم إرسال إعلانك للمراجعة."
          : "Your listing has been submitted for approval.",
        [{ text: isRTL ? "تم" : "OK", onPress: () => navigation.goBack() }],
      );
    } catch (error: any) {
      Alert.alert(
        t("error"),
        error.message || (isRTL ? "فشل تطبيق الكود" : "Failed to apply coupon"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!trxNo || !paymentAmount || !paymentDate) {
      Alert.alert(
        t("error"),
        isRTL
          ? "يرجى ملء جميع بيانات الدفع"
          : "Please fill all payment details",
      );
      return;
    }

    const parsedAmount = parseInt(paymentAmount);
    const requiredFee = getCategoryFee(category);

    if (isNaN(parsedAmount) || parsedAmount < requiredFee) {
      Alert.alert(
        t("error"),
        isRTL
          ? `المبلغ يجب أن يكون ${requiredFee.toLocaleString()} جنيه أو أكثر للفئة المختارة`
          : `Amount must be ${requiredFee.toLocaleString()} SDG or more for selected category`,
      );
      return;
    }

    setIsLoading(true);
    try {
      const newCar = {
        id: Date.now().toString(),
        title,
        make,
        model,
        year: parseInt(year),
        price: parseInt(price),
        mileage: mileage ? parseInt(mileage) : 0,
        description,
        city,
        images:
          images.length > 0
            ? images
            : [
              "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800",
            ],
        sellerId: user?.id || "",
        category,
        condition,
        createdAt: new Date().toISOString(),
        isActive: false,
      };

      const createdCar = await addCar(newCar);
      const carId = createdCar?.id || newCar.id;

      const paymentResponse = await apiRequest("POST", "/api/payments", {
        carId,
        trxNo,
        amount: parsedAmount,
        paidAt: paymentDate,
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.error || "Payment submission failed");
      }

      setStep("waiting");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert(
        t("error"),
        error.message ||
        (isRTL ? "فشل في تقديم الدفع" : "Failed to submit payment"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "waiting") {
    return (
      <ThemedView style={styles.container}>
        <View
          style={[
            styles.waitingContainer,
            {
              paddingTop: insets.top + Spacing["4xl"],
              paddingBottom: insets.bottom + Spacing["2xl"],
            },
          ]}
        >
          <View
            style={[
              styles.waitingIcon,
              { backgroundColor: theme.secondary + "20" },
            ]}
          >
            <Feather name="clock" size={48} color={theme.secondary} />
          </View>
          <ThemedText
            type="h2"
            style={[styles.waitingTitle, isRTL && styles.rtlText]}
          >
            {isRTL ? "في انتظار الموافقة" : "Waiting for Approval"}
          </ThemedText>
          <ThemedText
            style={[
              styles.waitingText,
              { color: theme.textSecondary },
              isRTL && styles.rtlText,
            ]}
          >
            {isRTL
              ? "تم استلام طلب الدفع الخاص بك. سيتم مراجعته والموافقة عليه خلال دقائق قليلة."
              : "Your payment request has been received. It will be reviewed and approved within a few minutes."}
          </ThemedText>
          <View
            style={[
              styles.paymentSummary,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <View style={[styles.summaryRow, isRTL && styles.rowRTL]}>
              <ThemedText style={{ color: theme.textSecondary }}>
                {isRTL ? "رقم العملية:" : "Transaction ID:"}
              </ThemedText>
              <ThemedText style={styles.summaryValue}>{trxNo}</ThemedText>
            </View>
            <View style={[styles.summaryRow, isRTL && styles.rowRTL]}>
              <ThemedText style={{ color: theme.textSecondary }}>
                {isRTL ? "المبلغ:" : "Amount:"}
              </ThemedText>
              <ThemedText style={styles.summaryValue}>
                {paymentAmount} {isRTL ? "جنيه" : "SDG"}
              </ThemedText>
            </View>
            <View style={[styles.summaryRow, isRTL && styles.rowRTL]}>
              <ThemedText style={{ color: theme.textSecondary }}>
                {isRTL ? "التاريخ:" : "Date:"}
              </ThemedText>
              <ThemedText style={styles.summaryValue}>{paymentDate}</ThemedText>
            </View>
          </View>
          <Button onPress={() => navigation.goBack()} style={styles.doneButton}>
            {isRTL ? "تم" : "Done"}
          </Button>
        </View>
      </ThemedView>
    );
  }

  if (step === "payment") {
    return (
      <ThemedView style={styles.container}>
        <KeyboardAwareScrollViewCompat
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + Spacing["2xl"] },
          ]}
        >
          <View style={styles.paymentHeader}>
            <View
              style={[
                styles.feeIcon,
                { backgroundColor: theme.secondary + "20" },
              ]}
            >
              <Feather name="credit-card" size={32} color={theme.secondary} />
            </View>
            <ThemedText
              type="h3"
              style={[styles.paymentTitle, isRTL && styles.rtlText]}
            >
              {isRTL ? "رسوم الإعلان" : "Listing Fee"}
            </ThemedText>
            <ThemedText
              style={[
                styles.paymentDesc,
                { color: theme.textSecondary },
                isRTL && styles.rtlText,
              ]}
            >
              {isRTL
                ? `المبلغ المطلوب: ${getCategoryFee(category).toLocaleString()} جنيه سوداني`
                : `Required: ${getCategoryFee(category).toLocaleString()} SDG`}
            </ThemedText>
          </View>

          <ThemedText
            type="h4"
            style={[styles.sectionTitle, isRTL && styles.rtlText]}
          >
            {isRTL ? "اختر طريقة الدفع" : "Choose Payment Method"}
          </ThemedText>

          <View style={styles.paymentOptions}>
            <Pressable
              style={[
                styles.paymentOption,
                {
                  backgroundColor:
                    paymentMethod === "coupon"
                      ? theme.primary + "20"
                      : theme.backgroundSecondary,
                  borderColor:
                    paymentMethod === "coupon" ? theme.primary : theme.border,
                },
              ]}
              onPress={() => {
                setPaymentMethod("coupon");
                Haptics.selectionAsync();
              }}
            >
              <Feather
                name="gift"
                size={24}
                color={
                  paymentMethod === "coupon"
                    ? theme.primary
                    : theme.textSecondary
                }
              />
              <ThemedText
                style={[
                  styles.paymentOptionText,
                  paymentMethod === "coupon" && { color: theme.primary },
                ]}
              >
                {isRTL ? "كود خصم" : "Coupon Code"}
              </ThemedText>
            </Pressable>

            <Pressable
              style={[
                styles.paymentOption,
                {
                  backgroundColor:
                    paymentMethod === "direct"
                      ? theme.primary + "20"
                      : theme.backgroundSecondary,
                  borderColor:
                    paymentMethod === "direct" ? theme.primary : theme.border,
                },
              ]}
              onPress={() => {
                setPaymentMethod("direct");
                Haptics.selectionAsync();
              }}
            >
              <Feather
                name="smartphone"
                size={24}
                color={
                  paymentMethod === "direct"
                    ? theme.primary
                    : theme.textSecondary
                }
              />
              <ThemedText
                style={[
                  styles.paymentOptionText,
                  paymentMethod === "direct" && { color: theme.primary },
                ]}
              >
                {isRTL ? "دفع مباشر" : "Direct Payment"}
              </ThemedText>
            </Pressable>
          </View>

          {paymentMethod === "coupon" ? (
            <View style={styles.couponSection}>
              <ThemedText
                type="small"
                style={[
                  styles.label,
                  { color: theme.textSecondary },
                  isRTL && styles.rtlText,
                ]}
              >
                {isRTL ? "أدخل كود الخصم" : "Enter Coupon Code"}
              </ThemedText>
              <View style={[styles.couponInputRow, isRTL && styles.rowRTL]}>
                <TextInput
                  style={[
                    styles.couponInput,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  placeholder={isRTL ? "مثال: ARA1000" : "e.g. ARA1000"}
                  placeholderTextColor={theme.textSecondary}
                  value={couponCode}
                  onChangeText={(text) => {
                    setCouponCode(text.toUpperCase());
                    setCouponValid(false);
                    setCouponMessage("");
                  }}
                  autoCapitalize="characters"
                  textAlign={isRTL ? "right" : "left"}
                />
                <Pressable
                  style={[
                    styles.validateButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={validateCoupon}
                  disabled={isLoading}
                >
                  <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>
                    {isLoading ? "..." : isRTL ? "تحقق" : "Check"}
                  </ThemedText>
                </Pressable>
              </View>
              {couponMessage ? (
                <View
                  style={[
                    styles.couponMessage,
                    {
                      backgroundColor: couponValid
                        ? theme.success + "20"
                        : theme.error + "20",
                    },
                  ]}
                >
                  <Feather
                    name={couponValid ? "check-circle" : "x-circle"}
                    size={16}
                    color={couponValid ? theme.success : theme.error}
                  />
                  <ThemedText
                    style={{
                      color: couponValid ? theme.success : theme.error,
                      marginLeft: 8,
                    }}
                  >
                    {couponMessage}
                  </ThemedText>
                </View>
              ) : null}
              {couponValid ? (
                <>
                  <View
                    style={[
                      styles.agreementContainer,
                      {
                        backgroundColor: theme.warning + "10",
                        borderColor: theme.warning,
                      },
                    ]}
                  >
                    <Pressable
                      style={styles.checkboxRow}
                      onPress={() => {
                        setIsAgreed(!isAgreed);
                        Haptics.selectionAsync();
                      }}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          isAgreed && {
                            backgroundColor: theme.primary,
                            borderColor: theme.primary,
                          },
                        ]}
                      >
                        {isAgreed && (
                          <Feather name="check" size={14} color="#FFFFFF" />
                        )}
                      </View>
                      <ThemedText
                        style={[
                          styles.agreementText,
                          { color: theme.textSecondary },
                          isRTL && styles.rtlText,
                        ]}
                      >
                        {isRTL
                          ? "أتعهد بأنني مالك السلعة أو مفوض ببيعها، وأن التطبيق مجرد وسيط للعرض ولا يتحمل أي مسؤولية قانونية عن التعاملات المالية أو جودة المعروضات. أنا المسؤول الأول والأخير عن صحة البيانات."
                          : "I agree that I am the owner or authorized seller, and the app is just a listing platform bearing no legal liability for transactions. I am fully responsible for the data accuracy."}
                      </ThemedText>
                    </Pressable>
                  </View>

                  <Button
                    onPress={handleCouponSubmit}
                    disabled={isLoading || !isAgreed}
                    style={styles.submitButton}
                  >
                    {isLoading
                      ? isRTL
                        ? "جاري النشر..."
                        : "Publishing..."
                      : isRTL
                        ? "نشر مجاناً"
                        : "Publish Free"}
                  </Button>
                </>
              ) : null}
            </View>
          ) : null}

          {paymentMethod === "direct" ? (
            <View style={styles.directPaymentSection}>
              <View
                style={[
                  styles.qrContainer,
                  {
                    backgroundColor: theme.backgroundDefault,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Image
                  source={require("../../attached_assets/WhatsApp_Image_2025-12-27_at_12.56.14_AM_1766789892928.jpeg")}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>

              <ThemedText
                type="small"
                style={[
                  styles.label,
                  { color: theme.textSecondary },
                  isRTL && styles.rtlText,
                ]}
              >
                {isRTL ? "رقم العملية (Trx. ID)" : "Transaction ID (Trx. ID)"} *
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                  isRTL && styles.rtlInput,
                ]}
                placeholder={isRTL ? "مثال: 20082275558" : "e.g. 20082275558"}
                placeholderTextColor={theme.textSecondary}
                value={trxNo}
                onChangeText={setTrxNo}
                keyboardType="number-pad"
                textAlign={isRTL ? "right" : "left"}
              />

              <ThemedText
                type="small"
                style={[
                  styles.label,
                  { color: theme.textSecondary },
                  isRTL && styles.rtlText,
                ]}
              >
                {isRTL ? "المبلغ (Amount)" : "Amount"} *
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                  isRTL && styles.rtlInput,
                ]}
                placeholder={
                  isRTL
                    ? getCategoryFee(category).toString()
                    : getCategoryFee(category).toString()
                }
                placeholderTextColor={theme.textSecondary}
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                keyboardType="number-pad"
                textAlign={isRTL ? "right" : "left"}
              />

              <ThemedText
                type="small"
                style={[
                  styles.label,
                  { color: theme.textSecondary },
                  isRTL && styles.rtlText,
                ]}
              >
                {isRTL ? "تاريخ التحويل" : "Transfer Date"} *
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                  isRTL && styles.rtlInput,
                ]}
                placeholder={isRTL ? "مثال: 27-Dec-2025" : "e.g. 27-Dec-2025"}
                placeholderTextColor={theme.textSecondary}
                value={paymentDate}
                onChangeText={setPaymentDate}
                textAlign={isRTL ? "right" : "left"}
              />

              <Button
                onPress={handlePaymentSubmit}
                disabled={isLoading}
                style={styles.submitButton}
              >
                {isLoading
                  ? isRTL
                    ? "جاري الإرسال..."
                    : "Submitting..."
                  : isRTL
                    ? "تأكيد الدفع"
                    : "Confirm Payment"}
              </Button>
            </View>
          ) : null}

          <Pressable onPress={() => setStep("form")} style={styles.backLink}>
            <ThemedText style={{ color: theme.primary }}>
              {isRTL ? "العودة للتعديل" : "Go back to edit"}
            </ThemedText>
          </Pressable>
        </KeyboardAwareScrollViewCompat>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing["2xl"] },
        ]}
      >
        {listingStatus?.requiresPayment ? (
          <View
            style={[
              styles.feeNotice,
              {
                backgroundColor: theme.secondary + "15",
                borderColor: theme.secondary,
              },
            ]}
          >
            <Feather name="info" size={20} color={theme.secondary} />
            <ThemedText
              style={[
                styles.feeNoticeText,
                { color: theme.secondary },
                isRTL && styles.rtlText,
              ]}
            >
              {isRTL
                ? `رسوم الإعلان: ${listingStatus.listingFee.toLocaleString()} جنيه`
                : `Listing fee: ${listingStatus.listingFee.toLocaleString()} SDG`}
            </ThemedText>
          </View>
        ) : null}

        <ThemedText
          type="small"
          style={[
            styles.label,
            { color: theme.textSecondary },
            isRTL && styles.rtlText,
          ]}
        >
          {t("photosUpTo6")}
        </ThemedText>
        <ThemedText
          type="small"
          style={[
            styles.label,
            { color: theme.textSecondary },
            isRTL && styles.rtlText,
          ]}
        >
          {isRTL ? "صور السيارة (6 صور)" : "Car Photos (6 Photos)"}
        </ThemedText>
        <View style={styles.imageGrid}>
          {[
            { id: "front", labelAr: "واجهة أمامية", labelEn: "Front View" },
            { id: "rear", labelAr: "خلفية", labelEn: "Rear View" },
            { id: "right", labelAr: "جانبية يمين", labelEn: "Right Side" },
            { id: "left", labelAr: "جانبية يسار", labelEn: "Left Side" },
            { id: "interior", labelAr: "داخلية", labelEn: "Interior" },
            { id: "extra", labelAr: "إضافية", labelEn: "Extra" },
          ].map((slot) => (
            <Pressable
              key={slot.id}
              style={[
                styles.imageSlot,
                {
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => pickImage(slot.id)}
            >
              {carImages[slot.id] ? (
                <>
                  <Image
                    source={{ uri: carImages[slot.id] || "" }}
                    style={styles.imagePreviewSlot}
                    resizeMode="cover"
                  />
                  <Pressable
                    style={[
                      styles.removeImageButton,
                      { backgroundColor: theme.error },
                    ]}
                    onPress={(e) => {
                      e.stopPropagation();
                      removeImage(slot.id);
                    }}
                  >
                    <Feather name="x" size={14} color="#FFFFFF" />
                  </Pressable>
                </>
              ) : (
                <View style={styles.emptySlot}>
                  <Feather
                    name="camera"
                    size={24}
                    color={theme.textSecondary}
                  />
                  <ThemedText
                    type="small"
                    style={{
                      color: theme.textSecondary,
                      marginTop: 4,
                      textAlign: "center",
                      fontSize: 10,
                    }}
                  >
                    {isRTL ? slot.labelAr : slot.labelEn}
                  </ThemedText>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        <ThemedText
          type="small"
          style={[
            styles.label,
            { color: theme.textSecondary },
            isRTL && styles.rtlText,
          ]}
        >
          {t("category")}
        </ThemedText>
        <Pressable
          onPress={() => setActiveModal('category')}
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundSecondary,
              borderColor: theme.border,
              justifyContent: 'center',
              alignItems: isRTL ? 'flex-end' : 'flex-start'
            }
          ]}
        >
          <ThemedText style={{ color: theme.text }}>
            {isRTL
              ? categories.find(c => c.id === category)?.labelAr
              : categories.find(c => c.id === category)?.labelEn}
          </ThemedText>
        </Pressable>

        <View style={{ height: Spacing.md }} />

        <ThemedText
          type="small"
          style={[
            styles.label,
            { color: theme.textSecondary },
            isRTL && styles.rtlText,
          ]}
        >
          {isRTL ? "الحالة" : "Condition"}
        </ThemedText>
        <Pressable
          onPress={() => setActiveModal('condition')}
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundSecondary,
              borderColor: theme.border,
              justifyContent: 'center',
              alignItems: isRTL ? 'flex-end' : 'flex-start'
            }
          ]}
        >
          <ThemedText style={{ color: theme.text }}>
            {isRTL
              ? conditions.find(c => c.id === condition)?.labelAr
              : conditions.find(c => c.id === condition)?.labelEn}
          </ThemedText>
        </Pressable>

        <ThemedText
          type="small"
          style={[
            styles.label,
            { color: theme.textSecondary },
            isRTL && styles.rtlText,
          ]}
        >
          {t("carTitle")} *
        </ThemedText>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundSecondary,
              color: theme.text,
              borderColor: theme.border,
            },
            isRTL && styles.rtlInput,
          ]}
          placeholder={t("titlePlaceholder")}
          placeholderTextColor={theme.textSecondary}
          value={title}
          onChangeText={setTitle}
          textAlign={isRTL ? "right" : "left"}
        />

        <View style={[styles.row, isRTL && styles.rowRTL]}>
          <View style={styles.halfInput}>
            <ThemedText
              type="small"
              style={[
                styles.label,
                { color: theme.textSecondary },
                isRTL && styles.rtlText,
              ]}
            >
              {t("make")} *
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                },
                isRTL && styles.rtlInput,
              ]}
              placeholder={isRTL ? "تويوتا" : "Toyota"}
              placeholderTextColor={theme.textSecondary}
              value={make}
              onChangeText={setMake}
              textAlign={isRTL ? "right" : "left"}
            />
          </View>
          <View style={styles.halfInput}>
            <ThemedText
              type="small"
              style={[
                styles.label,
                { color: theme.textSecondary },
                isRTL && styles.rtlText,
              ]}
            >
              {t("model")} *
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                },
                isRTL && styles.rtlInput,
              ]}
              placeholder={isRTL ? "كامري" : "Camry"}
              placeholderTextColor={theme.textSecondary}
              value={model}
              onChangeText={setModel}
              textAlign={isRTL ? "right" : "left"}
            />
          </View>
        </View>

        <View style={[styles.row, isRTL && styles.rowRTL]}>
          <View style={styles.halfInput}>
            <ThemedText
              type="small"
              style={[
                styles.label,
                { color: theme.textSecondary },
                isRTL && styles.rtlText,
              ]}
            >
              {t("year")} *
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                },
                isRTL && styles.rtlInput,
              ]}
              placeholder="2022"
              placeholderTextColor={theme.textSecondary}
              value={year}
              onChangeText={setYear}
              keyboardType="number-pad"
              textAlign={isRTL ? "right" : "left"}
            />
          </View>
          <View style={styles.halfInput}>
            <ThemedText
              type="small"
              style={[
                styles.label,
                { color: theme.textSecondary },
                isRTL && styles.rtlText,
              ]}
            >
              {t("priceSdg")} *
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                },
                isRTL && styles.rtlInput,
              ]}
              placeholder="85000"
              placeholderTextColor={theme.textSecondary}
              value={price}
              onChangeText={setPrice}
              keyboardType="number-pad"
              textAlign={isRTL ? "right" : "left"}
            />
          </View>
        </View>

        <ThemedText
          type="small"
          style={[
            styles.label,
            { color: theme.textSecondary },
            isRTL && styles.rtlText,
          ]}
        >
          {t("mileage")} ({t("km")})
        </ThemedText>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundSecondary,
              color: theme.text,
              borderColor: theme.border,
            },
            isRTL && styles.rtlInput,
          ]}
          placeholder="50000"
          placeholderTextColor={theme.textSecondary}
          value={mileage}
          onChangeText={setMileage}
          keyboardType="number-pad"
          textAlign={isRTL ? "right" : "left"}
        />

        <ThemedText
          type="small"
          style={[
            styles.label,
            { color: theme.textSecondary },
            isRTL && styles.rtlText,
          ]}
        >
          {t("city")} *
        </ThemedText>
        <Pressable
          onPress={() => setActiveModal('city')}
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundSecondary,
              borderColor: theme.border,
              justifyContent: 'center',
              alignItems: isRTL ? 'flex-end' : 'flex-start'
            }
          ]}
        >
          <ThemedText style={{ color: theme.text }}>
            {isRTL
              ? cities.find(c => c.id === city)?.nameAr
              : cities.find(c => c.id === city)?.nameEn}
          </ThemedText>
        </Pressable>

        <ThemedText
          type="small"
          style={[
            styles.label,
            { color: theme.textSecondary },
            isRTL && styles.rtlText,
          ]}
        >
          {isRTL ? "نوع المعلن" : "Advertiser Type"}
        </ThemedText>
        <Pressable
          onPress={() => setActiveModal('advertiser')}
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundSecondary,
              borderColor: theme.border,
              justifyContent: 'center',
              alignItems: isRTL ? 'flex-end' : 'flex-start'
            }
          ]}
        >
          <ThemedText style={{ color: theme.text }}>
            {isRTL
              ? advertiserTypes.find(c => c.id === advertiserType)?.labelAr
              : advertiserTypes.find(c => c.id === advertiserType)?.labelEn}
          </ThemedText>
        </Pressable>

        <ThemedText
          type="small"
          style={[
            styles.label,
            { color: theme.textSecondary },
            isRTL && styles.rtlText,
          ]}
        >
          {isRTL ? "التأمين" : "Insurance"}
        </ThemedText>
        <Pressable
          onPress={() => setActiveModal('insurance')}
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundSecondary,
              borderColor: theme.border,
              justifyContent: 'center',
              alignItems: isRTL ? 'flex-end' : 'flex-start'
            }
          ]}
        >
          <ThemedText style={{ color: theme.text }}>
            {isRTL
              ? insuranceTypes.find(c => c.id === insuranceType)?.labelAr
              : insuranceTypes.find(c => c.id === insuranceType)?.labelEn}
          </ThemedText>
        </Pressable>

        <View style={[styles.row, isRTL && styles.rowRTL]}>
          <View style={styles.halfInput}>
            <ThemedText
              type="small"
              style={[
                styles.label,
                { color: theme.textSecondary },
                isRTL && styles.rtlText,
              ]}
            >
              {isRTL ? "اللون" : "Color"}
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                },
                isRTL && styles.rtlInput,
              ]}
              placeholder={isRTL ? "مثال: أبيض" : "e.g. White"}
              placeholderTextColor={theme.textSecondary}
              value={color}
              onChangeText={setColor}
              textAlign={isRTL ? "right" : "left"}
            />
          </View>
          <View style={styles.halfInput}>
            <ThemedText
              type="small"
              style={[
                styles.label,
                { color: theme.textSecondary },
                isRTL && styles.rtlText,
              ]}
            >
              {isRTL ? "سعة المحرك" : "Engine Size"}
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                },
                isRTL && styles.rtlInput,
              ]}
              placeholder={isRTL ? "مثال: 2.4L" : "e.g. 2.4L"}
              placeholderTextColor={theme.textSecondary}
              value={engineSize}
              onChangeText={setEngineSize}
              textAlign={isRTL ? "right" : "left"}
            />
          </View>
        </View>

        <ThemedText
          type="small"
          style={[
            styles.label,
            { color: theme.textSecondary },
            isRTL && styles.rtlText,
          ]}
        >
          {t("description")}
        </ThemedText>
        <TextInput
          style={[
            styles.textArea,
            {
              backgroundColor: theme.backgroundSecondary,
              color: theme.text,
              borderColor: theme.border,
            },
            isRTL && styles.rtlInput,
          ]}
          placeholder={t("describeYourCar")}
          placeholderTextColor={theme.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          textAlign={isRTL ? "right" : "left"}
        />

        <View
          style={[
            styles.agreementContainer,
            {
              backgroundColor: theme.warning + "10",
              borderColor: theme.warning,
              marginTop: Spacing.lg,
            },
          ]}
        >
          <Pressable
            style={styles.checkboxRow}
            onPress={() => {
              setIsFormAgreed(!isFormAgreed);
              Haptics.selectionAsync();
            }}
          >
            <View
              style={[
                styles.checkbox,
                isFormAgreed && {
                  backgroundColor: theme.primary,
                  borderColor: theme.primary,
                },
              ]}
            >
              {isFormAgreed && (
                <Feather name="check" size={14} color="#FFFFFF" />
              )}
            </View>
            <ThemedText
              style={[
                styles.agreementText,
                { color: theme.textSecondary },
                isRTL && styles.rtlText,
              ]}
            >
              {isRTL
                ? "أتعهد بأنني مالك السلعة أو مفوض ببيعها، وأن التطبيق مجرد وسيط للعرض ولا يتحمل أي مسؤولية قانونية عن التعاملات المالية أو جودة المعروضات. أنا المسؤول الأول والأخير عن صحة البيانات."
                : "I agree that I am the owner or authorized seller, and the app is just a listing platform bearing no legal liability for transactions. I am fully responsible for the data accuracy."}
            </ThemedText>
          </Pressable>
        </View>

        <Button
          onPress={handleSubmit}
          disabled={isLoading}
          style={styles.submitButton}
        >
          {isLoading
            ? t("posting")
            : listingStatus?.requiresPayment
              ? isRTL
                ? "متابعة للدفع"
                : "Continue to Payment"
              : t("postListing")}
        </Button>
      </KeyboardAwareScrollViewCompat>
      <SelectionModal
        visible={activeModal === 'category'}
        onClose={() => setActiveModal(null)}
        title={t("category")}
        items={categories}
        onSelect={setCategory}
        selectedId={category}
        theme={theme}
        isRTL={isRTL}
        t={t}
      />
      <SelectionModal
        visible={activeModal === 'condition'}
        onClose={() => setActiveModal(null)}
        title={isRTL ? "الحالة" : "Condition"}
        items={conditions}
        onSelect={setCondition}
        selectedId={condition}
        theme={theme}
        isRTL={isRTL}
        t={t}
      />
      <SelectionModal
        visible={activeModal === 'city'}
        onClose={() => setActiveModal(null)}
        title={t("city")}
        items={cities.map(c => ({ id: c.id, labelAr: c.nameAr, labelEn: c.nameEn }))}
        onSelect={setCity}
        selectedId={city}
        theme={theme}
        isRTL={isRTL}
        t={t}
      />
      <SelectionModal
        visible={activeModal === 'advertiser'}
        onClose={() => setActiveModal(null)}
        title={isRTL ? "نوع المعلن" : "Advertiser Type"}
        items={advertiserTypes}
        onSelect={setAdvertiserType}
        selectedId={advertiserType}
        theme={theme}
        isRTL={isRTL}
        t={t}
      />
      <SelectionModal
        visible={activeModal === 'insurance'}
        onClose={() => setActiveModal(null)}
        title={isRTL ? "التأمين" : "Insurance"}
        items={insuranceTypes}
        onSelect={setInsuranceType}
        selectedId={insuranceType}
        theme={theme}
        isRTL={isRTL}
        t={t}
      />
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
  label: {
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  imagesContainer: {
    marginVertical: Spacing.sm,
  },
  imagesContent: {
    gap: Spacing.sm,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  imageSlot: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  imagePreviewSlot: {
    width: "100%",
    height: "100%",
  },
  emptySlot: {
    alignItems: "center",
    justifyContent: "center",
  },
  imageWrapper: {
    position: "relative",
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.sm,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
  },
  rtlInput: {
    textAlign: "right",
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  rowRTL: {
    flexDirection: "row-reverse",
  },
  halfInput: {
    flex: 1,
  },
  citiesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  citiesRowRTL: {
    flexDirection: "row-reverse",
  },
  cityChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 100,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
  },
  submitButton: {
    marginTop: Spacing["2xl"],
  },
  rtlText: {
    writingDirection: "rtl",
  },
  feeNotice: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  feeNoticeText: {
    flex: 1,
    fontWeight: "600",
  },
  paymentHeader: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  feeIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  paymentTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
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
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
  },
  paymentDesc: {
    textAlign: "center",
    lineHeight: 22,
  },
  qrContainer: {
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginVertical: Spacing.xl,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  backLink: {
    alignItems: "center",
    marginTop: Spacing.lg,
    padding: Spacing.md,
  },
  waitingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  waitingIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  waitingTitle: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  waitingText: {
    textAlign: "center",
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  paymentSummary: {
    width: "100%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  summaryValue: {
    fontWeight: "600",
  },
  doneButton: {
    width: "100%",
  },
  paymentOptions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  paymentOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    gap: Spacing.sm,
  },
  paymentOptionText: {
    fontWeight: "600",
    fontSize: 14,
  },
  couponSection: {
    marginBottom: Spacing.md,
  },
  couponInputRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "center",
  },
  couponInput: {
    flex: 1,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    fontWeight: "600",
  },
  validateButton: {
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  couponMessage: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
  },
  directPaymentSection: {
    marginBottom: Spacing.md,
  },
  agreementContainer: {
    marginBottom: Spacing.xl,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  agreementText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});
