import api from '../lib/axios';
import type { SystemParameter } from '../config/constants';
import type { ApiResponse } from '../types/api';

export const getParametersByCategory = async (category: string): Promise<SystemParameter[]> => {
    // Ajusta la URL según tu Controller de Spring Boot
    // Opción A: Query Param
    const { data } = await api.get<ApiResponse<SystemParameter[]>>(`/generic/parameters`, {
        params: { category }
    });
    
    return data.data; 
};