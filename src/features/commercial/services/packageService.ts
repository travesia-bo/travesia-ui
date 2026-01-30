import api from '../../../lib/axios';
import { Package, PackageStatusUpdate, PackageVisibilityUpdate } from '../types';

const BASE_URL = '/commercial/packages';

// 1. OBTENER TODOS
export const getPackages = async (): Promise<Package[]> => {
    const { data } = await api.get<Package[]>(BASE_URL);
    return data;
};

// 2. ACTUALIZAR ESTADO (Activo/Inactivo)
export const updatePackageStatus = async (id: number, status: boolean): Promise<void> => {
    const payload: PackageStatusUpdate = { status };
    await api.patch(`${BASE_URL}/${id}/status`, payload);
};

// 3. ACTUALIZAR VISIBILIDAD (Público/Privado)
export const updatePackageVisibility = async (id: number, isPublic: boolean): Promise<void> => {
    const payload: PackageVisibilityUpdate = { isPublic };
    await api.patch(`${BASE_URL}/${id}/visibility`, payload);
};

// 4. ELIMINAR PAQUETE
export const deletePackage = async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
};