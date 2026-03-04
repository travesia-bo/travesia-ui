import api from '../../../lib/axios';
import type { SellerResponse } from "../types/index";

export const getSellers = async (): Promise<SellerResponse[]> => {
    const { data } = await api.get<SellerResponse[]>("/commercial/sellers");
    return data;
};

export const createSeller = async (sellerData: any): Promise<void> => {
    await api.post("/commercial/sellers", sellerData);
};

export const updateSeller = async (id: number, sellerData: any): Promise<void> => {
    await api.put(`/commercial/sellers/${id}`, sellerData);
};
