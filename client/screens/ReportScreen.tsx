import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { apiRequest } from "@/lib/query-client";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";

type ReportScreenRouteProp = RouteProp<RootStackParamList, "Report">;

export default function ReportScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLanguage();
  const navigation = useNavigation();
  const route = useRoute<ReportScreenRouteProp>();

  const params = route.params || {};
  const [username, setUsername] = useState(params.targetName || "");
  const [complaintType, setComplaintType] = useState("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  const complaintTypes = [
    { id: "fraud", labelEn: "Fraud / Scam", labelAr: "احتيال / نصب" },
    { id: "harassment", labelEn: "Harassment", labelAr: "إساءة / تحرش" },
    { id: "fake_listing", labelEn: "Fake Listing", labelAr: "إعلان وهمي" },
    { id: "other", labelEn: "Other", labelAr: "أخرى" },
  ];

  const handleSubmit = async () => {
    if (!username || !complaintType || !details) {
      Alert.alert(
        t("error"),
        isRTL
          ? "يرجى ملء جميع الحقول المطلوبة"
          : "Please fill all required fields",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await apiRequest("POST", "/api/reports", {
        targetId: params.targetId || "unknown",
        targetType: params.targetType || "user",
        reason: complaintType,
        details: `${details} (Reported Name: ${username})`,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        isRTL ? "تم الإرسال" : "Submitted",
        isRTL
          ? "تلقينا شكواك وسيتم مراجعتها من قبل فريقنا قريباً."
          : "We received your complaint and it will be reviewed by our team shortly.",
        [{ text: isRTL ? "حسناً" : "OK", onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      console.error("Report error:", error);
      Alert.alert(t("error"), isRTL ? "فشل إرسال الشكوى" : "Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <View style={styles.header}>
          <View
            style={[styles.iconCircle, { backgroundColor: theme.error + "20" }]}
          >
            <Feather name="alert-triangle" size={32} color={theme.error} />
          </View>
          <ThemedText type="h2" style={{ marginTop: Spacing.md }}>
            {isRTL ? "تقديم شكوى" : "Report Issue"}
          </ThemedText>
          <ThemedText
            style={{
              color: theme.textSecondary,
              textAlign: "center",
              marginTop: Spacing.xs,
            }}
          >
            {isRTL
              ? "ساعدنا في الحفاظ على مجتمع آمن بالإبلاغ عن المخالفات"
              : "Help us keep the community safe by reporting violations"}
          </ThemedText>
        </View>

        <View style={styles.form}>
          <ThemedText
            type="small"
            style={[
              styles.label,
              { color: theme.textSecondary },
              isRTL && styles.rtlText,
            ]}
          >
            {isRTL ? "الجهة المبلغ عنها" : "Reported User / Item"} *
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: params.targetId ? theme.backgroundSecondary + "80" : theme.backgroundSecondary,
                color: theme.text,
                borderColor: theme.border,
              },
              isRTL && styles.rtlInput,
            ]}
            placeholder={isRTL ? "اسم المستخدم أو الإعلان" : "Username or Listing Name"}
            placeholderTextColor={theme.textSecondary}
            value={username}
            onChangeText={setUsername}
            textAlign={isRTL ? "right" : "left"}
            editable={!params.targetId} // Lock if passed from navigation
          />

          <ThemedText
            type="small"
            style={[
              styles.label,
              { color: theme.textSecondary, marginTop: Spacing.lg },
              isRTL && styles.rtlText,
            ]}
          >
            {isRTL ? "نوع الشكوى" : "Complaint Type"} *
          </ThemedText>
          <Pressable
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundSecondary,
                borderColor: theme.border,
                justifyContent: "center",
              },
            ]}
            onPress={() => setShowTypePicker(true)}
          >
            <ThemedText
              style={{
                color: complaintType ? theme.text : theme.textSecondary,
                textAlign: isRTL ? "right" : "left",
              }}
            >
              {complaintType
                ? isRTL
                  ? complaintTypes.find((t) => t.id === complaintType)?.labelAr
                  : complaintTypes.find((t) => t.id === complaintType)?.labelEn
                : isRTL
                  ? "اختر النوع"
                  : "Select Type"}
            </ThemedText>
          </Pressable>

          <ThemedText
            type="small"
            style={[
              styles.label,
              { color: theme.textSecondary, marginTop: Spacing.lg },
              isRTL && styles.rtlText,
            ]}
          >
            {isRTL ? "تفاصيل الشكوى" : "Details"} *
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
            placeholder={
              isRTL
                ? "اشرح المشكلة بالتفصيل..."
                : "Explain the issue in detail..."
            }
            placeholderTextColor={theme.textSecondary}
            value={details}
            onChangeText={setDetails}
            textAlign={isRTL ? "right" : "left"}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <Button
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={{ marginTop: Spacing.xl }}
          >
            {isSubmitting
              ? isRTL
                ? "جاري الإرسال..."
                : "Submitting..."
              : isRTL
                ? "إرسال الشكوى"
                : "Submit Complaint"}
          </Button>
        </View>

        <Modal
          visible={showTypePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowTypePicker(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowTypePicker(false)}
          >
            <View
              style={[
                styles.modalContent,
                { backgroundColor: theme.backgroundDefault },
              ]}
            >
              {complaintTypes.map((type) => (
                <Pressable
                  key={type.id}
                  style={[styles.typeItem, { borderBottomColor: theme.border }]}
                  onPress={() => {
                    setComplaintType(type.id);
                    setShowTypePicker(false);
                  }}
                >
                  <ThemedText>{isRTL ? type.labelAr : type.labelEn}</ThemedText>
                  {complaintType === type.id && (
                    <Feather name="check" size={18} color={theme.primary} />
                  )}
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  form: {
    flex: 1,
  },
  label: {
    marginBottom: Spacing.sm,
  },
  rtlText: {
    writingDirection: "rtl",
    textAlign: "right",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  rtlInput: {
    textAlign: "right",
  },
  textArea: {
    height: 120,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  typeItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
});
