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
    slug: string;
    imageUrl: string | null;
    peopleCount: number;
    totalPrice: number;
    pricePerPerson: number;
    isPublic: boolean;
    status: boolean; 
    availableStock: number;
    details: PackageDetail[];
}

// DTOs para las actualizaciones parciales
export interface PackageStatusUpdate {
    status: boolean;
}

export interface PackageVisibilityUpdate {
    isPublic: boolean;
}