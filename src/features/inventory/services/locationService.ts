import api from '../../../lib/axios';
import { Location } from '../types';

export const getLocations = async (): Promise<Location[]> => {
    const { data } = await api.get<Location[]>('/inventory/locations');
    return data;
};