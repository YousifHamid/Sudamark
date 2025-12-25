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
  welcomeTitle: { ar: "اقل عمولة في تاريخ السودان", en: "Lowest Commission in Sudan's History" },
  welcomeSubtitle: { ar: "بيع وشراء عربيتك بكل سهولة وأمان!", en: "Buy and sell your car easily and safely!" },
  welcomeFeature1: { ar: "تصفح آلاف الإعلانات العربية الموثوقة", en: "Browse thousands of verified Arabic ads" },
  welcomeFeature2: { ar: "تواصل مع البائع مباشرة عبر التطبيق", en: "Contact the seller directly through the app" },
  
  // Official Sponsor
  officialSponsor: { ar: "الراعي الرسمي لهذا الشهر", en: "Official Sponsor of the Month" },
  sponsorName: { ar: "ارشمود الهندسية", en: "Arshmood Engineering" },
  sponsorDesc: { ar: "نبني مشاريع هندسية بشكل ذكي، متكامل، ومستدام يلبي طموحاتك", en: "We build smart, integrated, and sustainable engineering projects that meet your ambitions" },
  
  // Search Filters
  filterPrice: { ar: "السعر", en: "Price" },
  filterLocation: { ar: "الموقع", en: "Location" },
  filterType: { ar: "النوع", en: "Type" },
  filterCondition: { ar: "الحالة", en: "Condition" },
  newCar: { ar: "جديدة", en: "New" },
  usedCar: { ar: "مستعملة", en: "Used" },
  
  // Onboarding Features
  feature1Title: { ar: "اعثر على سيارتك المثالية", en: "Find Your Perfect Car" },
  feature1Desc: { ar: "تصفح آلاف السيارات من بائعين موثوقين", en: "Browse thousands of cars from trusted sellers" },
  feature2Title: { ar: "خدمات موثوقة ومضمونة", en: "Verified & Trusted Services" },
  feature2Desc: { ar: "ميكانيكيين وكهربائيين ومحامين موثقين", en: "Certified mechanics, electricians, and lawyers" },
  feature3Title: { ar: "توصيل وشحن السيارات", en: "Car Delivery & Shipping" },
  feature3Desc: { ar: "خدمات نقل السيارات لجميع أنحاء السودان", en: "Car transport services across Sudan" },
  feature4Title: { ar: "صيانة وإصلاح", en: "Maintenance & Repair" },
  feature4Desc: { ar: "أفضل ورش الصيانة والإصلاح", en: "Best maintenance and repair workshops" },
  feature5Title: { ar: "فحص شامل للسيارات", en: "Comprehensive Car Inspection" },
  feature5Desc: { ar: "مراكز فحص معتمدة وموثوقة", en: "Certified and trusted inspection centers" },
  feature6Title: { ar: "احفظ سياراتك المفضلة", en: "Save Your Favorites" },
  feature6Desc: { ar: "تابع السيارات التي تعجبك بسهولة", en: "Easily track cars you like" },
  feature7Title: { ar: "تقييمات حقيقية", en: "Real Reviews" },
  feature7Desc: { ar: "آراء المستخدمين لمساعدتك في الاختيار", en: "User reviews to help you decide" },
  
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
  selectYourRole: { ar: "اختر أدوارك (يمكنك اختيار أكثر من واحد)", en: "Select Your Roles (you can choose multiple)" },
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
  recentListings: { ar: "إعلانات حديثة", en: "Recent Listings" },
  categories: { ar: "التصنيفات", en: "Categories" },
  seeAll: { ar: "عرض الكل", en: "See All" },
  viewAll: { ar: "عرض الكل", en: "View All" },
  
  // Categories
  sedan: { ar: "سيدان", en: "Sedan" },
  suv: { ar: "دفع رباعي", en: "SUV" },
  sports: { ar: "رياضية", en: "Sports" },
  luxury: { ar: "فاخرة", en: "Luxury" },
  electric: { ar: "كهربائية", en: "Electric" },
  
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
  activity: { ar: "النشاط", en: "Activity" },
  version: { ar: "الإصدار", en: "Version" },
  
  // Car Details
  contactSeller: { ar: "تواصل مع البائع", en: "Contact Seller" },
  requestInspection: { ar: "طلب فحص", en: "Request Inspection" },
  specifications: { ar: "المواصفات", en: "Specifications" },
  year: { ar: "السنة", en: "Year" },
  mileage: { ar: "المسافة المقطوعة", en: "Mileage" },
  transmission: { ar: "ناقل الحركة", en: "Transmission" },
  fuelType: { ar: "نوع الوقود", en: "Fuel Type" },
  category: { ar: "الفئة", en: "Category" },
  sellerInfo: { ar: "معلومات البائع", en: "Seller Info" },
  reviews: { ar: "تقييمات", en: "reviews" },
  carNotFound: { ar: "السيارة غير موجودة", en: "Car not found" },
  
  // Post Car
  newListing: { ar: "إعلان جديد", en: "New Listing" },
  carTitle: { ar: "عنوان السيارة", en: "Car Title" },
  titlePlaceholder: { ar: "مثال: تويوتا كامري 2022 - حالة ممتازة", en: "e.g. Toyota Camry 2022 - Excellent Condition" },
  make: { ar: "الشركة المصنعة", en: "Make" },
  model: { ar: "الموديل", en: "Model" },
  price: { ar: "السعر", en: "Price" },
  priceSdg: { ar: "السعر (جنيه)", en: "Price (SDG)" },
  city: { ar: "المدينة", en: "City" },
  description: { ar: "الوصف", en: "Description" },
  describeYourCar: { ar: "وصف سيارتك...", en: "Describe your car..." },
  photos: { ar: "الصور", en: "Photos" },
  photosUpTo6: { ar: "الصور (حتى 6)", en: "Photos (up to 6)" },
  addPhotos: { ar: "إضافة صور", en: "Add Photos" },
  add: { ar: "إضافة", en: "Add" },
  postListing: { ar: "نشر الإعلان", en: "Post Listing" },
  posting: { ar: "جاري النشر...", en: "Posting..." },
  
  // Cities (Sudan)
  khartoum: { ar: "الخرطوم", en: "Khartoum" },
  omdurman: { ar: "أم درمان", en: "Omdurman" },
  bahri: { ar: "بحري", en: "Bahri" },
  portSudan: { ar: "بورتسودان", en: "Port Sudan" },
  kassala: { ar: "كسلا", en: "Kassala" },
  
  // Errors
  invalidPhoneNumber: { ar: "يرجى إدخال رقم هاتف صحيح", en: "Please enter a valid phone number" },
  invalidCode: { ar: "رمز غير صحيح. جرب 123456", en: "Invalid code. Try 123456" },
  enterName: { ar: "يرجى إدخال اسمك", en: "Please enter your name" },
  selectRole: { ar: "يرجى اختيار دور", en: "Please select a role" },
  enter6DigitCode: { ar: "يرجى إدخال الرمز المكون من 6 أرقام", en: "Please enter the 6-digit code" },
  fillRequiredFields: { ar: "يرجى ملء جميع الحقول المطلوبة", en: "Please fill in all required fields" },
  error: { ar: "خطأ", en: "Error" },
  
  // Currency
  sdg: { ar: "جنيه", en: "SDG" },
  km: { ar: "كم", en: "km" },
  
  // FAB Button
  sell: { ar: "بيع", en: "Sell" },
  listYourCar: { ar: "بيع عربيتك الان", en: "Sell Your Car Now" },
  request: { ar: "اعلان سريع", en: "Quick Ad" },
  
  // Advertisements
  adTitle1: { ar: "أسعار لا تُضاهى!", en: "Unbeatable Prices!" },
  adDesc1: { ar: "اكتشف أفضل العروض على السيارات المستعملة في السودان", en: "Discover the best deals on used cars in Sudan" },
  adTitle2: { ar: "بيع سيارتك بسرعة", en: "Sell Your Car Fast" },
  adDesc2: { ar: "أعلن مجاناً واحصل على مشترين اليوم", en: "List for free and get buyers today" },
  adTitle3: { ar: "فحص سيارات معتمد", en: "Certified Car Inspection" },
  adDesc3: { ar: "تأكد من حالة سيارتك قبل الشراء مع مراكز الفحص الموثوقة", en: "Verify car condition before buying with trusted inspection centers" },
  learnMore: { ar: "اعرف المزيد", en: "Learn More" },
  advertisement: { ar: "إعلان", en: "Ad" },
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
