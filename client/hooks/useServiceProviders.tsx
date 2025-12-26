import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react";
import { ServiceProvider } from "@/components/ServiceProviderCard";
import { getApiUrl } from "@/lib/query-client";

interface ServiceProvidersContextType {
  providers: ServiceProvider[];
  isLoading: boolean;
  getProvidersByType: (type: string) => ServiceProvider[];
  refreshProviders: () => Promise<void>;
}

const ServiceProvidersContext = createContext<ServiceProvidersContextType | undefined>(undefined);

const SAMPLE_PROVIDERS: ServiceProvider[] = [
  {
    id: "sample-1",
    name: "ورشة الرشيد للسيارات",
    role: "mechanic",
    city: "الخرطوم",
    rating: 4.8,
    reviewCount: 156,
    description: "خبرة أكثر من 20 سنة في صيانة السيارات",
  },
  {
    id: "sample-2",
    name: "إلكترو تك للسيارات",
    role: "electrician",
    city: "أم درمان",
    rating: 4.6,
    reviewCount: 89,
    description: "متخصصون في كهرباء السيارات الحديثة",
  },
  {
    id: "sample-3",
    name: "المستشار القانوني للسيارات",
    role: "lawyer",
    city: "الخرطوم",
    rating: 4.9,
    reviewCount: 234,
    description: "خدمات توثيق المركبات والاستشارات القانونية",
  },
  {
    id: "sample-4",
    name: "مركز الفحص السوداني",
    role: "inspection_center",
    city: "الخرطوم",
    rating: 4.7,
    reviewCount: 312,
    description: "خدمات فحص المركبات الرسمية",
  },
  {
    id: "sample-5",
    name: "ورشة الإصلاح السريع",
    role: "mechanic",
    city: "بحري",
    rating: 4.5,
    reviewCount: 78,
    description: "إصلاحات سريعة وموثوقة",
  },
  {
    id: "sample-6",
    name: "مركز فحص الخليج",
    role: "inspection_center",
    city: "بورتسودان",
    rating: 4.8,
    reviewCount: 189,
    description: "فحوصات شاملة للمركبات",
  },
  {
    id: "sample-7",
    name: "باور سيركيت أوتو",
    role: "electrician",
    city: "الخرطوم",
    rating: 4.4,
    reviewCount: 67,
    description: "بطاريات ومولدات وأنظمة كهربائية",
  },
  {
    id: "sample-8",
    name: "مكتب المحاماة للسيارات",
    role: "lawyer",
    city: "أم درمان",
    rating: 4.7,
    reviewCount: 145,
    description: "قضايا التأمين والحوادث",
  },
];

export function ServiceProvidersProvider({ children }: { children: ReactNode }) {
  const [providers, setProviders] = useState<ServiceProvider[]>(SAMPLE_PROVIDERS);
  const [isLoading, setIsLoading] = useState(true);

  const loadProviders = useCallback(async () => {
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/service-providers`);
      if (response.ok) {
        const apiProviders = await response.json();
        if (apiProviders.length > 0) {
          const formattedProviders = apiProviders.map((p: any) => ({
            id: p.id,
            name: p.name,
            role: p.type,
            city: p.city,
            rating: p.rating || 0,
            reviewCount: p.reviewCount || 0,
            description: p.description || "",
            phone: p.phone,
            address: p.address,
            isVerified: p.isVerified,
          }));
          setProviders(formattedProviders);
        }
      }
    } catch (error) {
      console.log("Using sample providers data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const refreshProviders = async () => {
    setIsLoading(true);
    await loadProviders();
  };

  const getProvidersByType = (type: string) => {
    if (type === "all") return providers;
    return providers.filter(p => p.role === type);
  };

  return (
    <ServiceProvidersContext.Provider value={{ 
      providers, 
      isLoading, 
      getProvidersByType,
      refreshProviders 
    }}>
      {children}
    </ServiceProvidersContext.Provider>
  );
}

export function useServiceProviders() {
  const context = useContext(ServiceProvidersContext);
  if (context === undefined) {
    throw new Error("useServiceProviders must be used within a ServiceProvidersProvider");
  }
  return context;
}
