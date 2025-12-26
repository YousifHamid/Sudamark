import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Car } from "@/components/CarCard";
import { getApiUrl, apiRequest } from "@/lib/query-client";
import { useAuth } from "@/contexts/AuthContext";

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

const FAVORITES_STORAGE_KEY = "@arabaty_favorites";

const SAMPLE_CARS: Car[] = [
  {
    id: "sample-1",
    title: "تويوتا كامري 2022",
    make: "Toyota",
    model: "Camry",
    year: 2022,
    price: 950000,
    mileage: 25000,
    city: "الخرطوم",
    images: ["https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800"],
    category: "used",
    description: "حالة ممتازة، مالك واحد، سجل صيانة كامل",
    sellerId: "sample-user1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "sample-2",
    title: "BMW X5 2021",
    make: "BMW",
    model: "X5",
    year: 2021,
    price: 2800000,
    mileage: 35000,
    city: "أم درمان",
    images: ["https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800"],
    category: "used",
    description: "فل كامل، سقف بانوراما",
    sellerId: "sample-user2",
    createdAt: new Date().toISOString(),
  },
  {
    id: "sample-3",
    title: "مرسيدس C300 2023",
    make: "Mercedes-Benz",
    model: "C300",
    year: 2023,
    price: 2450000,
    mileage: 10000,
    city: "الخرطوم",
    images: ["https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800"],
    category: "new",
    description: "شبه جديدة، باكج AMG، ضمان",
    sellerId: "sample-user3",
    createdAt: new Date().toISOString(),
  },
  {
    id: "sample-4",
    title: "هيونداي سوناتا 2022",
    make: "Hyundai",
    model: "Sonata",
    year: 2022,
    price: 720000,
    mileage: 40000,
    city: "بحري",
    images: ["https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800"],
    category: "used",
    description: "سيارة عائلية ممتازة، موفرة للوقود",
    sellerId: "sample-user4",
    createdAt: new Date().toISOString(),
  },
  {
    id: "sample-5",
    title: "نيسان باترول 2020",
    make: "Nissan",
    model: "Patrol",
    year: 2020,
    price: 1850000,
    mileage: 65000,
    city: "بورتسودان",
    images: ["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800"],
    category: "used",
    description: "محرك V8، دفع رباعي",
    sellerId: "sample-user5",
    createdAt: new Date().toISOString(),
  },
];

export function CarsProvider({ children }: { children: ReactNode }) {
  const [cars, setCars] = useState<Car[]>(SAMPLE_CARS);
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
      console.log("Using sample cars data");
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
      await Promise.all([loadCars(), loadSliderImages(), loadFavorites()]);
      setIsLoading(false);
    };
    loadData();
  }, [loadCars, loadSliderImages, loadFavorites]);

  const refreshCars = async () => {
    await loadCars();
  };

  const addCar = async (carData: Omit<Car, "id" | "createdAt">): Promise<Car | null> => {
    try {
      const response = await apiRequest("POST", "/api/cars", {
        make: carData.make,
        model: carData.model,
        year: carData.year,
        price: carData.price,
        mileage: carData.mileage,
        city: carData.city,
        description: carData.description,
        images: carData.images,
        category: carData.category,
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
      };
      
      setCars(prev => [formattedCar, ...prev]);
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
      if (filters.minPrice) params.append("minPrice", filters.minPrice.toString());
      if (filters.maxPrice) params.append("maxPrice", filters.maxPrice.toString());
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
      return cars.filter(car => {
        if (filters.category && car.category !== filters.category) return false;
        if (filters.city && car.city !== filters.city) return false;
        if (filters.minPrice && car.price < filters.minPrice) return false;
        if (filters.maxPrice && car.price > filters.maxPrice) return false;
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          if (!car.title.toLowerCase().includes(searchLower) &&
              !car.make.toLowerCase().includes(searchLower) &&
              !car.model.toLowerCase().includes(searchLower)) {
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
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));
      
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

  const featuredCars = cars.filter(car => car.category === "new").slice(0, 4);

  return (
    <CarsContext.Provider
      value={{
        cars,
        featuredCars: featuredCars.length > 0 ? featuredCars : cars.slice(0, 4),
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
