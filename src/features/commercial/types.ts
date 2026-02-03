export interface PackageDetail {
    productId: number;
    productName: string;
    productDescription: string;
    categoryName: string;
    categoryCode: number;
    nameLocation: string;
    addressLocation: string;
    mapUrlLocation: string;
    quantity: number;
}

export interface Package {
    id: number;
    name: string;
    description: string;
    imageUrl?: string;
    imageQrUrl?: string;
    peopleCount: number;
    
    totalPrice: number;     
    pricePerPerson: number;
    minPrice: number;       

    commissionType: number; 
    commissionValue: number;
    
    details: PackageDetail[];
}

// DTOs para las actualizaciones parciales
export interface PackageStatusUpdate {
    status: boolean;
}

export interface PackageVisibilityUpdate {
    isPublic: boolean;
}

export interface PackageDetailItemRequest {
    productId: number;
    quantity: number;
}

// DTO CREACIÓN
export interface CreatePackageRequest {
    name: string;
    description?: string;
    
    imageUrl?: string | null;
    imageQrUrl?: string | null; 

    peopleCount: number;
    
    totalPrice: number;
    pricePerPerson: number;
    minPrice: number; 

    // Comisiones
    commissionType: number; 
    commissionValue: number;

    packageDetails: {
        productId: number;
        quantity: number;
    }[];
}