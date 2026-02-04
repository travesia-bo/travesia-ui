import api from '../../../lib/axios';
import type { SellerPackage } from "../types";
import type { CreateReservationRequest } from "../types";

// ... otros métodos ...

export const getSellerCatalog = async (): Promise<SellerPackage[]> => {
    // Ajusta la URL si tu prefijo api es distinto
    const { data } = await api.get<SellerPackage[]>('/commercial/packages/seller-catalog');
    return data;
};

// Buscar Clientes para el Select (Autocomplete)
export const searchClients = async (query: string) => {
    // Asumimos que tu backend soporta filtrado ?q=nombre
    const { data } = await api.get(`/commercial/clients`, { params: { q: query } });
    return data;
};

// Crear Reserva
export const createReservation = async (data: CreateReservationRequest): Promise<void> => {
    await api.post('/sales/reservations', data);
};