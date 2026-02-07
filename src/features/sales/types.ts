
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

// Estructura para crear cliente nuevo dentro de la reserva
export interface NewClientData {
    firstName: string;
    paternalSurname: string;
    maternalSurname?: string | null;
    phoneNumber: number;
    email?: string | null;
    identityCard: string;
    clientType: number; // Parametro (ej: 701)
    genderType: number; // Parametro (ej: 721)
    birthDate: string; // YYYY-MM-DD
    cityId: number;
    careerId: number;
}

// Estructura de cada cliente en la lista
export interface ReservationClientItem {
    clientId: number | null; // ID si existe, null si es nuevo
    agreedPrice: number;
    newClientData: NewClientData | null; // null si existe, objeto si es nuevo
}

// Payload Final
export interface CreateReservationRequest {
    packageId: number;
    observations?: string;
    expirationDate?: string | null; // ISO String
    clients: ReservationClientItem[];
}


export interface ClientSearchResult {
    id: number;
    fullName: string;
    phoneNumber: number;
    clientName: string; // Ej: "Estudiante"
    clientCode: number; // Ej: 701
    universityName: string;
    facultyName: string;
    careerName: string;
}

export interface ReservationClient {
    clientId: number;
    fullName: string;
    identityCard: string;
    phoneNumber: number;
    clientTypeName: string;
    clientTypeCode: number;
    agreedPrice: number;
    totalPaid: number;
    pendingAmount: number;
}

export interface ReservationResponse {
    id: number;
    reservationCode: string;
    statusName: string;
    statusCode: number;
    packageName: string;
    totalPrice: number;
    reservationDate: string;
    expirationDate: string | null; 
    userNameSeller: string;        
    commissionSeller: number;      
    clients: ReservationClient[];
}

export interface PaymentHistoryResponse {
    id: number;
    amount: number;
    date: string; // LocalDateTime viene como string ISO
    paymentMethodType: number; // Código del parámetro (ej: 401)
    bankReference: string;
}

export interface ClientFinancialReportResponse {
    id: number;
    clientFullName: string;
    packageName: string;
    agreedPrice: number;
    totalPaid: number;
    balance: number;
    paymentHistory: PaymentHistoryResponse[];
}