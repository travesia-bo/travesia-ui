// DTOs basados exactamente en tus JSONs

export interface Provider {
    id: number;
    name: string;
    address: string | null;
    
    // Datos para mostrar (Lectura)
    statusName: string;
    cityName: string;
    contactFullName: string;
    
    // Datos para lógica/edición (Escritura)
    statusCode: number;
    cityId: string; // Ojo: En tu JSON viene como string "3"
    
    // Nuevos campos desglosados
    contactFirstName: string;
    contactPaternalSurname: string | null; // Puede venir null
    contactMaternalSurname: string | null; // Puede venir null
    contactIdentityCard: string | null;    // Puede venir null
    contactPhoneNumber: number;
    contactEmail: string | null;
    imageUrl: string | null;
}

export interface City {
    id: number;
    name: string;
    country: string;
}