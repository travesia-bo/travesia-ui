// Definimos los tipos de badges que soportará tu sistema
export type BadgeType = 
    | 'PRODUCT_CATEGORY' 
    | 'PROVIDER_STATUS' 
    | 'TRANSACTION_STATUS' 
    | 'DEFAULT';

// Definimos el mapa de colores. 
// La clave interna puede ser el ID numérico (code) o un string clave.
export const BADGE_STYLES: Record<BadgeType, Record<string | number, string>> = {
    
    // 1. CATEGORÍAS DE PRODUCTO (Usamos los códigos que me mostraste: 601, 602, 603)
    PRODUCT_CATEGORY: {
        601: "badge-primary text-primary-content",   // Electrónica / General -> Azul/Primario
        602: "badge-secondary text-secondary-content", // Hospedaje -> Rosa/Secundario
        603: "badge-accent text-accent-content",     // Transporte -> Turquesa/Acento
        // Puedes agregar más códigos aquí...
        default: "badge-ghost"
    },

    // 2. ESTADOS (Genérico para booleanos o códigos de status)
    PROVIDER_STATUS: {
        1: "badge-success text-white", // Activo
        0: "badge-error text-white",   // Inactivo
        default: "badge-ghost"
    },

    // 3. TRANSACCIONES (Ejemplo futuro)
    TRANSACTION_STATUS: {
        PENDING: "badge-warning text-white",
        COMPLETED: "badge-success text-white",
        FAILED: "badge-error text-white",
        default: "badge-neutral text-neutral-content"
    },

    DEFAULT: {
        default: "badge-ghost"
    }
};

// Helper para obtener el estilo de forma segura
export const getBadgeStyle = (type: BadgeType, code: string | number | boolean): string => {
    const group = BADGE_STYLES[type] || BADGE_STYLES.DEFAULT;
    
    // Convertimos booleanos a 1/0 para estandarizar si fuera necesario
    const safeCode = typeof code === 'boolean' ? (code ? 1 : 0) : code;

    return group[safeCode] || group['default'] || "badge-ghost";
};