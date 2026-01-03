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
import { getApiUrl, apiRequest } from "@/lib/query-client";
import { useAuth } from "@/contexts/AuthContext";
import * as FileSystem from "expo-file-system";

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

const FAVORITES_STORAGE_KEY = "@sudmark_favorites";

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
      const response = await fetch(`${baseUrl}api/cars`);
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
      const response = await fetch(`${baseUrl}api/cars/featured`);
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
      const response = await fetch(`${baseUrl}api/slider-images`);
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
              const base64 = await FileSystem.readAsStringAsync(img, {
                encoding: "base64",
              });
              return `data:image/jpeg;base64,${base64}`;
            } catch (e) {
              console.error("Error converting image:", e);
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
        images: processedImages,
        category: carData.category,
        insuranceType: carData.insuranceType,
        advertiserType: carData.advertiserType,
        engineSize: carData.engineSize,
        color: carData.color,
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
        createdAt: newCar.createdAt,
        insuranceType: newCar.insuranceType,
        advertiserType: newCar.advertiserType,
        engineSize: newCar.engineSize,
        color: newCar.color,
      };

      setCars((prev) => [formattedCar, ...prev]);
      return formattedCar;
    } catch (error) {
      console.error("Error adding car:", error);
      return null;
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

      const response = await fetch(`${baseUrl}api/cars?${params.toString()}`);
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
