import { useQuery } from '@tanstack/react-query';
import { getProviders } from '../services/providerService';

export const useProviders = () => {
    return useQuery({
        queryKey: ['providers'],
        queryFn: getProviders,
    });
};