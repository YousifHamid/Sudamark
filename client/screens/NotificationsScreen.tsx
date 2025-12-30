import React from "react";
import { View, StyleSheet, FlatList, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function NotificationsScreen() {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const { t, isRTL } = useLanguage();

    // Mock data for now, or empty
    const notifications: any[] = [];

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View
                style={[
                    styles.iconContainer,
                    { backgroundColor: theme.backgroundSecondary },
                ]}
            >
                <Feather name="bell-off" size={48} color={theme.textSecondary} />
            </View>
            <ThemedText type="h4" style={styles.emptyTitle}>
                {isRTL ? "لا توجد إشعارات" : "No Notifications"}
            </ThemedText>
            <ThemedText
                style={[styles.emptySubtitle, { color: theme.textSecondary }]}
            >
                {isRTL
                    ? "سنخبرك عندما يكون هناك تحديثات جديدة"
                    : "We'll let you know when there are new updates"}
            </ThemedText>
        </View>
    );

    return (
        <ThemedView style={styles.container}>
            <FlatList
                data={notifications}
                contentContainerStyle={[
                    styles.content,
                    { paddingBottom: insets.bottom + Spacing.xl },
                ]}
                renderItem={() => null}
                ListEmptyComponent={renderEmptyState}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        padding: Spacing.lg,
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 100,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: Spacing.lg,
    },
    emptyTitle: {
        marginBottom: Spacing.sm,
    },
    emptySubtitle: {
        textAlign: "center",
        maxWidth: "80%",
    },
});
