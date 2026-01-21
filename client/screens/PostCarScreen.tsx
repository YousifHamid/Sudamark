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
import { useLanguage, translations } from "@/contexts/LanguageContext";
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
  label: string;
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
                {item.label}
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
  const { addCar, updateCar, deleteCar } = useCars();



  const categories = [
    { id: "small_salon", labelKey: "smallSalon" },
    { id: "4x4", labelKey: "fourByFour" },
    { id: "bus", labelKey: "bus" },
    { id: "truck", labelKey: "truck" },
    { id: "motor", labelKey: "motor" },
    { id: "raksha", labelKey: "raksha" },
  ];

  const conditions = [
    { id: "new", labelKey: "newCar" },
    { id: "used", labelKey: "usedCar" },
  ];

  const advertiserTypes = [
    { id: "owner", labelKey: "owner" },
    { id: "broker", labelKey: "broker" },
    { id: "office", labelKey: "office" },
  ];

  const insuranceTypes = [
    { id: "comprehensive", labelKey: "comprehensive" },
    { id: "mandatory", labelKey: "mandatory" },
    { id: "none", labelKey: "none" },
  ];

  const fuelTypes = [
    { id: "petrol", labelKey: "petrol" },
    { id: "diesel", labelKey: "diesel" },
    { id: "hybrid", labelKey: "hybrid" },
    { id: "electric", labelKey: "electric" },
  ];

  const gearTypes = [
    { id: "automatic", labelKey: "automatic" },
    { id: "manual", labelKey: "manual" },
    { id: "tiptronic", labelKey: "tiptronic" },
  ];

  const seatTypes = [
    { id: "leather", labelKey: "leather" },
    { id: "fabric", labelKey: "fabric" },
    { id: "velvet", labelKey: "velvet" },
  ];

  const colors = [
    { id: "white", labelKey: "white" },
    { id: "black", labelKey: "black" },
    { id: "silver", labelKey: "silver" },
    { id: "grey", labelKey: "grey" },
    { id: "red", labelKey: "red" },
    { id: "blue", labelKey: "blue" },
    { id: "brown", labelKey: "brown" },
    { id: "gold", labelKey: "gold" },
    { id: "green", labelKey: "green" },
    { id: "beige", labelKey: "beige" },
  ];

  const wheelSizes = ["15", "16", "17", "18", "19", "20"].map(s => ({ id: s, labelKey: `rims${s}` }));
  const cylinderCounts = ["3", "4", "6", "8", "12"].map(s => ({ id: s, label: s }));
  const doorCounts = ["2", "3", "4", "5"].map(s => ({ id: s, label: s }));
  const seatCounts = ["2", "4", "5", "7", "8"].map(s => ({ id: s, label: s }));
  const engineSizes = ["1.0L", "1.2L", "1.4L", "1.6L", "1.8L", "2.0L", "2.4L", "3.0L", "3.5L", "4.0L", "5.0L"].map(s => ({ id: s, label: s }));


  const route = useRoute<any>();
  const carData = route.params?.carData;
  const isEditing = !!carData;


  const [step, setStep] = useState<ScreenStep>("form");
  const [activeModal, setActiveModal] = useState<'city' | 'category' | 'advertiser' | 'insurance' | 'condition' | 'fuel' | 'gear' | 'seatType' | 'exteriorColor' | 'interiorColor' | 'wheels' | 'cylinders' | 'doors' | 'seats' | 'engineSize' | null>(null);
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
  const [condition, setCondition] = useState("used");
  const [insuranceType, setInsuranceType] = useState(carData?.insuranceType || "mandatory");
  const [advertiserType, setAdvertiserType] = useState(carData?.advertiserType || "owner");
  const [exteriorColor, setExteriorColor] = useState(carData?.exteriorColor || "white");
  const [interiorColor, setInteriorColor] = useState(carData?.interiorColor || "beige");
  const [engineSize, setEngineSize] = useState(carData?.engineSize || "1.6L");
  const [fuelType, setFuelType] = useState(carData?.fuelType || "petrol");
  const [gearType, setGearType] = useState(carData?.gearType || "automatic");
  const [seatType, setSeatType] = useState(carData?.seatType || "fabric");
  const [cylinders, setCylinders] = useState(carData?.cylinders || "4");
  const [wheels, setWheels] = useState(carData?.wheels || "16");
  const [doors, setDoors] = useState(carData?.doors || "4");
  const [seats, setSeats] = useState(carData?.seats || "5");

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
    { id: "Omdurman", labelKey: "omdurman" },
    { id: "Bahri", labelKey: "bahri" },
    { id: "Khartoum", labelKey: "khartoum" },
    { id: "Port Sudan", labelKey: "portSudan" },
    { id: "Kassala", labelKey: "kassala" },
    { id: "Gezira", labelKey: "gezira" },
    { id: "Kordofan", labelKey: "kordofan" },
    { id: "Darfur", labelKey: "darfur" },
    { id: "River Nile", labelKey: "riverNile" },
    { id: "White Nile", labelKey: "whiteNile" },
    { id: "Blue Nile", labelKey: "blueNile" },
    { id: "Northern", labelKey: "northern" },
    { id: "Red Sea", labelKey: "redSea" },
    { id: "Gedaref", labelKey: "gedaref" },
    { id: "Sennar", labelKey: "sennar" },
  ];

  useEffect(() => {
    fetchListingStatus();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? (isRTL ? "تحديث الإعلان" : "Update Ad") : (isRTL ? "إضافة إعلان" : "Add Ad"),
    });
  }, [isEditing, isRTL, navigation]);

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
      Alert.alert(t("error"), t("termsRequired"));
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
      id: isEditing ? carData.id : Date.now().toString(),
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
      color: exteriorColor, // Mapping back to legacy field if needed, or just use exteriorColor
      exteriorColor,
      interiorColor,
      fuelType,
      gearType,
      seatType,
      cylinders,
      wheels,
      doors,
      seats,
      createdAt: isEditing ? carData.createdAt : new Date().toISOString(),
    };

    if (isEditing) {
      await updateCar(carData.id, newCar);
    } else {
      await addCar(newCar);
    }
    setIsLoading(false);
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert(
      isRTL ? "حذف الإعلان" : "Delete Ad",
      isRTL
        ? "هل أنت متأكد أنك تريد حذف هذا الإعلان؟ لا يمكن التراجع عن هذا الإجراء."
        : "Are you sure you want to delete this ad? This action cannot be undone.",
      [
        {
          text: t("cancel"),
          style: "cancel",
        },
        {
          text: t("delete"),
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            const success = await deleteCar(carData.id);
            setIsLoading(false);
            if (success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              navigation.popToTop();
            } else {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert(t("error"), t("deleteFailed") || "Failed to delete ad");
            }
          },
        },
      ],
    );
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponMessage(t("enterCouponCode"));
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
        setCouponMessage(data.error || t("couponInvalid"));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      setCouponValid(false);
      setCouponMessage(t("couponValidationFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCouponSubmit = async () => {
    if (!couponValid) {
      Alert.alert(t("error"), t("validateCodeFirst"));
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
        t("paymentSuccess"),
        t("paymentSuccessMsg"),
        [{ text: t("ok"), onPress: () => navigation.goBack() }],
      );
    } catch (error: any) {
      Alert.alert(
        t("error"),
        error.message || t("couponValidationFailed"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!trxNo || !paymentAmount || !paymentDate) {
      Alert.alert(t("error"), t("fillPaymentDetails"));
      return;
    }

    const parsedAmount = parseInt(paymentAmount);
    const requiredFee = getCategoryFee(category);

    if (isNaN(parsedAmount) || parsedAmount < requiredFee) {
      Alert.alert(
        t("error"),
        t("minAmountError").replace("{amount}", requiredFee.toLocaleString()),
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
        error.message || t("paymentSubmissionFailed"),
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
            {t("waitingApproval")}
          </ThemedText>
          <ThemedText
            style={[
              styles.waitingText,
              { color: theme.textSecondary },
              isRTL && styles.rtlText,
            ]}
          >
            {t("paymentReceivedMsg")}
          </ThemedText>
          <View
            style={[
              styles.paymentSummary,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <View style={styles.summaryRow}>
              <ThemedText style={{ color: theme.textSecondary }}>
                {t("transactionIdLabel")}
              </ThemedText>
              <ThemedText style={styles.summaryValue}>{trxNo}</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText style={{ color: theme.textSecondary }}>
                {t("amountLabel")}
              </ThemedText>
              <ThemedText style={styles.summaryValue}>
                {paymentAmount} {t("sdg")}
              </ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText style={{ color: theme.textSecondary }}>
                {t("dateLabel")}
              </ThemedText>
              <ThemedText style={styles.summaryValue}>{paymentDate}</ThemedText>
            </View>
          </View>
          <Button onPress={() => navigation.goBack()} style={styles.doneButton}>
            {t("done")}
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
              {t("listingFeeTitle")}
            </ThemedText>
            <ThemedText
              style={[
                styles.paymentDesc,
                { color: theme.textSecondary },
                isRTL && styles.rtlText,
              ]}
            >
              {t("requiredAmount")} {getCategoryFee(category).toLocaleString()} {t("sdg")}
            </ThemedText>
          </View>

          <ThemedText
            type="h4"
            style={[styles.sectionTitle, isRTL && styles.rtlText]}
          >
            {t("choosePaymentMethod")}
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
                {t("couponCode")}
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
                {t("directPayment")}
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
                {t("enterCouponCode")}
              </ThemedText>
              <View style={styles.couponInputRow}>
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
                    {isLoading ? "..." : t("check")}
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
                        {t("agreementText")}
                      </ThemedText>
                    </Pressable>
                  </View>

                  <Button
                    onPress={handleCouponSubmit}
                    disabled={isLoading || !isAgreed}
                    style={styles.submitButton}
                  >
                    {isLoading
                      ? t("publishing")
                      : t("publishFree")}
                  </Button>
                </>
              ) : null}
            </View>
          ) : null}

          {paymentMethod === "direct" ? (
            <View style={styles.directPaymentSection}>
              <View style={styles.qrContainer}>
                <ThemedText style={{ marginBottom: Spacing.md, textAlign: 'center' }}>
                  {t("scanToPay")}
                </ThemedText>
                <View style={{ width: 200, height: 200, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center', borderColor: theme.border, borderWidth: 1 }}>
                  <Feather name="maximize" size={48} color={theme.textSecondary} />
                </View>
                <ThemedText style={{ marginTop: Spacing.md, textAlign: 'center' }}>
                  {t("bankLabel")} {t("bankNameValue")}{"\n"}
                  {t("accountLabel")} 1234567{"\n"}
                  {t("accountNameLabel")} {t("accountNameValue")}
                </ThemedText>
              </View>

              <View style={{ gap: Spacing.md }}>
                <View>
                  <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }, isRTL && styles.rtlText]}>
                    {t("transactionIdLabel")}
                  </ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }, isRTL && styles.rtlInput]}
                    placeholder="123456"
                    placeholderTextColor={theme.textSecondary}
                    value={trxNo}
                    onChangeText={setTrxNo}
                  />
                </View>
                <View>
                  <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }, isRTL && styles.rtlText]}>
                    {t("amountLabel")}
                  </ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }, isRTL && styles.rtlInput]}
                    placeholder="5000"
                    keyboardType="number-pad"
                    placeholderTextColor={theme.textSecondary}
                    value={paymentAmount}
                    onChangeText={setPaymentAmount}
                  />
                </View>
                <View>
                  <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }, isRTL && styles.rtlText]}>
                    {t("dateLabel")}
                  </ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }, isRTL && styles.rtlInput]}
                    placeholder={t("exampleDate")}
                    placeholderTextColor={theme.textSecondary}
                    value={paymentDate}
                    onChangeText={setPaymentDate}
                  />
                </View>

                <Button onPress={handlePaymentSubmit} disabled={isLoading} style={styles.submitButton}>
                  {isLoading ? t("submitting") : t("confirmPayment")}
                </Button>
              </View>
            </View>
          ) : null}

          <Pressable style={styles.backLink} onPress={() => setStep("form")}>
            <ThemedText style={{ color: theme.textSecondary, textDecorationLine: 'underline' }}>
              {t("goBackToEdit")}
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
              {t("listingFeeLabel")} {listingStatus.listingFee.toLocaleString()} {t("sdg")}
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
            { id: "front", labelKey: "viewFront" },
            { id: "rear", labelKey: "viewRear" },
            { id: "right", labelKey: "viewRight" },
            { id: "left", labelKey: "viewLeft" },
            { id: "interior", labelKey: "viewInterior" },
            { id: "extra", labelKey: "viewExtra" },
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
                    {t(slot.labelKey)}
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
              flexDirection: isRTL ? 'row-reverse' : 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 12,
            }
          ]}
        >
          <ThemedText style={{ color: theme.text }}>
            {(() => {
              const c = categories.find(c => c.id === category);
              return c ? t(c.labelKey) : "";
            })()}
          </ThemedText>
          <Feather name="chevron-down" size={20} color={theme.textSecondary} />
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
              flexDirection: isRTL ? 'row-reverse' : 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 12,
            }
          ]}
        >
          <ThemedText style={{ color: theme.text }}>
            {(() => {
              const c = conditions.find(c => c.id === condition);
              return c ? t(c.labelKey) : "";
            })()}
          </ThemedText>
          <Feather name="chevron-down" size={20} color={theme.textSecondary} />
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
              flexDirection: isRTL ? 'row-reverse' : 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 12,
            }
          ]}
        >
          <ThemedText style={{ color: theme.text }}>
            {(() => {
              const c = cities.find(c => c.id === city);
              return c ? t(c.labelKey) : "";
            })()}
          </ThemedText>
          <Feather name="chevron-down" size={20} color={theme.textSecondary} />
        </Pressable>
        <ThemedText
          type="small"
          style={{
            fontSize: 10,
            color: theme.textSecondary,
            marginTop: 4,
            ...(isRTL ? { textAlign: "right" } : { textAlign: "left" }),
          }}
        >
          {isRTL
            ? "اختر المدينة التي تتواجد بها السيارة"
            : "Select the city where the car is located"}
        </ThemedText>

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
              flexDirection: isRTL ? 'row-reverse' : 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 12,
            }
          ]}
        >
          <ThemedText style={{ color: theme.text }}>
            {(() => {
              const c = advertiserTypes.find(c => c.id === advertiserType);
              return c ? t(c.labelKey) : "";
            })()}
          </ThemedText>
          <Feather name="chevron-down" size={20} color={theme.textSecondary} />
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
              flexDirection: isRTL ? 'row-reverse' : 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 12,
            }
          ]}
        >
          <ThemedText style={{ color: theme.text }}>
            {(() => {
              const c = insuranceTypes.find(c => c.id === insuranceType);
              return c ? t(c.labelKey) : "";
            })()}
          </ThemedText>
          <Feather name="chevron-down" size={20} color={theme.textSecondary} />
        </Pressable>

        <ThemedText
          type="h4"
          style={{
            marginTop: Spacing.xl,
            marginBottom: Spacing.md,
            textAlign: isRTL ? 'right' : 'left'
          }}
        >
          {isRTL ? "تفاصيل إضافية عن السيارة" : "Additional Car Details"}
        </ThemedText>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, direction: isRTL ? 'rtl' : 'ltr' }}>
          {[
            { key: 'seats', label: 'seats', icon: 'users', modal: 'seats', value: seats },
            { key: 'doors', label: 'doors', icon: 'sidebar', modal: 'doors', value: doors },
            {
              key: 'exteriorColor',
              label: 'exteriorColor',
              icon: 'droplet',
              modal: 'exteriorColor',
              value: (() => {
                const c = colors.find(i => i.id === exteriorColor);
                return c ? t(c.labelKey) : exteriorColor;
              })()
            },
            {
              key: 'seatType',
              label: 'seatType',
              icon: 'layers',
              modal: 'seatType',
              value: (() => {
                const c = seatTypes.find(i => i.id === seatType);
                return c ? t(c.labelKey) : seatType;
              })()
            },
            {
              key: 'fuel',
              label: 'fuelType',
              icon: 'zap',
              modal: 'fuel',
              value: (() => {
                const c = fuelTypes.find(i => i.id === fuelType);
                return c ? t(c.labelKey) : fuelType;
              })()
            },
            {
              key: 'interiorColor',
              label: 'interiorColor',
              icon: 'circle',
              modal: 'interiorColor',
              value: (() => {
                const c = colors.find(i => i.id === interiorColor);
                return c ? t(c.labelKey) : interiorColor;
              })()
            },
            { key: 'engine', label: 'engineSize', icon: 'cpu', modal: 'engineSize', value: engineSize },
            {
              key: 'gear',
              label: 'gearType',
              icon: 'settings',
              modal: 'gear',
              value: (() => {
                const c = gearTypes.find(i => i.id === gearType);
                return c ? t(c.labelKey) : gearType;
              })()
            },
            { key: 'cylinders', label: 'cylinders', icon: 'grid', modal: 'cylinders', value: cylinders },
            {
              key: 'wheels',
              label: 'wheels',
              icon: 'disc',
              modal: 'wheels',
              value: (() => {
                const c = wheelSizes.find(i => i.id === wheels);
                return c ? t(c.labelKey) : wheels;
              })()
            },
          ].map((item: any, index) => (
            <View key={index} style={{ width: '47%' }}>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', marginBottom: Spacing.xs, gap: 6 }}>
                <Feather name={item.icon || 'circle'} size={14} color={theme.primary} />
                <ThemedText type="small" style={{ color: theme.textSecondary }}>{t(item.label)}</ThemedText>
              </View>
              <Pressable
                onPress={() => setActiveModal(item.modal)}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    borderColor: theme.border,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: 12
                  }
                ]}
              >
                <ThemedText style={{ color: theme.text, textAlign: isRTL ? 'right' : 'left' }}>
                  {item.value}
                </ThemedText>
                <Feather name="chevron-down" size={20} color={theme.textSecondary} />
              </Pressable>
            </View>
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
            : isEditing
              ? isRTL ? "تحديث الإعلان" : "Update Ad"
              : listingStatus?.requiresPayment
                ? isRTL
                  ? "متابعة للدفع"
                  : "Continue to Payment"
                : t("postListing")}
        </Button>

        {isEditing && (
          <Button
            variant="outline"
            onPress={handleDelete}
            disabled={isLoading}
            style={[styles.submitButton, { marginTop: Spacing.md, borderColor: theme.error }]}
            textStyle={{ color: theme.error }}
          >
            {isRTL ? "حذف الإعلان" : "Delete Ad"}
          </Button>
        )}
      </KeyboardAwareScrollViewCompat>
      <SelectionModal
        visible={activeModal === 'category'}
        onClose={() => setActiveModal(null)}
        title={t("category")}
        items={categories.map(c => ({ id: c.id, label: t(c.labelKey) }))}
        onSelect={setCategory}
        selectedId={category}
        theme={theme}
        isRTL={isRTL}
        t={t}
      />
      <SelectionModal
        visible={activeModal === 'condition'}
        onClose={() => setActiveModal(null)}
        title={t("condition")}
        items={conditions.map(c => ({ id: c.id, label: t(c.labelKey) }))}
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
        items={cities.map(c => ({ id: c.id, label: t(c.labelKey) }))}
        onSelect={setCity}
        selectedId={city}
        theme={theme}
        isRTL={isRTL}
        t={t}
      />
      <SelectionModal
        visible={activeModal === 'advertiser'}
        onClose={() => setActiveModal(null)}
        title={t("advertiserType")}
        items={advertiserTypes.map(c => ({ id: c.id, label: t(c.labelKey) }))}
        onSelect={setAdvertiserType}
        selectedId={advertiserType}
        theme={theme}
        isRTL={isRTL}
        t={t}
      />
      <SelectionModal
        visible={activeModal === 'insurance'}
        onClose={() => setActiveModal(null)}
        title={t("insurance")}
        items={insuranceTypes.map(c => ({ id: c.id, label: t(c.labelKey) }))}
        onSelect={setInsuranceType}
        selectedId={insuranceType}
        theme={theme}
        isRTL={isRTL}
        t={t}
      />
      <SelectionModal
        visible={activeModal === 'fuel'}
        onClose={() => setActiveModal(null)}
        title={t("fuelType")}
        items={fuelTypes.map(c => ({ id: c.id, label: t(c.labelKey) }))}
        onSelect={setFuelType}
        selectedId={fuelType}
        theme={theme}
        isRTL={isRTL}
        t={t}
      />
      <SelectionModal
        visible={activeModal === 'gear'}
        onClose={() => setActiveModal(null)}
        title={t("gearType")}
        items={gearTypes.map(c => ({ id: c.id, label: t(c.labelKey) }))}
        onSelect={setGearType}
        selectedId={gearType}
        theme={theme}
        isRTL={isRTL}
        t={t}
      />
      <SelectionModal
        visible={activeModal === 'seatType'}
        onClose={() => setActiveModal(null)}
        title={t("seatType")}
        items={seatTypes.map(c => ({ id: c.id, label: t(c.labelKey) }))}
        onSelect={setSeatType}
        selectedId={seatType}
        theme={theme}
        isRTL={isRTL}
        t={t}
      />
      <SelectionModal
        visible={activeModal === 'exteriorColor'}
        onClose={() => setActiveModal(null)}
        title={t("exteriorColor")}
        items={colors.map(c => ({ id: c.id, label: t(c.labelKey) }))}
        onSelect={setExteriorColor}
        selectedId={exteriorColor}
        theme={theme}
        isRTL={isRTL}
        t={t}
      />
      <SelectionModal
        visible={activeModal === 'interiorColor'}
        onClose={() => setActiveModal(null)}
        title={t("interiorColor")}
        items={colors.map(c => ({ id: c.id, label: t(c.labelKey) }))}
        onSelect={setInteriorColor}
        selectedId={interiorColor}
        theme={theme}
        isRTL={isRTL}
        t={t}
      />
      <SelectionModal
        visible={activeModal === 'wheels'}
        onClose={() => setActiveModal(null)}
        title={t("wheels")}
        items={wheelSizes.map(c => ({ id: c.id, label: t(c.labelKey) }))}
        onSelect={setWheels}
        selectedId={wheels}
        theme={theme}
        isRTL={isRTL}
        t={t}
      />
      <SelectionModal
        visible={activeModal === 'cylinders'}
        onClose={() => setActiveModal(null)}
        title={t("cylinders")}
        items={cylinderCounts}
        onSelect={setCylinders}
        selectedId={cylinders}
        theme={theme}
        isRTL={isRTL}
        t={t}
      />
      <SelectionModal
        visible={activeModal === 'doors'}
        onClose={() => setActiveModal(null)}
        title={t("doors")}
        items={doorCounts}
        onSelect={setDoors}
        selectedId={doors}
        theme={theme}
        isRTL={isRTL}
        t={t}
      />
      <SelectionModal
        visible={activeModal === 'seats'}
        onClose={() => setActiveModal(null)}
        title={t("seats")}
        items={seatCounts}
        onSelect={setSeats}
        selectedId={seats}
        theme={theme}
        isRTL={isRTL}
        t={t}
      />
      <SelectionModal
        visible={activeModal === 'engineSize'}
        onClose={() => setActiveModal(null)}
        title={t("engineSize")}
        items={engineSizes}
        onSelect={setEngineSize}
        selectedId={engineSize}
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
    textAlign: "right",
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
