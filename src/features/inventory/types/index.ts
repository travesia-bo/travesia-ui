// DTOs basados exactamente en tus JSONs

export interface Provider {
    id: number;
    name: string;
    address: string;
    contactFullName: string;
    contactPhoneNumber: number;
    contactEmail: string | null;
    contactIdentityCard: string | null;
    imageUrl: string | null;
    statusName: string;
    statusCode: number; // 121, 122, etc.
    cityName: string;
}

export interface City {
    id: number;
    name: string;
    country: string;
}