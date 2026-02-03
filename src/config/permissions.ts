// Define los permisos tal cual te llegan del Backend (JWT)
export const PERMISSIONS = {
    PRODUCTS: {
        VIEW: 'products:view',
        CREATE: 'products:create',
        EDIT: 'products:edit',
        DELETE: 'products:delete',
        CHANGE_STATUS: 'INV_PRODUCT_STATUS', // ✅ Este es el que usaremos
    },
    PACKAGES: {
        VIEW: 'packages:view',
        CREATE: 'packages:create',
        EDIT: 'packages:edit',
        DELETE: 'packages:delete',
        CHANGE_STATUS: 'packages:change_status',
        PUBLISH: 'INV_PACKAGE_PUBLISH', // ✅ AGREGA ESTE (o el nombre que use tu backend)
    },
    PROVIDERS: {
        VIEW: 'providers:view',
        // ... otros
    }
} as const;