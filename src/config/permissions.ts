// Define los permisos tal cual te llegan del Backend (JWT)
export const PERMISSIONS = {
    PRODUCTS: {
        VIEW: 'products:view',
        CREATE: 'products:create',
        EDIT: 'products:edit',
        DELETE: 'products:delete',
        CHANGE_STATUS: 'INV_PRODUCT_STATUS', // ✅ Este es el que usaremos
    },
    PROVIDERS: {
        VIEW: 'providers:view',
        // ... otros
    }
} as const;