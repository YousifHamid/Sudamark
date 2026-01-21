import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Car } from "@/components/CarCard";
import { getApiUrl, apiRequest, throwIfResNotOk } from "@/lib/query-client";
import { useAuth } from "@/contexts/AuthContext";
import * as FileSystem from "expo-file-system";

const TOKEN_STORAGE_KEY = "@sudamark_token";

interface SliderImage {
  id: string;
  imageUrl: string;
  title?: string;
}

interface CarsContextType {
  cars: Car[];
  featuredCars: Car[];
  sliderImages: SliderImage[];
  favorites: string[];
  isLoading: boolean;
  addCar: (car: Omit<Car, "id" | "createdAt">) => Promise<Car | null>;
  updateCar: (id: string, car: Partial<Car>) => Promise<Car | null>;
  deleteCar: (id: string) => Promise<boolean>;
  toggleFavorite: (carId: string) => void;
  isFavorite: (carId: string) => boolean;
  refreshCars: () => Promise<void>;
  searchCars: (filters: CarFilters) => Promise<Car[]>;
}

export interface CarFilters {
  category?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

const CarsContext = createContext<CarsContextType | undefined>(undefined);

const FAVORITES_STORAGE_KEY = "@sudamark_favorites";

export function CarsProvider({ children }: { children: ReactNode }) {
  const [cars, setCars] = useState<Car[]>([]);
  const [featuredCars, setFeaturedCars] = useState<Car[]>([]);
  const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();

  const loadCars = useCallback(async () => {
    try {
      const baseUrl = getApiUrl();
      const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(`${baseUrl}api/cars`, { headers });
      await throwIfResNotOk(response);
      if (response.ok) {
        const apiCars = await response.json();
        // Transformation logic ...
        // Simpler: reuse the shared transformer if possible, but for now duplicate logic is fine or we keep it as is
        // Wait, I need to keep the transformation logic.
        // Let's copy it from lines 60-74
        if (apiCars.length > 0) {
          const formattedCars = apiCars.map((car: any) => ({
            id: car.id,
            title: `${car.make} ${car.model} ${car.year}`,
            make: car.make,
            model: car.model,
            year: car.year,
            price: car.price,
            mileage: car.mileage || 0,
            city: car.city,
            images: car.images || [],
            category: car.category || "used",
            description: car.description || "",
            sellerId: car.userId,
            owner: car.user ? {
              id: car.user.id,
              name: car.user.name,
              phone: car.user.phone,
              avatar: car.user.avatar,
            } : undefined,
            contactPhone: car.contactPhone,
            seats: car.seats,
            doors: car.doors,
            exteriorColor: car.exteriorColor,
            interiorColor: car.interiorColor,
            fuelType: car.fuelType,
            gearType: car.gearType,
            transmission: car.transmission,
            cylinders: car.cylinders,
            wheels: car.wheels,
            seatType: car.seatType,
            engineSize: car.engineSize,
            color: car.color,
            insuranceType: car.insuranceType,
            advertiserType: car.advertiserType,
            isFeatured: car.isFeatured,
            createdAt: car.createdAt,
          }));
          setCars(formattedCars);
        }
      }
    } catch (error) {
      console.log("Failed to load cars from API");
    }
  }, []);

  const loadFeaturedCars = useCallback(async () => {
    try {
      const baseUrl = getApiUrl();
      const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(`${baseUrl}api/cars/featured`, { headers });
      await throwIfResNotOk(response);
      if (response.ok) {
        const apiFeaturedCars = await response.json();
        const formattedFeatured = apiFeaturedCars.map((car: any) => ({
          id: car.id,
          title: `${car.make} ${car.model} ${car.year}`,
          make: car.make,
          model: car.model,
          year: car.year,
          price: car.price,
          mileage: car.mileage || 0,
          city: car.city,
          images: car.images || [],
          category: car.category || "used",
          description: car.description || "",
          sellerId: car.userId,
          owner: car.user ? {
            id: car.user.id,
            name: car.user.name,
            phone: car.user.phone,
            avatar: car.user.avatar,
          } : undefined,
          contactPhone: car.contactPhone,
          seats: car.seats,
          doors: car.doors,
          exteriorColor: car.exteriorColor,
          interiorColor: car.interiorColor,
          fuelType: car.fuelType,
          gearType: car.gearType,
          transmission: car.transmission,
          cylinders: car.cylinders,
          wheels: car.wheels,
          seatType: car.seatType,
          engineSize: car.engineSize,
          color: car.color,
          insuranceType: car.insuranceType,
          advertiserType: car.advertiserType,
          isFeatured: car.isFeatured,
          createdAt: car.createdAt,
        }));
        setFeaturedCars(formattedFeatured);
      }
    } catch (error) {
      console.log("Failed to load featured cars");
    }
  }, []);

  const loadSliderImages = useCallback(async () => {
    try {
      const baseUrl = getApiUrl();
      const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(`${baseUrl}api/slider-images`, { headers });
      await throwIfResNotOk(response);
      if (response.ok) {
        const images = await response.json();
        if (images.length > 0) {
          setSliderImages(images);
        }
      }
    } catch (error) {
      console.log("No slider images available");
    }
  }, []);

  const loadFavorites = useCallback(async () => {
    try {
      const savedFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([loadCars(), loadFeaturedCars(), loadSliderImages(), loadFavorites()]);
      setIsLoading(false);
    };
    loadData();
  }, [loadCars, loadFeaturedCars, loadSliderImages, loadFavorites]);

  const refreshCars = async () => {
    await Promise.all([loadCars(), loadFeaturedCars()]);
  };

  const addCar = async (
    carData: Omit<Car, "id" | "createdAt">,
  ): Promise<Car | null> => {
    try {
      const processedImages = await Promise.all(
        (carData.images || []).map(async (img) => {
          if (img.startsWith("file://")) {
            try {
              // Create FormData for upload
              const formData = new FormData();
              // @ts-ignore
              formData.append("image", {
                uri: img,
                name: "image.jpg",
                type: "image/jpeg",
              });

              // Use standard fetch for multipart upload since apiRequest helper handles JSON
              const baseUrl = getApiUrl();
              const uploadResponse = await fetch(`${baseUrl}api/upload`, {
                method: "POST",
                body: formData,
                headers: {
                  "Content-Type": "multipart/form-data",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
              });

              if (uploadResponse.ok) {
                const { imageUrl } = await uploadResponse.json();
                return imageUrl;
              } else {
                console.error("Upload failed for image", img);
                return img; // Fallback? Or better null/filter
              }

            } catch (e) {
              console.error("Error uploading image:", e);
              return img;
            }
          }
          return img;
        }),
      );

      const response = await apiRequest("POST", "/api/cars", {
        make: carData.make,
        model: carData.model,
        year: carData.year,
        price: carData.price,
        mileage: carData.mileage,
        city: carData.city,
        description: carData.description,
        images: processedImages.filter(img => !img.startsWith("file://")), // Filter out failed uploads to avoid saving local paths
        category: carData.category,
        insuranceType: carData.insuranceType,
        advertiserType: carData.advertiserType,
        engineSize: carData.engineSize,
        color: carData.color,
        seats: carData.seats,
        doors: carData.doors,
        exteriorColor: carData.exteriorColor,
        interiorColor: carData.interiorColor,
        fuelType: carData.fuelType,
        gearType: carData.gearType,
        cylinders: carData.cylinders,
        wheels: carData.wheels,
        seatType: carData.seatType,
      });

      const newCar = await response.json();
      const formattedCar: Car = {
        id: newCar.id,
        title: `${newCar.make} ${newCar.model} ${newCar.year}`,
        make: newCar.make,
        model: newCar.model,
        year: newCar.year,
        price: newCar.price,
        mileage: newCar.mileage || 0,
        city: newCar.city,
        images: newCar.images || [],
        category: newCar.category || "used",
        description: newCar.description || "",
        sellerId: newCar.userId,
        owner: newCar.user ? {
          id: newCar.user.id,
          name: newCar.user.name,
          phone: newCar.user.phone,
          avatar: newCar.user.avatar,
        } : undefined,
        contactPhone: newCar.contactPhone,
        createdAt: newCar.createdAt,
        insuranceType: newCar.insuranceType,
        advertiserType: newCar.advertiserType,
        isFeatured: newCar.isFeatured,
        engineSize: newCar.engineSize,
        color: newCar.color,
        seats: newCar.seats,
        doors: newCar.doors,
        exteriorColor: newCar.exteriorColor,
        interiorColor: newCar.interiorColor,
        fuelType: newCar.fuelType,
        gearType: newCar.gearType,
        transmission: newCar.transmission,
        cylinders: newCar.cylinders,
        wheels: newCar.wheels,
        seatType: newCar.seatType,
      };

      setCars((prev) => [formattedCar, ...prev]);
      return formattedCar;
    } catch (error) {
      console.error("Error adding car:", error);
      return null;
    }
  };

  const updateCar = async (
    id: string,
    carData: Partial<Car>,
  ): Promise<Car | null> => {
    try {
      const processedImages = await Promise.all(
        (carData.images || []).map(async (img) => {
          if (img.startsWith("file://")) {
            try {
              const formData = new FormData();
              // @ts-ignore
              formData.append("image", {
                uri: img,
                name: "image.jpg",
                type: "image/jpeg",
              });

              const baseUrl = getApiUrl();
              const uploadResponse = await fetch(`${baseUrl}api/upload`, {
                method: "POST",
                body: formData,
                headers: {
                  "Content-Type": "multipart/form-data",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
              });

              if (uploadResponse.ok) {
                const { imageUrl } = await uploadResponse.json();
                return imageUrl;
              }
              return img;
            } catch (e) {
              console.error("Error uploading image:", e);
              return img;
            }
          }
          return img;
        }),
      );

      const response = await apiRequest("PUT", `/api/cars/${id}`, {
        ...carData,
        images: processedImages.filter(img => !img.startsWith("file://")),
      });

      const updatedCar = await response.json();

      // Update local state
      setCars((prev) => prev.map(c => c.id === id ? { ...c, ...updatedCar } : c));

      return updatedCar;
    } catch (error) {
      console.error("Error updating car:", error);
      return null;
    }
  };

  const deleteCar = async (id: string): Promise<boolean> => {
    try {
      if (token) {
        await apiRequest("DELETE", `/api/cars/${id}`);
      }

      setCars((prev) => prev.filter((c) => c.id !== id));
      setFeaturedCars((prev) => prev.filter((c) => c.id !== id));
      return true;
    } catch (error) {
      console.error("Error deleting car:", error);
      return false;
    }
  };

  const searchCars = async (filters: CarFilters): Promise<Car[]> => {
    try {
      const baseUrl = getApiUrl();
      const params = new URLSearchParams();

      if (filters.category) params.append("category", filters.category);
      if (filters.city) params.append("city", filters.city);
      if (filters.minPrice)
        params.append("minPrice", filters.minPrice.toString());
      if (filters.maxPrice)
        params.append("maxPrice", filters.maxPrice.toString());
      if (filters.search) params.append("search", filters.search);

      const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(`${baseUrl}api/cars?${params.toString()}`, { headers });
      if (response.ok) {
        const apiCars = await response.json();
        return apiCars.map((car: any) => ({
          id: car.id,
          title: `${car.make} ${car.model} ${car.year}`,
          make: car.make,
          model: car.model,
          year: car.year,
          price: car.price,
          mileage: car.mileage || 0,
          city: car.city,
          images: car.images || [],
          category: car.category || "used",
          description: car.description || "",
          sellerId: car.userId,
          owner: car.user ? {
            id: car.user.id,
            name: car.user.name,
            phone: car.user.phone,
            avatar: car.user.avatar,
          } : undefined,
          contactPhone: car.contactPhone,
          seats: car.seats,
          doors: car.doors,
          exteriorColor: car.exteriorColor,
          interiorColor: car.interiorColor,
          fuelType: car.fuelType,
          gearType: car.gearType,
          transmission: car.transmission,
          cylinders: car.cylinders,
          wheels: car.wheels,
          seatType: car.seatType,
          engineSize: car.engineSize,
          color: car.color,
          insuranceType: car.insuranceType,
          advertiserType: car.advertiserType,
          isFeatured: car.isFeatured,
          createdAt: car.createdAt,
        }));
      }
      return cars;
    } catch (error) {
      console.error("Search error:", error);
      return cars.filter((car) => {
        if (filters.category && car.category !== filters.category) return false;
        if (filters.city && car.city !== filters.city) return false;
        if (filters.minPrice && car.price < filters.minPrice) return false;
        if (filters.maxPrice && car.price > filters.maxPrice) return false;
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          if (
            !car.title.toLowerCase().includes(searchLower) &&
            !car.make.toLowerCase().includes(searchLower) &&
            !car.model.toLowerCase().includes(searchLower)
          ) {
            return false;
          }
        }
        return true;
      });
    }
  };

  const toggleFavorite = async (carId: string) => {
    try {
      const newFavorites = favorites.includes(carId)
        ? favorites.filter((id) => id !== carId)
        : [...favorites, carId];
      setFavorites(newFavorites);
      await AsyncStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(newFavorites),
      );

      if (token) {
        try {
          if (favorites.includes(carId)) {
            await apiRequest("DELETE", `/api/favorites/${carId}`);
          } else {
            await apiRequest("POST", "/api/favorites", { carId });
          }
        } catch (err) {
          console.log("Favorites synced locally only");
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const isFavorite = (carId: string) => favorites.includes(carId);

  return (
    <CarsContext.Provider
      value={{
        cars,
        featuredCars,
        sliderImages,
        favorites,
        isLoading,
        addCar,
        updateCar,
        deleteCar,
        toggleFavorite,
        isFavorite,
        refreshCars,
        searchCars,
      }}
    >
      {children}
    </CarsContext.Provider>
  );
}

export function useCars() {
  const context = useContext(CarsContext);
  if (context === undefined) {
    throw new Error("useCars must be used within a CarsProvider");
  }
  return context;
}
