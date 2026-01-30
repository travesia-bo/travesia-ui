export interface Product {
    id: number;
    name: string;
    description: string;
    
    // Category Info
    categoryCode: number;
    categoryName: string;
    
    // Stock Info
    physicalStock: number;
    availableStock: number;
    
    peopleCapacity: number;
    providerCost: number; // Usamos number para BigDecimal en JS/TS
    
    status: boolean;
    
    // Location Info
    locationName: string;
    locationAddress: string;
    locationMapUrl?: string; // Puede venir vacía
}

// Para el Patch de estado
export interface ProductStatusUpdate {
    status: boolean;
}