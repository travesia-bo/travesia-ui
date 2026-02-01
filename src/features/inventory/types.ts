export interface Product {
    id: number;
    name: string;
    description: string;
    
    categoryCode: number;
    categoryName: string;

    physicalStock: number;
    availableStock: number;
    peopleCapacity: number;
    
    providerCost: number;
    referencePrice: number;

    status: boolean; // Estado del producto

    // Info Ubicación
    locationName: string;
    locationAddress: string;
    locationMapUrl: string;
    locationId?: number;

    providerId: number;

    providerStatusCode: number;
    providerStatusName: string; 

    images: any[]; 
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
