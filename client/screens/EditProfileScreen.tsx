import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const navigation = useNavigation();
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [city, setCity] = useState(user?.currentCity || "Khartoum"); // Default fallback
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [isLoading, setIsLoading] = useState(false);

  const cities = [
    { id: "Omdurman", labelKey: "omdurman" },
    { id: "Bahri", labelKey: "bahri" },
    { id: "Khartoum", labelKey: "khartoum" },
    { id: "Port Sudan", labelKey: "portSudan" },
    { id: "Kassala", labelKey: "kassala" },
    { id: "Gezira", labelKey: "gezira" },
    { id: "Kordofan", labelKey: "kordofan" },
    { id: "Darfur", labelKey: "darfur" },
    { id: "River Nile", labelKey: "riverNile" },
    { id: "White Nile", labelKey: "whiteNile" },
    { id: "Blue Nile", labelKey: "blueNile" },
    { id: "Northern", labelKey: "northern" },
    { id: "Red Sea", labelKey: "redSea" },
    { id: "Gedaref", labelKey: "gedaref" },
    { id: "Sennar", labelKey: "sennar" },
  ];

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(t("error"), t("failedToOpenGallery"));
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t("error"), t("nameRequired"));
      return;
    }

    setIsLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      let avatarBase64 = avatar;

      // If user picked a new image (starts with file://), convert to base64
      if (avatar && avatar.startsWith("file://")) {
        const base64 = await FileSystem.readAsStringAsync(avatar, {
          encoding: "base64",
        });
        avatarBase64 = `data:image/jpeg;base64,${base64}`;
      }

      await updateProfile({
        name,
        phone, // Pass phone to update
        // @ts-ignore: city property might not be in User type definition yet, but backend accepts it
        city: city,
        avatar: avatarBase64 || undefined,
      });

      navigation.goBack();
    } catch (error) {
      Alert.alert(t("error"), t("failedToUpdateProfile"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 20 },
        ]}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Feather
              name={isRTL ? "arrow-right" : "arrow-left"}
              size={24}
              color={theme.text}
            />
          </Pressable>
          <ThemedText type="h3">{t("editProfile")}</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.avatarSection}>
          <Pressable
            onPress={pickImage}
            style={[styles.avatarContainer, { borderColor: theme.border }]}
          >
            {avatar ? (
              <Image
                source={{ uri: avatar }}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: theme.primary },
                ]}
              >
                <ThemedText type="h1" style={{ color: "#FFFFFF" }}>
                  {name.charAt(0).toUpperCase()}
                </ThemedText>
              </View>
            )}
            <View
              style={[
                styles.cameraIcon,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <Feather name="camera" size={16} color={theme.text} />
            </View>
          </Pressable>
          <ThemedText style={{ marginTop: 8, color: theme.primary }}>
            {t("changePhoto")}
          </ThemedText>
        </View>

        <View style={styles.form}>
          <ThemedText
            type="small"
            style={[
              styles.label,
              { color: theme.textSecondary },
              isRTL && { textAlign: "right" },
            ]}
          >
            {t("fullName")}
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
                borderColor: theme.border,
              },
              isRTL && styles.rtlInput,
            ]}
            value={name}
            onChangeText={setName}
            placeholder={t("fullNamePlaceholder")}
            placeholderTextColor={theme.textSecondary}
            textAlign={isRTL ? "right" : "left"}
          />

          <ThemedText
            type="small"
            style={[
              styles.label,
              { color: theme.textSecondary },
              isRTL && { textAlign: "right" },
            ]}
          >
            {t("phoneNumber")}
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
                borderColor: theme.border,
              },
              isRTL && styles.rtlInput,
            ]}
            value={phone}
            onChangeText={setPhone}
            placeholder={t("phoneNumber")}
            placeholderTextColor={theme.textSecondary}
            keyboardType="phone-pad"
            textAlign={isRTL ? "right" : "left"}
          />

          <ThemedText
            type="small"
            style={[
              styles.label,
              { color: theme.textSecondary },
              isRTL && { textAlign: "right" },
            ]}
          >
            {t("city")}
          </ThemedText>
          <View style={styles.cityChips}>
            {cities.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setCity(c.id)}
                style={[
                  styles.cityChip,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    borderColor: theme.border,
                  },
                  city === c.id && {
                    backgroundColor: theme.primary,
                    borderColor: theme.primary,
                  },
                ]}
              >
                <ThemedText
                  type="small"
                  style={[
                    city === c.id
                      ? { color: "#FFFFFF" }
                      : { color: theme.text },
                  ]}
                >
                  {t(c.labelKey)}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <Button
          onPress={handleSave}
          disabled={isLoading}
          style={styles.saveButton}
        >
          {isLoading ? t("saving") : t("saveChanges")}
        </Button>
      </ScrollView>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
    marginTop: Spacing.xl,
  },
  backButton: {
    padding: 8,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    position: "relative",
    borderWidth: 1,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  form: {
    marginBottom: Spacing.xl,
  },
  label: {
    marginBottom: 8,
    textAlign: "left",
  },
  input: {
    height: 50,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  rtlInput: {
    textAlign: "right",
  },
  cityChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  cityChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  saveButton: {
    marginTop: Spacing.lg,
  },
});
