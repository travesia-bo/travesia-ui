import api from '../lib/axios';
import { City } from '../features/inventory/types';
import { ApiResponse } from '../types/api';

export const getCities = async (): Promise<City[]> => {
    // Asumiendo que devuelve array directo según tu ejemplo, si tiene wrapper ajustamos
    const { data } = await api.get<City[]>('/generic/cities');
    return data;
};