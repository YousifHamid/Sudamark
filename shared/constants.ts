export const CITIES = [
    { id: "omdurman", labelKey: "omdurman" },
    { id: "bahri", labelKey: "bahri" },
    { id: "khartoum", labelKey: "khartoum" },
    { id: "portsudan", labelKey: "portSudan" },
    { id: "kassala", labelKey: "kassala" },
    { id: "gezira", labelKey: "gezira" },
    { id: "kordofan", labelKey: "kordofan" },
    { id: "darfur", labelKey: "darfur" },
    { id: "river_nile", labelKey: "riverNile" },
    { id: "white_nile", labelKey: "whiteNile" },
    { id: "blue_nile", labelKey: "blueNile" },
    { id: "northern", labelKey: "northern" },
    { id: "red_sea", labelKey: "redSea" },
    { id: "gedaref", labelKey: "gedaref" },
    { id: "sennar", labelKey: "sennar" },
] as const;
// TODO: move to database
export const CATEGORIES = [
    { id: "small_salon", labelKey: "smallSalon", icon: "disc" as const }, // icon mapping needs to be handled in UI or here if icons are consistent
    { id: "sedan", labelKey: "sedan", icon: "disc" as const }, // Note: PostCarScreen uses 'small_salon' but Search/Home use 'sedan'. Unifying might require DB migration or aliasing. Keeping both for now or standardizing. To avoid breaking changes without DB migration, we'll keep existing IDs but should standardize in future. Wait, PostCarScreen has "small_salon" but others have "sedan". Let's check HomeScreen.tsx. It has sedan. PostCarScreen.tsx line 207 defaults to "small_salon" also.
    // Actually, let's look at PostCarScreen.tsx again.
    // line 124: { id: "small_salon", labelKey: "smallSalon" },
    // line 456: category: "sedan" (in coupon submit) -> This is inconsistent in existing code!
    // SearchScreen.tsx line 86: { id: "sedan", labelKey: "sedan" }
    // HomeScreen.tsx line 134: { id: "sedan", labelKey: "sedan", icon: "disc" as const }
    // Use "sedan" as the standard going forward? PostCarScreen.tsx has "small_salon" in the list but "sedan" in hardcoded submit.
    // The list in PostCarScreen: small_salon, 4x4, bus, truck, motor_raksha.
    // The list in SearchScreen: sedan, suv, truck, motor_raksha.
    // The list in HomeScreen: truck, suv, sedan, motor_raksha.
    // "4x4" vs "suv".
    // "small_salon" vs "sedan".
    // I will unify these. I will include all unique ones.
    { id: "sedan", labelKey: "sedan", icon: "disc" as const }, // Mapping 'small_salon' to this concept if possible, or support both aliases?
    { id: "small_salon", labelKey: "smallSalon", icon: "disc" as const }, // Keeping for compatibility with PostCarScreen list
    { id: "suv", labelKey: "suv", icon: "activity" as const },
    { id: "4x4", labelKey: "fourByFour", icon: "activity" as const }, // Alias for SUV logic? Or distinct?
    { id: "truck", labelKey: "truck", icon: "truck" as const },
    { id: "bus", labelKey: "bus", icon: "truck" as const }, // Bus icon?
    { id: "motor_raksha", labelKey: "motor_raksha", icon: "zap" as const },
] as const;

// Allow for a cleaner list that UI can filter or map.
// Better yet, let's try to standardize the "display" list vs raw data.
// For now, I'll export specific lists that match the screen needs but sourced from here to at least remove "magic strings" in the screens.

export const FORM_CATEGORIES = [
    { id: "small_salon", labelKey: "smallSalon" },
    { id: "4x4", labelKey: "fourByFour" },
    { id: "bus", labelKey: "bus" },
    { id: "truck", labelKey: "truck" },
    { id: "motor_raksha", labelKey: "motor_raksha" },
] as const;

export const SEARCH_CATEGORIES = [
    { id: "sedan", labelKey: "sedan", icon: "disc" as const },
    { id: "suv", labelKey: "suv", icon: "activity" as const },
    { id: "truck", labelKey: "truck", icon: "truck" as const },
    { id: "motor_raksha", labelKey: "motor_raksha", icon: "zap" as const },
] as const;


export const CONDITIONS = [
    { id: "new", labelKey: "newCar" },
    { id: "used", labelKey: "usedCar" },
] as const;

export const SEARCH_CONDITIONS = [
    { id: "excellent", labelKey: "excellent", ar: "ممتازة", en: "Excellent" },
    { id: "good", labelKey: "good", ar: "جيدة", en: "Good" },
    { id: "fair", labelKey: "fair", ar: "مقبولة", en: "Fair" },
    // "new"/ "used" mapping? PostCar uses new/used. Search uses excellent/good/fair.
    // This implies a data mismatch. PostCar stores "condition" as "new" or "used".
    // Schema says "condition" is text.
    // Search filters by "condition". If search uses "excellent" but car has "used", they won't match.
    // This logic seems broken in current app or "condition" field in DB means "status" vs "wear".
    // I will preserve existing lists as separate constants for now to avoiding breaking logic I don't fully see.
] as const;


export const ADVERTISER_TYPES = [
    { id: "owner", labelKey: "owner" },
    { id: "broker", labelKey: "broker" },
    { id: "office", labelKey: "office" },
] as const;

export const INSURANCE_TYPES = [
    { id: "comprehensive", labelKey: "comprehensive" },
    { id: "mandatory", labelKey: "mandatory" },
    { id: "none", labelKey: "none" },
] as const;

export const FUEL_TYPES = [
    { id: "petrol", labelKey: "petrol" },
    { id: "diesel", labelKey: "diesel" },
    { id: "hybrid", labelKey: "hybrid" },
    { id: "electric", labelKey: "electric" },
] as const;

export const GEAR_TYPES = [
    { id: "automatic", labelKey: "automatic" },
    { id: "manual", labelKey: "manual" },
    { id: "tiptronic", labelKey: "tiptronic" },
] as const;

export const SEAT_TYPES = [
    { id: "leather", labelKey: "leather" },
    { id: "fabric", labelKey: "fabric" },
    { id: "velvet", labelKey: "velvet" },
] as const;

export const COLORS = [
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
] as const;

export const WHEEL_SIZES = ["15", "16", "17", "18", "19", "20"].map(s => ({ id: s, labelKey: `rims${s}` }));
export const CYLINDER_COUNTS = ["3", "4", "6", "8", "12"].map(s => ({ id: s, label: s }));
export const DOOR_COUNTS = ["2", "3", "4", "5"].map(s => ({ id: s, label: s }));
export const SEAT_COUNTS = ["2", "4", "5", "7", "8"].map(s => ({ id: s, label: s }));
export const ENGINE_SIZES = ["1.0L", "1.2L", "1.4L", "1.6L", "1.8L", "2.0L", "2.4L", "3.0L", "3.5L", "4.0L", "5.0L"].map(s => ({ id: s, label: s }));
