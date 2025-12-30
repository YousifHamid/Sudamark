import React, { useRef, useEffect, useState } from "react";
import { View, StyleSheet, Dimensions, ScrollView, Pressable, Image } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface SliderImage {
  id: string;
  imageUrl: string;
  title?: string;
}

interface ImageSliderProps {
  images: SliderImage[];
  autoPlayInterval?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SLIDER_HEIGHT = 180;

export function ImageSlider({ images, autoPlayInterval = 4000 }: ImageSliderProps) {
  const { theme } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % images.length;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * (SCREEN_WIDTH - Spacing.lg * 2),
        animated: true,
      });
      setCurrentIndex(nextIndex);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [currentIndex, images.length, autoPlayInterval]);

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / (SCREEN_WIDTH - Spacing.lg * 2));
    if (index !== currentIndex && index >= 0 && index < images.length) {
      setCurrentIndex(index);
    }
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        contentContainerStyle={styles.scrollContent}
      >
        {images.map((image, index) => (
          <Pressable key={image.id} style={styles.slide}>
            <Image
              source={{ uri: image.imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.indicators}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              {
                backgroundColor: index === currentIndex ? theme.primary : theme.textSecondary,
                opacity: index === currentIndex ? 1 : 0.4,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
  },
  scrollContent: {
    gap: 0,
  },
  slide: {
    width: SCREEN_WIDTH - Spacing.lg * 2,
    height: SLIDER_HEIGHT,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  indicators: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
