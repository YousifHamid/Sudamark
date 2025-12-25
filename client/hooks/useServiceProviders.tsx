import React, { createContext, useContext, ReactNode } from "react";
import { ServiceProvider } from "@/components/ServiceProviderCard";

interface ServiceProvidersContextType {
  providers: ServiceProvider[];
}

const ServiceProvidersContext = createContext<ServiceProvidersContextType | undefined>(undefined);

const SAMPLE_PROVIDERS: ServiceProvider[] = [
  {
    id: "1",
    name: "Al-Rashid Auto Repair",
    role: "mechanic",
    city: "Riyadh",
    rating: 4.8,
    reviewCount: 156,
    description: "Expert mechanics with 20+ years experience",
  },
  {
    id: "2",
    name: "ElectroTech Auto",
    role: "electrician",
    city: "Jeddah",
    rating: 4.6,
    reviewCount: 89,
    description: "Specialized in modern car electronics",
  },
  {
    id: "3",
    name: "Legal Auto Advisors",
    role: "lawyer",
    city: "Riyadh",
    rating: 4.9,
    reviewCount: 234,
    description: "Vehicle documentation and legal services",
  },
  {
    id: "4",
    name: "Saudi Inspection Center",
    role: "inspection_center",
    city: "Riyadh",
    rating: 4.7,
    reviewCount: 312,
    description: "Official vehicle inspection services",
  },
  {
    id: "5",
    name: "Quick Fix Motors",
    role: "mechanic",
    city: "Dammam",
    rating: 4.5,
    reviewCount: 78,
    description: "Fast and reliable repairs",
  },
  {
    id: "6",
    name: "Gulf Inspection Hub",
    role: "inspection_center",
    city: "Jeddah",
    rating: 4.8,
    reviewCount: 189,
    description: "Comprehensive vehicle inspections",
  },
  {
    id: "7",
    name: "Power Circuit Auto",
    role: "electrician",
    city: "Riyadh",
    rating: 4.4,
    reviewCount: 67,
    description: "Battery, alternator and electrical systems",
  },
  {
    id: "8",
    name: "Auto Law Firm",
    role: "lawyer",
    city: "Jeddah",
    rating: 4.7,
    reviewCount: 145,
    description: "Insurance claims and accident cases",
  },
];

export function ServiceProvidersProvider({ children }: { children: ReactNode }) {
  return (
    <ServiceProvidersContext.Provider value={{ providers: SAMPLE_PROVIDERS }}>
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
