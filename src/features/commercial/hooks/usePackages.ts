import { useQuery } from '@tanstack/react-query';
import { getPackages } from '../services/packageService';

export const usePackages = () => {
    return useQuery({
        queryKey: ['packages'],
        queryFn: getPackages,
    });
};