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
} as const;

// Tipos base para Travesía
export interface SystemParameter {
    id: number;
    numericCode: number; // 701, 702, etc.
    name: string;        // "Estudiante"
    description?: string;
    category: string;
}