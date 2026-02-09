import api from '../../../lib/axios';
import type { Product, ProductStatusUpdate, CreateProductRequest } from '../types';
import { useQuery } from '@tanstack/react-query';
import { getLocations } from '../services/locationService';

const BASE_URL = '/inventory/products';

// 1. GET ALL
export const getProducts = async (): Promise<Product[]> => {
    const { data } = await api.get<Product[]>(BASE_URL);
    return data;
};

// 2. PATCH STATUS
export const updateProductStatus = async (id: number, status: boolean): Promise<void> => {
    const payload: ProductStatusUpdate = { status };
    await api.patch(`${BASE_URL}/${id}/status`, payload);
};

// 3. DELETE (Para cuando conectes el botón de eliminar)
export const deleteProduct = async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
};


export const createProduct = async (data: CreateProductRequest): Promise<Product> => {
    const response = await api.post(BASE_URL, data);
    return response.data;
};

export const updateProduct = async (id: number, data: CreateProductRequest): Promise<Product> => {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return response.data;
};


export const useLocations = () => {
    return useQuery({
        queryKey: ['locations'],
        queryFn: getLocations,
        staleTime: 1000 * 60 * 10, // 10 min cache
    });
};