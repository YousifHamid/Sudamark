import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
} from "react";
import { ServiceProvider } from "@/components/ServiceProviderCard";
import { getApiUrl } from "@/lib/query-client";

interface ServiceProvidersContextType {
  providers: ServiceProvider[];
  isLoading: boolean;
  getProvidersByType: (type: string) => ServiceProvider[];
  refreshProviders: () => Promise<void>;
}

const ServiceProvidersContext = createContext<
  ServiceProvidersContextType | undefined
>(undefined);



export function ServiceProvidersProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [providers, setProviders] =
    useState<ServiceProvider[]>([]);
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
      console.log("Failed to load providers");
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
    return providers.filter((p) => p.role === type);
  };

  return (
    <ServiceProvidersContext.Provider
      value={{
        providers,
        isLoading,
        getProvidersByType,
        refreshProviders,
      }}
    >
      {children}
    </ServiceProvidersContext.Provider>
  );
}

export function useServiceProviders() {
  const context = useContext(ServiceProvidersContext);
  if (context === undefined) {
    throw new Error(
      "useServiceProviders must be used within a ServiceProvidersProvider",
    );
  }
  return context;
}
