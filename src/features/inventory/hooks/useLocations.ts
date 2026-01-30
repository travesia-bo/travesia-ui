import { useQuery } from '@tanstack/react-query';
import { getLocations } from '../services/locationService';

export const useLocations = () => {
    return useQuery({
        queryKey: ['locations'],
        queryFn: getLocations,
        staleTime: 1000 * 60 * 10, // 10 min cache
    });
};