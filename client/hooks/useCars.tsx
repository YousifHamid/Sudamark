import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Car } from "@/components/CarCard";

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
  addCar: (car: Car) => Promise<void>;
  toggleFavorite: (carId: string) => void;
  isFavorite: (carId: string) => boolean;
}

const CarsContext = createContext<CarsContextType | undefined>(undefined);

const CARS_STORAGE_KEY = "@car_marketplace_cars";
const FAVORITES_STORAGE_KEY = "@car_marketplace_favorites";

const SAMPLE_CARS: Car[] = [
  {
    id: "1",
    title: "Toyota Camry 2022 - Excellent Condition",
    make: "Toyota",
    model: "Camry",
    year: 2022,
    price: 95000,
    mileage: 25000,
    city: "Riyadh",
    images: ["https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800"],
    category: "sedan",
    description: "Well maintained, single owner, full service history.",
    sellerId: "user1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "BMW X5 2021 - Luxury SUV",
    make: "BMW",
    model: "X5",
    year: 2021,
    price: 280000,
    mileage: 35000,
    city: "Jeddah",
    images: ["https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800"],
    category: "suv",
    description: "Premium package, panoramic roof, full options.",
    sellerId: "user2",
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Mercedes-Benz C300 2023",
    make: "Mercedes-Benz",
    model: "C300",
    year: 2023,
    price: 245000,
    mileage: 10000,
    city: "Riyadh",
    images: ["https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800"],
    category: "luxury",
    description: "Almost new, AMG package, warranty included.",
    sellerId: "user3",
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    title: "Hyundai Sonata 2022",
    make: "Hyundai",
    model: "Sonata",
    year: 2022,
    price: 72000,
    mileage: 40000,
    city: "Dammam",
    images: ["https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800"],
    category: "sedan",
    description: "Great family car, fuel efficient, clean title.",
    sellerId: "user4",
    createdAt: new Date().toISOString(),
  },
  {
    id: "5",
    title: "Nissan Patrol 2020",
    make: "Nissan",
    model: "Patrol",
    year: 2020,
    price: 185000,
    mileage: 65000,
    city: "Mecca",
    images: ["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800"],
    category: "suv",
    description: "V8 engine, 4x4, perfect for desert adventures.",
    sellerId: "user5",
    createdAt: new Date().toISOString(),
  },
  {
    id: "6",
    title: "Tesla Model 3 2023",
    make: "Tesla",
    model: "Model 3",
    year: 2023,
    price: 175000,
    mileage: 5000,
    city: "Riyadh",
    images: ["https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800"],
    category: "electric",
    description: "Long range, autopilot, home charger included.",
    sellerId: "user6",
    createdAt: new Date().toISOString(),
  },
];

const SAMPLE_SLIDER_IMAGES: SliderImage[] = [
  {
    id: "1",
    imageUrl: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200",
    title: "Find Your Dream Car",
  },
  {
    id: "2",
    imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200",
    title: "Premium Selection",
  },
  {
    id: "3",
    imageUrl: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200",
    title: "Verified Sellers",
  },
];

export function CarsProvider({ children }: { children: ReactNode }) {
  const [cars, setCars] = useState<Car[]>(SAMPLE_CARS);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [savedCars, savedFavorites] = await Promise.all([
        AsyncStorage.getItem(CARS_STORAGE_KEY),
        AsyncStorage.getItem(FAVORITES_STORAGE_KEY),
      ]);

      if (savedCars) {
        const parsedCars = JSON.parse(savedCars);
        setCars([...SAMPLE_CARS, ...parsedCars]);
      }

      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    } catch (error) {
      console.error("Error loading cars:", error);
    }
  };

  const addCar = async (car: Car) => {
    try {
      const savedCars = await AsyncStorage.getItem(CARS_STORAGE_KEY);
      const existingCars = savedCars ? JSON.parse(savedCars) : [];
      const updatedCars = [...existingCars, car];
      await AsyncStorage.setItem(CARS_STORAGE_KEY, JSON.stringify(updatedCars));
      setCars([...SAMPLE_CARS, ...updatedCars]);
    } catch (error) {
      console.error("Error adding car:", error);
    }
  };

  const toggleFavorite = async (carId: string) => {
    try {
      const newFavorites = favorites.includes(carId)
        ? favorites.filter((id) => id !== carId)
        : [...favorites, carId];
      setFavorites(newFavorites);
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const isFavorite = (carId: string) => favorites.includes(carId);

  const featuredCars = cars.slice(0, 4);

  return (
    <CarsContext.Provider
      value={{
        cars,
        featuredCars,
        sliderImages: SAMPLE_SLIDER_IMAGES,
        favorites,
        addCar,
        toggleFavorite,
        isFavorite,
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
