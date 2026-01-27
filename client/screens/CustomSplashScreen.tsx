import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';

interface CustomSplashScreenProps {
    onFinish: () => void;
}

export default function CustomSplashScreen({ onFinish }: CustomSplashScreenProps) {
    useEffect(() => {
        const init = async () => {
            // Hide the native splash screen immediately when this component mounts
            await SplashScreen.hideAsync();

            // Show this custom splash screen for 2 seconds
            setTimeout(() => {
                onFinish();
            }, 1000);
        };

        init();
    }, [onFinish]);

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <Image
                source={require('../../assets/images/splash.jpeg')}
                style={styles.image}
                resizeMode="cover"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827',
    },
    image: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
});
