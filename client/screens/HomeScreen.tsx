import { Feather } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@react-navigation/elements";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Dimensions,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CarCard } from "@/components/CarCard";
import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCars } from "@/hooks/useCars";
import { useTheme } from "@/hooks/useTheme";
import { getApiUrl } from "@/lib/query-client";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { SEARCH_CATEGORIES } from "@shared/constants";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const rawHeaderHeight = useHeaderHeight();
  // Fallback if headerHeight returns 0 - use safe area + estimated header height
  const headerHeight = rawHeaderHeight > 0 ? rawHeaderHeight : insets.top + 56;
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { cars, featuredCars, isLoading: isCarsLoading, refreshCars } = useCars();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = React.useState(false);

  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshData = React.useCallback(async () => {
    await Promise.all([
      refreshCars(),
      queryClient.invalidateQueries({ queryKey: ["slider-images"] }),
    ]);
  }, [refreshCars, queryClient]);

  const startAutoRefresh = React.useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      refreshData().catch((e) => console.error("Auto-refresh error:", e));
    }, 10000);
  }, [refreshData]);

  const stopAutoRefresh = React.useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      startAutoRefresh();
      return () => stopAutoRefresh();
    }, [startAutoRefresh, stopAutoRefresh])
  );

  const onRefresh = React.useCallback(async () => {
    stopAutoRefresh();
    setRefreshing(true);
    try {
      await refreshData();
    } catch (e) {
      console.error("Refresh error:", e);
    } finally {
      setRefreshing(false);
      startAutoRefresh();
    }
  }, [refreshData, startAutoRefresh, stopAutoRefresh]);

  const { data: sliderImages = [] } = useQuery({
    queryKey: ["slider-images"],
    queryFn: async () => {
      try {
        const response = await fetch(
          new URL("/api/slider-images", getApiUrl()).toString(),
        );
        if (!response.ok) return [];
        return await response.json();
      } catch (e) {
        return [];
      }
    },
  });

  const displaySlides =
    sliderImages.length > 0
      ? sliderImages
      : [
        {
          id: "default-placeholder",
          title: isRTL ? "أعلن معنا في سودمارك" : "Advertise with Sudamark",
          isPlaceholder: true,
          imageUrl: null, // Trigger gradient fallback
        },
      ];

  const [currentSlideIndex, setCurrentSlideIndex] = React.useState(0);
  const scrollRef = React.useRef<ScrollView>(null);

  // Auto-play Slider logic
  React.useEffect(() => {
    if (displaySlides.length <= 1) return;
    const timer = setInterval(() => {
      const nextIndex = (currentSlideIndex + 1) % displaySlides.length;
      setCurrentSlideIndex(nextIndex);
      scrollRef.current?.scrollTo({
        x: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [currentSlideIndex, displaySlides.length]);



  const categories = SEARCH_CATEGORIES;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}
      contentContainerStyle={{
        paddingTop: 0,
        paddingBottom: tabBarHeight + Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
          progressViewOffset={headerHeight}
        />
      }
    >

      <View style={[styles.section, { paddingHorizontal: 0 }]}>
        <View style={styles.sliderContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(
                e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
              );
              setCurrentSlideIndex(index);
            }}
            ref={scrollRef}
            style={styles.sliderScrollView}
          >
            {displaySlides.map((slide: any, index: number) => (
              <Pressable
                key={slide.id}
                style={[
                  styles.singleSlide,
                  { backgroundColor: theme.cardBackground },
                ]}
                onPress={() =>
                  slide.linkUrl
                    ? console.log("Open Link", slide.linkUrl)
                    : navigation.navigate("Search", { category: "all" })
                }
              >
                {slide.imageUrl ? (
                  <Image
                    source={{
                      uri: slide.imageUrl?.startsWith("http") || slide.imageUrl?.startsWith("data:")
                        ? slide.imageUrl
                        : `${getApiUrl()}${slide.imageUrl?.startsWith("/") ? slide.imageUrl.substring(1) : slide.imageUrl}`
                    }}
                    style={[styles.slideImage, { backgroundColor: theme.cardBackground }]}
                    resizeMode="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={[theme.primary, theme.secondary]}
                    style={styles.adGradient}
                  >
                    <ThemedText style={styles.adText}>
                      {slide.title ||
                        (isRTL ? `إعلان ${index + 1}` : `Ad ${index + 1}`)}
                    </ThemedText>
                  </LinearGradient>
                )}
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.sliderIndicators}>
            {displaySlides.map((_: any, index: number) => (
              <View
                key={index}
                style={[
                  styles.sliderDot,
                  {
                    backgroundColor:
                      index === currentSlideIndex
                        ? theme.primary
                        : theme.border,
                  },
                  index === currentSlideIndex && { width: 20 },
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.categoriesScrollContent,
            { paddingHorizontal: Spacing.lg }, // explicit padding
          ]}
          style={{ marginBottom: Spacing.sm }}
        >
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: theme.border,
                },
              ]}
              onPress={() =>
                navigation.navigate("Search", { category: cat.id })
              }
            >
              <Feather name={cat.icon} size={14} color={theme.textSecondary} />
              <ThemedText style={{ fontSize: 13, color: theme.text }}>
                {t(cat.labelKey)}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {featuredCars.length > 0 && (
        <View style={{ marginBottom: Spacing.lg }}>
          <View
            style={[
              styles.sectionHeader,
              {
                marginHorizontal: Spacing.lg,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.sm,
                backgroundColor: theme.primary,
                borderRadius: BorderRadius.md,
                alignItems: "center", // Center vertically
              },
            ]}
          >
            <ThemedText type="h4" style={[{ color: "#FFFFFF" }, isRTL ? styles.rtlText : undefined]}>
              {t("featuredCars")}
            </ThemedText>
            <Pressable onPress={() => navigation.navigate("Search", { featured: true })}>
              <ThemedText type="link" style={{ fontSize: 14, color: "#FFFFFF" }}>
                {t("seeAll")}
              </ThemedText>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.carsRow,
              { paddingHorizontal: Spacing.lg },
            ]}
          >
            {featuredCars.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                horizontal
                onPress={() =>
                  navigation.navigate("CarDetail", { carId: car.id })
                }
              />
            ))}
          </ScrollView>
        </View>
      )}

      <View style={{ marginBottom: Spacing.lg }}>
        <View
          style={[
            styles.sectionHeader,
            {
              marginHorizontal: Spacing.lg,
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
              backgroundColor: theme.primary,
              borderRadius: BorderRadius.md,
              alignItems: "center", // Center vertically
            },
          ]}
        >
          <ThemedText type="h4" style={[{ color: "#FFFFFF" }, isRTL ? styles.rtlText : undefined]}>
            {t("recentListings")}
          </ThemedText>
          <Pressable onPress={() => navigation.navigate("Search", {})}>
            <ThemedText type="link" style={{ fontSize: 14, color: "#FFFFFF" }}>
              {t("seeAll")}
            </ThemedText>
          </Pressable>
        </View>
        <View style={[styles.carsGrid, { paddingHorizontal: Spacing.lg }]}>
          {cars.map((car) => (
            <View key={car.id} style={styles.gridItem}>
              <CarCard
                car={car}
                horizontal={false} // Use vertical card layout
                onPress={() =>
                  navigation.navigate("CarDetail", { carId: car.id })
                }
              />
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: Spacing.lg }} />
    </ScrollView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  locationHeaderRTL: {
    flexDirection: "row-reverse",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: 0,
    paddingHorizontal: Spacing.sm, // Reduced padding as inner elements handle spacing
    height: 50, // Slightly taller
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    gap: Spacing.sm,
  },
  searchBarRTL: {
    flexDirection: "row-reverse",
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
  },
  section: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: Spacing.md,
  },
  sectionHeaderRTL: {
    flexDirection: "row-reverse",
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    justifyContent: "space-between",
  },
  categoriesGridRTL: {
    flexDirection: "row-reverse",
  },
  categorySquare: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm * 2) / 3.4,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  searchBarContainer: {
    width: "100%",
    marginBottom: Spacing.xs,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryLabel: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 4,
  },
  categoriesRow: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoriesScrollContent: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  categoriesScrollContentRTL: {
    flexDirection: "row-reverse",
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  adText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  adGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
  },
  sliderContainer: {
    paddingHorizontal: 0, // Full width, no padding // Full width
  },
  sliderScrollView: {
    overflow: "hidden",
  },
  singleSlide: {
    width: SCREEN_WIDTH,
    aspectRatio: 1200 / 380, // Aspect ratio matching 1200x380 average size
    borderRadius: 0,
    overflow: "hidden",
  },
  slideImage: {
    width: "100%",
    height: "100%",
  },
  sliderIndicators: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.sm,
    gap: 6,
  },
  sliderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  carsRow: {
    gap: Spacing.md,
    paddingRight: Spacing.lg,
  },
  carsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    justifyContent: "space-between", // Ensures 2 columns with space between
  },
  gridItem: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2, // Calculate width for 2 columns
  },
  rtlText: {
    writingDirection: "rtl",
  },
  sponsorSection: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  sponsorCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  sponsorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  sponsorContentRTL: {
    flexDirection: "row-reverse",
  },
  sponsorLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  sponsorTextContainer: {
    flex: 1,
  },
  sponsorTitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginBottom: 4,
  },
  sponsorName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
