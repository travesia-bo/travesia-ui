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

    availableStock: number;
    
    totalPrice: number;     
    pricePerPerson: number;
    minPrice: number;       

    commissionTypeCode: number; 
    commissionTypeName: string;
    commissionValue: number;
    
    isPriceNegotiable: boolean;
    isPublic: boolean; // Público/Privado
    status: boolean; // Activo/Inactivo
    
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

// RESPUESTA DEL ENDPOINT /package-details/by-package/{id}
export interface PackageDetailResponse {
    id: number; // detailId
    packageId: number;
    productId: number;
    quantity: number;
    // Datos informativos del producto
    productName: string;
    productDescription: string;
    productCategoryCode: number;
    productCategoryName: string;
    productPeopleCapacity: number;
    productReferencePrice: number;
    // ... otros campos que vengan
}

// DTO PARA AGREGAR (POST)
export interface AddPackageDetailRequest {
    packageId: number;
    productId: number;
    quantity: number;
}

// DTO PARA ACTUALIZAR (PUT)
export interface UpdatePackageDetailRequest {
    packageId: number;
    productId: number;
    quantity: number;
}