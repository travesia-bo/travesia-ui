import api from '../../../lib/axios';
import { Provider } from '../types';

export const getProviders = async (): Promise<Provider[]> => {
    const { data } = await api.get<Provider[]>('/inventory/providers');
    return data;
};