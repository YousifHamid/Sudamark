import { useEffect } from "react";
import { Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review"; // If available, or just use Alert

const LAUNCH_COUNT_KEY = "app_launch_count";
const REVIEW_SHOWN_KEY = "app_review_prompt_shown";

export function useAppReview() {
  useEffect(() => {
    checkAndPromptReview();
  }, []);

  const checkAndPromptReview = async () => {
    try {
      const hasShownReview = await AsyncStorage.getItem(REVIEW_SHOWN_KEY);
      if (hasShownReview === "true") {
        return;
      }

      const launchCountStr = await AsyncStorage.getItem(LAUNCH_COUNT_KEY);
      let launchCount = launchCountStr ? parseInt(launchCountStr, 10) : 0;
      launchCount += 1;
      await AsyncStorage.setItem(LAUNCH_COUNT_KEY, launchCount.toString());

      // User criteria: 5 to 10 launches. Let's pick 5.
      if (launchCount >= 5) {
        // User criteria: Spend more than 2 minutes
        const timer = setTimeout(() => {
          promptReview();
        }, 120000); // 2 minutes

        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.log("Error in app review logic", error);
    }
  };

  const promptReview = async () => {
    try {
      if (await StoreReview.hasAction()) {
        await StoreReview.requestReview();
        await AsyncStorage.setItem(REVIEW_SHOWN_KEY, "true");
      } else {
        // Fallback or custom UI
        Alert.alert(
          "Enjoying the app?",
          "Would you mind taking a moment to rate us on the store?",
          [
            { text: "No thanks", style: "cancel" },
            {
              text: "Rate Now",
              onPress: async () => {
                // Open store URL
                await AsyncStorage.setItem(REVIEW_SHOWN_KEY, "true");
                // Linking.openURL(...) if we had the ID
              },
            },
          ],
        );
      }
    } catch (error) {
      console.log("Error showing review", error);
    }
  };
}
