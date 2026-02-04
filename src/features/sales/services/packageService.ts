import api from '../../../lib/axios';
import { SellerPackage } from "../types";

// ... otros métodos ...

export const getSellerCatalog = async (): Promise<SellerPackage[]> => {
    // Ajusta la URL si tu prefijo api es distinto
    const { data } = await api.get<SellerPackage[]>('/commercial/packages/seller-catalog');
    return data;
};