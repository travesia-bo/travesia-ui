
// Extensión o nueva interfaz para la vista de Vendedor
export interface SellerPackage {
    id: number;
    name: string;
    description: string;
    slug: string;
    imageUrl?: string;
    imageQrUrl?: string;
    peopleCount: number;
    availableStock: number;
    
    // Precios
    totalPrice: number;
    pricePerPerson: number;
    minPrice: number;
    commission: number; // ✅ DATO CLAVE PARA VENDEDOR
    
    // Detalles (Simplificados para el catálogo)
    details: SellerPackageDetail[];
}

export interface SellerPackageDetail {
    productId: number;
    productName: string;
    categoryName: string;
    categoryCode: number; // 601: Congreso, 602: Hospedaje, 603: Transporte
    quantity: number;
    // ... otros campos
}

// Helper Type para los Filtros Dinámicos
export interface CategoryFilter {
    id: string; // Ej: "601-602" (Congreso + Hospedaje)
    label: string;
    icon: React.ReactNode;
    count: number;
}