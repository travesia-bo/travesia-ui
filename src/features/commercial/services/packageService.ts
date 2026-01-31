import api from '../../../lib/axios';
import { Package, PackageStatusUpdate, PackageVisibilityUpdate } from '../types';
import { CreatePackageRequest, Package } from '../types';

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


// 5. CREAR PAQUETE
export const createPackage = async (data: CreatePackageRequest): Promise<Package> => {
    const response = await api.post(BASE_URL, data);
    return response.data;
};

// 6. ACTUALIZAR PAQUETE
export const updatePackage = async (id: number, data: CreatePackageRequest): Promise<Package> => {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return response.data;
};