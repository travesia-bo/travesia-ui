/**
 * Códigos de Categoría para el Módulo GENERIC.
 * Estos strings deben coincidir con la columna 'category' en tu BD.
 */
export const PARAM_CATEGORIES = {
    CLIENT_TYPE: 'CLIENT_TYPE',       // Ej: 701 (Estudiante), 702 (Profesional)
    PAYMENT_METHOD: 'PAYMENT_METHOD', // Ej: 401 (QR), 402 (Transferencia)
    PRODUCT_CATEGORY: 'PRODUCT_CATEGORY', // Ej: 601 (Electrónica)
    RESERVATION_STATUS: 'RESERVATION_STATUS', // Ej: Confirmada, Cancelada
    PROVIDER_STATUS: 'PROVIDER_STATUS', // 121, 122...
    COMMISSION_TYPE: 'COMMISSION_TYPE', 
} as const;

// Tipos base para Travesía
export interface SystemParameter {
    id: number;
    numericCode: number; // 701, 702, etc.
    name: string;        // "Estudiante"
    description?: string;
    category: string;
}

// ... otras constantes ...

// ✅ MAPA DE ESTADOS DE PROVEEDOR (Ajusta los IDs según tu Base de Datos)
export const PROVIDER_STATUS_ID = {
    PENDING: 121,
    CONFIRMED: 122,
    CANCELLED: 123,
    INACTIVE: 124
};

export const COMMISSION_CODES = {
    PERCENTAGE: 621,
    FIXED_AMOUNT: 622
};