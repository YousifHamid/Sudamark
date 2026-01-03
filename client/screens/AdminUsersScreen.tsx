import React, { useState } from "react";
import { View, FlatList, StyleSheet, Alert, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function AdminUsersScreen() {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const { t, isRTL } = useLanguage();
    const navigation = useNavigation();
    const queryClient = useQueryClient();

    const { data: users = [], isLoading } = useQuery({
        queryKey: ["admin-users"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/admin/users");
            return res.json();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (userId: string) => {
            await apiRequest("DELETE", `/api/admin/users/${userId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            Alert.alert("Success", "User deleted successfully");
        },
        onError: (error) => {
            Alert.alert("Error", "Failed to delete user");
        },
    });

    const handleDelete = (userId: string, userName: string) => {
        Alert.alert(
            "Delete User",
            `Are you sure you want to delete ${userName}? This will delete all their ads and data.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => deleteMutation.mutate(userId),
                },
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={[styles.card, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.userInfo}>
                <ThemedText type="h4">{item.name}</ThemedText>
                <ThemedText style={{ color: theme.textSecondary }}>{item.phone}</ThemedText>
                <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                </ThemedText>
            </View>
            <Pressable
                onPress={() => handleDelete(item.id, item.name)}
                style={[styles.deleteButton, { backgroundColor: theme.error + "20" }]}
            >
                <Feather name="trash-2" size={20} color={theme.error} />
            </Pressable>
        </View>
    );

    return (
        <ThemedView style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={24} color={theme.text} />
                </Pressable>
                <ThemedText type="h3">Manage Users</ThemedText>
            </View>

            <FlatList
                data={users}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        gap: Spacing.md,
    },
    backButton: {
        padding: 8,
    },
    listContent: {
        padding: Spacing.md,
        gap: Spacing.md,
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        justifyContent: "space-between",
    },
    userInfo: {
        flex: 1,
    },
    deleteButton: {
        padding: Spacing.sm,
        borderRadius: BorderRadius.sm,
    },
});
