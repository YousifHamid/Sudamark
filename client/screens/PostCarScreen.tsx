import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useCars } from "@/hooks/useCars";

export default function PostCarScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { addCar } = useCars();

  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [price, setPrice] = useState("");
  const [mileage, setMileage] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages([...images, ...result.assets.map((a) => a.uri)].slice(0, 6));
      Haptics.selectionAsync();
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    Haptics.selectionAsync();
  };

  const handleSubmit = async () => {
    if (!title || !make || !model || !year || !price || !city) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const newCar = {
      id: Date.now().toString(),
      title,
      make,
      model,
      year: parseInt(year),
      price: parseInt(price),
      mileage: mileage ? parseInt(mileage) : 0,
      description,
      city,
      images: images.length > 0 ? images : ["https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800"],
      sellerId: user?.id || "",
      category: "sedan",
      createdAt: new Date().toISOString(),
    };

    await addCar(newCar);
    setIsLoading(false);
    navigation.goBack();
  };

  const cities = ["Riyadh", "Jeddah", "Dammam", "Mecca", "Medina"];

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing["2xl"] },
        ]}
      >
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Photos (up to 6)
        </ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imagesContainer}
          contentContainerStyle={styles.imagesContent}
        >
          {images.map((uri, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.imagePreview} contentFit="cover" />
              <Pressable
                style={[styles.removeImageButton, { backgroundColor: theme.error }]}
                onPress={() => removeImage(index)}
              >
                <Feather name="x" size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}
          {images.length < 6 ? (
            <Pressable
              style={[styles.addImageButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
              onPress={pickImage}
            >
              <Feather name="plus" size={24} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: theme.textSecondary }}>Add</ThemedText>
            </Pressable>
          ) : null}
        </ScrollView>

        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Title *
        </ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
          placeholder="e.g. Toyota Camry 2022 - Excellent Condition"
          placeholderTextColor={theme.textSecondary}
          value={title}
          onChangeText={setTitle}
        />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              Make *
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
              placeholder="Toyota"
              placeholderTextColor={theme.textSecondary}
              value={make}
              onChangeText={setMake}
            />
          </View>
          <View style={styles.halfInput}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              Model *
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
              placeholder="Camry"
              placeholderTextColor={theme.textSecondary}
              value={model}
              onChangeText={setModel}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              Year *
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
              placeholder="2022"
              placeholderTextColor={theme.textSecondary}
              value={year}
              onChangeText={setYear}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.halfInput}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              Price (SAR) *
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
              placeholder="85000"
              placeholderTextColor={theme.textSecondary}
              value={price}
              onChangeText={setPrice}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Mileage (km)
        </ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
          placeholder="50000"
          placeholderTextColor={theme.textSecondary}
          value={mileage}
          onChangeText={setMileage}
          keyboardType="number-pad"
        />

        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          City *
        </ThemedText>
        <View style={styles.citiesRow}>
          {cities.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCity(c)}
              style={[
                styles.cityChip,
                { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
                city === c && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
            >
              <ThemedText type="small" style={city === c ? { color: "#FFFFFF" } : undefined}>
                {c}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Description
        </ThemedText>
        <TextInput
          style={[styles.textArea, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
          placeholder="Describe your car..."
          placeholderTextColor={theme.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Button onPress={handleSubmit} disabled={isLoading} style={styles.submitButton}>
          {isLoading ? "Posting..." : "Post Listing"}
        </Button>
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
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  imagesContainer: {
    marginVertical: Spacing.sm,
  },
  imagesContent: {
    gap: Spacing.sm,
  },
  imageWrapper: {
    position: "relative",
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.sm,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  citiesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  cityChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 100,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
  },
  submitButton: {
    marginTop: Spacing["2xl"],
  },
});
