import api from '../../../lib/axios';
import { Provider } from '../types';
// import { ApiResponse } from '../../../types/api'; // Asegúrate de tener este tipo o bórralo si no lo usas

// 1. OBTENER LISTA (GET) - Esta es la que te faltaba
export const getProviders = async (): Promise<Provider[]> => {
    // Ajusta si tu backend devuelve { data: [...] } o [...] directo
    const { data } = await api.get<Provider[]>('/inventory/providers');
    return data;
};

// 2. CREAR PROVEEDOR (POST)
export const createProvider = async (data: any): Promise<Provider> => {
    const response = await api.post('/inventory/providers', data);
    return response.data;
};

// 3. ACTUALIZAR PROVEEDOR (PUT)
export const updateProvider = async (id: number, data: any): Promise<Provider> => {
    const response = await api.put(`/inventory/providers/${id}`, data);
    return response.data;
};

// 4. ELIMINAR PROVEEDOR (DELETE) - Por si lo necesitas pronto
export const deleteProvider = async (id: number): Promise<void> => {
    await api.delete(`/inventory/providers/${id}`);
};