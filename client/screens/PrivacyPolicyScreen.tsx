import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";

export function PrivacyPolicyScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { isRTL } = useLanguage();

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="h3" style={[styles.sectionTitle, isRTL && styles.rtlText]}>
          {isRTL ? "سياسة الخصوصية" : "Privacy Policy"}
        </ThemedText>
        
        <ThemedText style={[styles.paragraph, { color: theme.textSecondary }, isRTL && styles.rtlText]}>
          {isRTL 
            ? "آخر تحديث: ديسمبر 2025"
            : "Last updated: December 2025"}
        </ThemedText>

        <View style={[styles.section, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText type="h4" style={[styles.heading, isRTL && styles.rtlText]}>
            {isRTL ? "1. المعلومات التي نجمعها" : "1. Information We Collect"}
          </ThemedText>
          <ThemedText style={[styles.text, { color: theme.textSecondary }, isRTL && styles.rtlText]}>
            {isRTL 
              ? "نجمع المعلومات التالية: رقم الهاتف، الاسم، المدينة، ومعلومات السيارات التي تنشرها. نستخدم هذه المعلومات لتوفير خدمات التطبيق وتمكين التواصل بين المستخدمين."
              : "We collect the following information: phone number, name, city, and car listing details you provide. We use this information to provide app services and enable communication between users."}
          </ThemedText>
        </View>

        <View style={[styles.section, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText type="h4" style={[styles.heading, isRTL && styles.rtlText]}>
            {isRTL ? "2. كيف نستخدم معلوماتك" : "2. How We Use Your Information"}
          </ThemedText>
          <ThemedText style={[styles.text, { color: theme.textSecondary }, isRTL && styles.rtlText]}>
            {isRTL 
              ? "نستخدم معلوماتك لإنشاء وإدارة حسابك، عرض إعلانات السيارات، تمكين التواصل بين البائعين والمشترين، وتحسين خدماتنا. لن نشارك معلوماتك مع أطراف ثالثة إلا بموافقتك."
              : "We use your information to create and manage your account, display car listings, enable communication between buyers and sellers, and improve our services. We will not share your information with third parties without your consent."}
          </ThemedText>
        </View>

        <View style={[styles.section, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText type="h4" style={[styles.heading, isRTL && styles.rtlText]}>
            {isRTL ? "3. أمان البيانات" : "3. Data Security"}
          </ThemedText>
          <ThemedText style={[styles.text, { color: theme.textSecondary }, isRTL && styles.rtlText]}>
            {isRTL 
              ? "نحن ملتزمون بحماية معلوماتك. نستخدم تقنيات تشفير آمنة لحماية بياناتك الشخصية. ومع ذلك، لا يمكن ضمان أمان البيانات المنقولة عبر الإنترنت بنسبة 100%."
              : "We are committed to protecting your information. We use secure encryption technologies to protect your personal data. However, no data transmission over the internet can be guaranteed to be 100% secure."}
          </ThemedText>
        </View>

        <View style={[styles.section, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText type="h4" style={[styles.heading, isRTL && styles.rtlText]}>
            {isRTL ? "4. حقوقك" : "4. Your Rights"}
          </ThemedText>
          <ThemedText style={[styles.text, { color: theme.textSecondary }, isRTL && styles.rtlText]}>
            {isRTL 
              ? "لديك الحق في الوصول إلى بياناتك الشخصية وتعديلها أو حذفها. يمكنك طلب حذف حسابك في أي وقت عن طريق التواصل معنا."
              : "You have the right to access, modify, or delete your personal data. You can request account deletion at any time by contacting us."}
          </ThemedText>
        </View>

        <View style={[styles.section, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText type="h4" style={[styles.heading, isRTL && styles.rtlText]}>
            {isRTL ? "5. الموقع الجغرافي" : "5. Location Data"}
          </ThemedText>
          <ThemedText style={[styles.text, { color: theme.textSecondary }, isRTL && styles.rtlText]}>
            {isRTL 
              ? "نطلب إذن الموقع لتحديد مدينتك تلقائياً. هذا اختياري ويمكنك اختيار مدينتك يدوياً بدلاً من ذلك. لا نتتبع موقعك بشكل مستمر."
              : "We request location permission to automatically detect your city. This is optional and you can manually select your city instead. We do not continuously track your location."}
          </ThemedText>
        </View>

        <View style={[styles.section, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText type="h4" style={[styles.heading, isRTL && styles.rtlText]}>
            {isRTL ? "6. التواصل معنا" : "6. Contact Us"}
          </ThemedText>
          <ThemedText style={[styles.text, { color: theme.textSecondary }, isRTL && styles.rtlText]}>
            {isRTL 
              ? "إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى التواصل معنا عبر واتساب أو البريد الإلكتروني المتاح في التطبيق."
              : "If you have any questions about this privacy policy, please contact us via WhatsApp or email available in the app."}
          </ThemedText>
        </View>

        <ThemedText style={[styles.footer, { color: theme.textSecondary }, isRTL && styles.rtlText]}>
          {isRTL 
            ? "باستخدام تطبيق عرباتي، فإنك توافق على سياسة الخصوصية هذه."
            : "By using the Arabaty app, you agree to this privacy policy."}
        </ThemedText>
      </ScrollView>
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
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  paragraph: {
    marginBottom: Spacing.xl,
  },
  section: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  heading: {
    marginBottom: Spacing.sm,
  },
  text: {
    lineHeight: 24,
  },
  footer: {
    marginTop: Spacing.xl,
    textAlign: "center",
    fontStyle: "italic",
  },
  rtlText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
});
