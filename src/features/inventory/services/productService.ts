import api from '../../../lib/axios';
import { Product, ProductStatusUpdate } from '../types';

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