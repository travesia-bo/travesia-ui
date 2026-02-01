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
    providerCost: number;
    
    status: boolean;
    
    // Location Info (Flattened)
    locationName: string;
    locationAddress: string;
    locationMapUrl?: string;

    // ✅ IDs PARA EDICIÓN (Asegúrate que el Backend los envíe)
    locationId: number; 
    providerId: number;
}

// Para el Patch de estado
export interface ProductStatusUpdate {
    status: boolean;
}


export interface Location {
    id: number;
    name: string;
    address: string;
    mapUrl?: string;
}

// DTO para Crear Ubicación (Nested)
export interface CreateLocationRequest {
    name: string;
    address?: string;
    mapUrl?: string;
}

export interface CreateProductImageRequest {
    imageUrl: string; // En este caso simulado será el nombre del archivo
    isCover: boolean;
    sortOrder: number;
    file?: File; // Propiedad auxiliar para el frontend (no va al backend directamente en JSON, pero sirve para lógica local)
}

// DTO Principal para Crear Producto
export interface CreateProductRequest {
    name: string;
    description?: string;
    categoryType: number; // El código numérico (ej: 601)
    
    physicalStock: number;
    peopleCapacity: number;

    providerCost: number; // BigDecimal
    referencePrice: number; 
    
    locationId?: number | null; // Opcional si enviamos newLocation
    newLocation?: CreateLocationRequest | null; // Opcional si enviamos locationId
    
    providerId: number;
    images: CreateProductImageRequest[];
}
