import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager } from "react-native";

export type Language = "ar" | "en";

interface Translations {
  [key: string]: {
    ar: string;
    en: string;
  };
}

export const translations: Translations = {
  appName: { ar: "عربتي", en: "Arabaty" },
  appTagline: { ar: "سوق السيارات السوداني الالكتروني", en: "Sudan's Online Car Marketplace" },
  
  // Onboarding
  skip: { ar: "تخطي", en: "Skip" },
  next: { ar: "التالي", en: "Next" },
  getStarted: { ar: "ابدأ الآن", en: "Get Started" },
  slide1Title: { ar: "اعثر على سيارتك المثالية", en: "Find Your Perfect Car" },
  slide1Desc: { ar: "تصفح آلاف السيارات من بائعين موثوقين في السودان والمنطقة", en: "Browse thousands of cars from trusted sellers across Sudan and the region" },
  slide2Title: { ar: "خدمات موثوقة", en: "Verified Services" },
  slide2Desc: { ar: "تواصل مع الميكانيكيين والكهربائيين والمحامين ومراكز الفحص", en: "Connect with mechanics, electricians, lawyers and inspection centers" },
  slide3Title: { ar: "اشترِ وبِع بثقة", en: "Buy & Sell with Confidence" },
  slide3Desc: { ar: "معاملات آمنة ومجتمع موثوق لجميع احتياجاتك", en: "Safe transactions and trusted community for all your automotive needs" },
  
  // Login
  phoneNumber: { ar: "رقم الهاتف", en: "Phone Number" },
  enterPhoneToStart: { ar: "أدخل رقم هاتفك للبدء", en: "Enter your phone number to get started" },
  enterVerificationCode: { ar: "أدخل رمز التحقق", en: "Enter the verification code" },
  completeProfile: { ar: "أكمل ملفك الشخصي", en: "Complete your profile" },
  sendVerificationCode: { ar: "إرسال رمز التحقق", en: "Send Verification Code" },
  sending: { ar: "جاري الإرسال...", en: "Sending..." },
  verificationCode: { ar: "رمز التحقق", en: "Verification Code" },
  demoCode: { ar: "تجريبي: استخدم الرمز 123456", en: "Demo: Use code 123456" },
  verifyCode: { ar: "تحقق من الرمز", en: "Verify Code" },
  verifying: { ar: "جاري التحقق...", en: "Verifying..." },
  changePhoneNumber: { ar: "تغيير رقم الهاتف", en: "Change phone number" },
  yourName: { ar: "اسمك", en: "Your Name" },
  enterYourName: { ar: "أدخل اسمك", en: "Enter your name" },
  selectYourRole: { ar: "اختر دورك", en: "Select Your Role" },
  creatingAccount: { ar: "جاري إنشاء الحساب...", en: "Creating Account..." },
  selectCountry: { ar: "اختر البلد", en: "Select Country" },
  
  // Roles
  buyer: { ar: "مشتري", en: "Buyer" },
  seller: { ar: "بائع", en: "Seller" },
  mechanic: { ar: "ميكانيكي", en: "Mechanic" },
  electrician: { ar: "كهربائي", en: "Electrician" },
  lawyer: { ar: "محامي", en: "Lawyer" },
  inspectionCenter: { ar: "مركز فحص", en: "Inspection Center" },
  
  // Tabs
  home: { ar: "الرئيسية", en: "Home" },
  search: { ar: "بحث", en: "Search" },
  services: { ar: "الخدمات", en: "Services" },
  profile: { ar: "الملف", en: "Profile" },
  
  // Home
  featuredCars: { ar: "سيارات مميزة", en: "Featured Cars" },
  categories: { ar: "التصنيفات", en: "Categories" },
  viewAll: { ar: "عرض الكل", en: "View All" },
  
  // Search
  searchCars: { ar: "ابحث عن سيارات...", en: "Search cars..." },
  noCarsFound: { ar: "لم يتم العثور على سيارات", en: "No cars found" },
  adjustFilters: { ar: "حاول تعديل الفلاتر أو البحث", en: "Try adjusting your filters or search query" },
  
  // Services
  all: { ar: "الكل", en: "All" },
  mechanics: { ar: "ميكانيكيين", en: "Mechanics" },
  electricians: { ar: "كهربائيين", en: "Electricians" },
  lawyers: { ar: "محامين", en: "Lawyers" },
  inspection: { ar: "مراكز فحص", en: "Inspection" },
  noProvidersFound: { ar: "لم يتم العثور على مزودي خدمات", en: "No providers found" },
  checkBackLater: { ar: "تحقق لاحقاً من مزودي الخدمات في هذه الفئة", en: "Check back later for service providers in this category" },
  
  // Profile
  myListings: { ar: "إعلاناتي", en: "My Listings" },
  favorites: { ar: "المفضلة", en: "Favorites" },
  settings: { ar: "الإعدادات", en: "Settings" },
  language: { ar: "اللغة", en: "Language" },
  logout: { ar: "تسجيل الخروج", en: "Logout" },
  
  // Car Details
  contactSeller: { ar: "تواصل مع البائع", en: "Contact Seller" },
  requestInspection: { ar: "طلب فحص", en: "Request Inspection" },
  specifications: { ar: "المواصفات", en: "Specifications" },
  year: { ar: "السنة", en: "Year" },
  mileage: { ar: "المسافة المقطوعة", en: "Mileage" },
  transmission: { ar: "ناقل الحركة", en: "Transmission" },
  fuelType: { ar: "نوع الوقود", en: "Fuel Type" },
  
  // Post Car
  newListing: { ar: "إعلان جديد", en: "New Listing" },
  carTitle: { ar: "عنوان السيارة", en: "Car Title" },
  make: { ar: "الشركة المصنعة", en: "Make" },
  model: { ar: "الموديل", en: "Model" },
  price: { ar: "السعر", en: "Price" },
  city: { ar: "المدينة", en: "City" },
  description: { ar: "الوصف", en: "Description" },
  addPhotos: { ar: "إضافة صور", en: "Add Photos" },
  postListing: { ar: "نشر الإعلان", en: "Post Listing" },
  
  // Errors
  invalidPhoneNumber: { ar: "يرجى إدخال رقم هاتف صحيح", en: "Please enter a valid phone number" },
  invalidCode: { ar: "رمز غير صحيح. جرب 123456", en: "Invalid code. Try 123456" },
  enterName: { ar: "يرجى إدخال اسمك", en: "Please enter your name" },
  selectRole: { ar: "يرجى اختيار دور", en: "Please select a role" },
  enter6DigitCode: { ar: "يرجى إدخال الرمز المكون من 6 أرقام", en: "Please enter the 6-digit code" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "@car_marketplace_language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ar");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLang === "en" || savedLang === "ar") {
        setLanguageState(savedLang);
        I18nManager.forceRTL(savedLang === "ar");
      } else {
        I18nManager.forceRTL(true);
      }
    } catch (error) {
      console.error("Error loading language:", error);
    } finally {
      setIsReady(true);
    }
  };

  const setLanguage = async (lang: Language) => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    setLanguageState(lang);
    I18nManager.forceRTL(lang === "ar");
  };

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[language] || translation.en || key;
  };

  if (!isReady) return null;

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isRTL: language === "ar",
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
