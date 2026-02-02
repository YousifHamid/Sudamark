import { useTheme } from '@/hooks/useTheme';
import React, { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    cancelAnimation,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CAR_WIDTH = 120; // Approx width of the car image to ensure it goes fully off screen

export function AnimatedHeaderBackground() {
    const { theme } = useTheme();
    // Start position: just outside the left edge
    const translateX = useSharedValue(-CAR_WIDTH);

    useEffect(() => {
        // Stop any previous animation
        cancelAnimation(translateX);

        // Reset position (start from right)
        translateX.value = SCREEN_WIDTH;

        // Animate to left edge - car width (completely off screen to the left)
        translateX.value = withRepeat(
            withTiming(-SCREEN_WIDTH, {
                duration: 8000,
                easing: Easing.linear,
            }),
            -1, // Infinite repeates
            false // Do not reverse
        );
    }, [translateX]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
        };
    });

    return (
        <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
            <Animated.View style={[styles.carContainer, animatedStyle]}>
                <Image
                    source={require("../../assets/images/car.png")}
                    style={styles.carImage}
                    resizeMode="contain"
                />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end', // Align items to the bottom
        overflow: 'hidden', // Ensure car disappears when off-screen if parent doesn't clip
    },
    carContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0, // Base position, animated via transform
        width: 120, // Should match CAR_WIDTH logic or be dynamic
        height: 80, // Adjust height as needed
    },
    carImage: {
        width: '100%',
        height: '100%',
        opacity: 0.3, // Make it subtle
    },
});
