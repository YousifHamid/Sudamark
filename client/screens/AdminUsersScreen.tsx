import React, { useState } from "react";
import { View, FlatList, StyleSheet, Alert, Pressable, Modal, TextInput, ScrollView } from "react-native";
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


    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [editForm, setEditForm] = useState({ name: "", phone: "", roles: [] as string[] });

    const handleEditOpen = (user: any) => {
        setEditingUser(user);
        setEditForm({
            name: user.name,
            phone: user.phone,
            roles: user.roles || ["buyer"]
        });
    };

    const handleEditClose = () => {
        setEditingUser(null);
        setEditForm({ name: "", phone: "", roles: [] });
    };

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await apiRequest("PUT", `/api/admin/users/${id}`, data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            Alert.alert("Success", "User updated successfully");
            handleEditClose();
        },
        onError: () => {
            Alert.alert("Error", "Failed to update user");
        }
    });

    const handleSaveEdit = () => {
        if (!editingUser) return;
        updateMutation.mutate({
            id: editingUser.id,
            data: editForm
        });
    };

    const toggleRole = (role: string) => {
        setEditForm(prev => {
            const roles = prev.roles.includes(role)
                ? prev.roles.filter(r => r !== role)
                : [...prev.roles, role];
            return { ...prev, roles };
        });
    };

    const availableRoles = ["admin", "buyer", "seller", "mechanic", "electrician", "lawyer", "inspection_center"];

    const handleToggleBlock = (user: any) => {
        const newStatus = !user.isActive;
        const action = newStatus ? "unblock" : "block";
        Alert.alert(
            `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
            `Are you sure you want to ${action} ${user.name}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Confirm",
                    style: "default",
                    onPress: () => updateMutation.mutate({ id: user.id, data: { isActive: newStatus } })
                }
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
                    {item.isActive === false && <ThemedText style={{ color: theme.error }}> (BLOCKED)</ThemedText>}
                </ThemedText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                    {item.roles?.map((role: string) => (
                        <View key={role} style={[styles.roleBadge, { backgroundColor: theme.primary + '20' }]}>
                            <ThemedText style={{ fontSize: 10, color: theme.primary }}>{role}</ThemedText>
                        </View>
                    ))}
                </View>
            </View>
            <View style={styles.actions}>
                <Pressable
                    onPress={() => handleEditOpen(item)}
                    style={[styles.actionButton, { backgroundColor: theme.text + "20" }]}
                >
                    <Feather name="edit-2" size={20} color={theme.text} />
                </Pressable>
                <Pressable
                    onPress={() => handleToggleBlock(item)}
                    style={[styles.actionButton, { backgroundColor: item.isActive ? theme.warning + "20" : theme.success + "20" }]}
                >
                    <Feather name={item.isActive ? "slash" : "check"} size={20} color={item.isActive ? theme.warning : theme.success} />
                </Pressable>
                <Pressable
                    onPress={() => handleDelete(item.id, item.name)}
                    style={[styles.actionButton, { backgroundColor: theme.error + "20" }]}
                >
                    <Feather name="trash-2" size={20} color={theme.error} />
                </Pressable>
            </View>
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

            <Modal
                visible={!!editingUser}
                animationType="slide"
                transparent={true}
                onRequestClose={handleEditClose}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
                        <View style={styles.modalHeader}>
                            <ThemedText type="h3">Edit User</ThemedText>
                            <Pressable onPress={handleEditClose}>
                                <Feather name="x" size={24} color={theme.text} />
                            </Pressable>
                        </View>

                        <ScrollView contentContainerStyle={styles.formContent}>
                            <ThemedText>Name</ThemedText>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundSecondary }]}
                                value={editForm.name}
                                onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                            />

                            <ThemedText>Phone</ThemedText>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundSecondary }]}
                                value={editForm.phone}
                                onChangeText={(text) => setEditForm(prev => ({ ...prev, phone: text }))}
                                keyboardType="phone-pad"
                            />

                            <ThemedText>Roles</ThemedText>
                            <View style={styles.rolesContainer}>
                                {availableRoles.map(role => (
                                    <Pressable
                                        key={role}
                                        onPress={() => toggleRole(role)}
                                        style={[
                                            styles.roleOption,
                                            {
                                                backgroundColor: editForm.roles.includes(role) ? theme.primary : theme.backgroundSecondary,
                                                borderColor: theme.border
                                            }
                                        ]}
                                    >
                                        <ThemedText style={{ color: editForm.roles.includes(role) ? '#fff' : theme.text }}>
                                            {role}
                                        </ThemedText>
                                    </Pressable>
                                ))}
                            </View>
                        </ScrollView>

                        <Pressable onPress={handleSaveEdit} style={[styles.saveButton, { backgroundColor: theme.primary }]}>
                            <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Save Changes</ThemedText>
                        </Pressable>
                    </View>
                </View>
            </Modal>
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
    actions: {
        flexDirection: "row",
        gap: Spacing.sm,
    },
    actionButton: {
        padding: Spacing.sm,
        borderRadius: BorderRadius.sm,
    },
    deleteButton: {
        padding: Spacing.sm,
        borderRadius: BorderRadius.sm,
    },
    roleBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: BorderRadius.lg,
        borderTopRightRadius: BorderRadius.lg,
        padding: Spacing.lg,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    formContent: {
        gap: Spacing.md,
    },
    input: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: 16,
    },
    rolesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    roleOption: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    saveButton: {
        marginTop: Spacing.xl,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
});
