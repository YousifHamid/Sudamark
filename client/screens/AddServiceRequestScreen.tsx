import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/hooks/useTheme";
import { apiRequest } from "@/lib/query-client";
import { CITIES } from "@shared/constants";

const SERVICE_TYPES = [
    { id: "spare_parts", labelKey: "spareParts" },
    { id: "mechanic", labelKey: "mechanic" },
    { id: "electrician", labelKey: "electrician" },
    { id: "inspection", labelKey: "inspectionCenter" },
    { id: "lawyer", labelKey: "lawyer" },
];

const COUNTRY_CODES = [
    { id: "+249", label: "+249" },
    { id: "+966", label: "+966" },
    { id: "+971", label: "+971" },
    { id: "+20", label: "+20" },
];

export default function AddServiceRequestScreen() {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const { t, isRTL } = useLanguage();
    const navigation = useNavigation();
    const { token } = useAuth();

    const [requestType, setRequestType] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [countryCode, setCountryCode] = useState("+249");
    const [city, setCity] = useState("");
    const [address, setAddress] = useState("");
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [showCountryCodeDropdown, setShowCountryCodeDropdown] = useState(false);

    const handleSubmit = async () => {
        if (!requestType || !name || !phone || !city) {
            Alert.alert(t("error"), t("missingRequiredFields"));
            return;
        }

        setIsLoading(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        try {
            await apiRequest("POST", "/api/service-providers", {
                type: requestType,
                name,
                phone: `${countryCode}${phone}`,
                city,
                address: address || null,
                description: description || null,
            });

            Alert.alert(t("requestSent"), t("requestSentMessage"), [
                { text: t("ok"), onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            console.error("Service request error:", error);
            Alert.alert(t("error"), t("failedToSendRequest"));
        } finally {
            setIsLoading(false);
        }
    };

    const renderDropdown = (
        visible: boolean,
        items: { id: string; labelKey?: string; label?: string }[],
        onSelect: (id: string) => void,
        onClose: () => void
    ) => {
        if (!visible) return null;
        return (
            <View
                style={[
                    styles.dropdown,
                    { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
                ]}
            >
                <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                    {items.map((item) => (
                        <Pressable
                            key={item.id}
                            style={[styles.dropdownItem, { borderBottomColor: theme.border }]}
                            onPress={() => {
                                onSelect(item.id);
                                onClose();
                                Haptics.selectionAsync();
                            }}
                        >
                            <ThemedText style={isRTL ? styles.rtlText : undefined}>
                                {item.labelKey ? t(item.labelKey) : item.label}
                            </ThemedText>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>
        );
    };

    return (
        <ThemedView style={styles.container}>
            <KeyboardAwareScrollViewCompat
                contentContainerStyle={[
                    styles.content,
                    { paddingBottom: insets.bottom + Spacing["2xl"] },
                ]}
            >
                {/* Request Type */}
                <ThemedText
                    type="body"
                    style={[styles.label, isRTL && styles.rtlText]}
                >
                    {t("requestType")}
                </ThemedText>
                <Pressable
                    style={[
                        styles.selectField,
                        { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
                    ]}
                    onPress={() => {
                        setShowTypeDropdown(!showTypeDropdown);
                        setShowCityDropdown(false);
                        setShowCountryCodeDropdown(false);
                    }}
                >
                    <ThemedText
                        style={[
                            !requestType && { color: theme.textSecondary },
                            isRTL && styles.rtlText,
                        ]}
                    >
                        {requestType
                            ? t(SERVICE_TYPES.find((s) => s.id === requestType)?.labelKey || "")
                            : t("selectRequestType")}
                    </ThemedText>
                    <Feather
                        name="chevron-down"
                        size={20}
                        color={theme.textSecondary}
                    />
                </Pressable>
                {renderDropdown(
                    showTypeDropdown,
                    SERVICE_TYPES,
                    setRequestType,
                    () => setShowTypeDropdown(false)
                )}

                {/* Name */}
                <ThemedText
                    type="body"
                    style={[styles.label, isRTL && styles.rtlText]}
                >
                    {t("storeOrTechnicianName")}
                </ThemedText>
                <View style={[styles.inputRow, isRTL && styles.rtlRow]}>
                    <TextInput
                        style={[
                            styles.inputField,
                            {
                                backgroundColor: theme.backgroundDefault,
                                borderColor: theme.border,
                                color: theme.text,
                                flex: 1,
                            },
                            isRTL && styles.rtlText,
                        ]}
                        placeholder={t("enterStoreOrTechnicianName")}
                        placeholderTextColor={theme.textSecondary}
                        value={name}
                        onChangeText={setName}
                        textAlign={isRTL ? "right" : "left"}
                    />
                </View>

                {/* Phone with Country Code */}
                <ThemedText
                    type="body"
                    style={[styles.label, isRTL && styles.rtlText]}
                >
                    {t("phoneNumber")}
                </ThemedText>
                <View style={[styles.phoneRow, isRTL && styles.rtlRow]}>
                    <Pressable
                        style={[
                            styles.countryCodeField,
                            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
                        ]}
                        onPress={() => {
                            setShowCountryCodeDropdown(!showCountryCodeDropdown);
                            setShowTypeDropdown(false);
                            setShowCityDropdown(false);
                        }}
                    >
                        <ThemedText>{countryCode}</ThemedText>
                        <Feather name="chevron-down" size={16} color={theme.textSecondary} />
                    </Pressable>
                    <TextInput
                        style={[
                            styles.phoneField,
                            {
                                backgroundColor: theme.backgroundDefault,
                                borderColor: theme.border,
                                color: theme.text,
                            },
                            isRTL && styles.rtlText,
                        ]}
                        placeholder={t("examplePhone")}
                        placeholderTextColor={theme.textSecondary}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        textAlign={isRTL ? "right" : "left"}
                    />
                </View>
                {renderDropdown(
                    showCountryCodeDropdown,
                    COUNTRY_CODES,
                    setCountryCode,
                    () => setShowCountryCodeDropdown(false)
                )}

                {/* City */}
                <ThemedText
                    type="body"
                    style={[styles.label, isRTL && styles.rtlText]}
                >
                    {t("regionCity")}
                </ThemedText>
                <Pressable
                    style={[
                        styles.selectField,
                        { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
                    ]}
                    onPress={() => {
                        setShowCityDropdown(!showCityDropdown);
                        setShowTypeDropdown(false);
                        setShowCountryCodeDropdown(false);
                    }}
                >
                    <View style={[styles.selectContent, isRTL && styles.rtlRow]}>
                        <Feather name="map-pin" size={18} color={theme.primary} />
                        <ThemedText
                            style={[
                                { marginLeft: isRTL ? 0 : Spacing.sm, marginRight: isRTL ? Spacing.sm : 0 },
                                !city && { color: theme.textSecondary },
                                isRTL && styles.rtlText,
                            ]}
                        >
                            {city ? t(CITIES.find((c) => c.id === city)?.labelKey || "") : t("city")}
                        </ThemedText>
                    </View>
                    <Feather name="chevron-down" size={20} color={theme.textSecondary} />
                </Pressable>
                {renderDropdown(
                    showCityDropdown,
                    CITIES as any,
                    setCity,
                    () => setShowCityDropdown(false)
                )}

                {/* Address (Optional) */}
                <ThemedText
                    type="body"
                    style={[styles.label, isRTL && styles.rtlText]}
                >
                    {t("customAddress")}
                </ThemedText>
                <TextInput
                    style={[
                        styles.inputField,
                        {
                            backgroundColor: theme.backgroundDefault,
                            borderColor: theme.border,
                            color: theme.text,
                        },
                        isRTL && styles.rtlText,
                    ]}
                    placeholder={t("enterCustomAddress")}
                    placeholderTextColor={theme.textSecondary}
                    value={address}
                    onChangeText={setAddress}
                    textAlign={isRTL ? "right" : "left"}
                />

                {/* Description (Optional) */}
                <ThemedText
                    type="body"
                    style={[styles.label, isRTL && styles.rtlText]}
                >
                    {t("description")}
                </ThemedText>
                <TextInput
                    style={[
                        styles.inputField,
                        styles.notesField,
                        {
                            backgroundColor: theme.backgroundDefault,
                            borderColor: theme.border,
                            color: theme.text,
                        },
                        isRTL && styles.rtlText,
                    ]}
                    placeholder={t("enterDescription")}
                    placeholderTextColor={theme.textSecondary}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={3}
                    textAlign={isRTL ? "right" : "left"}
                    textAlignVertical="top"
                />

                {/* Buttons */}
                <View style={[styles.buttonRow, isRTL && styles.rtlRow]}>
                    <Pressable
                        style={[
                            styles.cancelButton,
                            { borderColor: theme.border },
                        ]}
                        onPress={() => navigation.goBack()}
                    >
                        <ThemedText>{t("cancel")}</ThemedText>
                    </Pressable>
                    <Button
                        onPress={handleSubmit}
                        disabled={isLoading}
                        style={styles.submitButton}
                    >
                        {isLoading ? t("submitting") : t("sendRequest")}
                    </Button>
                </View>
            </KeyboardAwareScrollViewCompat>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: Spacing.lg,
    },
    label: {
        marginBottom: Spacing.sm,
        fontWeight: "600",
    },
    selectField: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        marginBottom: Spacing.lg,
    },
    selectContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    inputField: {
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        marginBottom: Spacing.lg,
        fontSize: 16,
    },
    inputRow: {
        flexDirection: "row",
        marginBottom: Spacing.lg,
    },
    phoneRow: {
        flexDirection: "row",
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    rtlRow: {
        flexDirection: "row-reverse",
    },
    countryCodeField: {
        flexDirection: "row",
        alignItems: "center",
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        gap: Spacing.xs,
    },
    phoneField: {
        flex: 1,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        fontSize: 16,
    },
    notesField: {
        minHeight: 80,
    },
    dropdown: {
        position: "relative",
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        marginTop: -Spacing.md,
        marginBottom: Spacing.lg,
        maxHeight: 300,
        zIndex: 100,
    },
    dropdownScroll: {
        maxHeight: 300,
    },
    dropdownItem: {
        padding: Spacing.md,
        borderBottomWidth: 1,
    },
    imageUpload: {
        height: 150,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderStyle: "dashed",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: Spacing.xl,
        overflow: "hidden",
    },
    uploadPlaceholder: {
        alignItems: "center",
    },
    uploadedImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    buttonRow: {
        flexDirection: "row",
        gap: Spacing.md,
        marginTop: Spacing.md,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    submitButton: {
        flex: 1,
    },
    rtlText: {
        textAlign: "right",
        writingDirection: "rtl",
    },
});
