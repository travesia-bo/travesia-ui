import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Package, Users } from 'lucide-react';

// Hooks y Servicios
import { useProducts } from '../hooks/useProducts';
import { useProviders } from '../hooks/useProviders';
import { useParameters } from '../../../hooks/useParameters'; // ✅ Importar Hook
import { updateProductStatus, deleteProduct } from '../services/productService';
import { PARAM_CATEGORIES } from '../../../config/constants'; // ✅ Importar Constante
import { useToast } from '../../../context/ToastContext';

// UI Components
import { TravesiaTable, type Column } from '../../../components/ui/TravesiaTable';
import { TravesiaInput } from '../../../components/ui/TravesiaInput';
import { TravesiaSelect } from '../../../components/ui/TravesiaSelect';
import { RichSelect } from '../../../components/ui/RichSelect';
import { CrudButtons, BtnCreate } from '../../../components/ui/CrudButtons';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { TravesiaBadge } from '../../../components/ui/TravesiaBadge'; 
import { TravesiaSwitch } from '../../../components/ui/TravesiaSwitch';
import { ProductFormModal } from '../components/ProductFormModal'; 

// Types
import { type Product } from '../types';
import { PERMISSIONS } from '../../../config/permissions';
import { useCheckPermission } from '../../../hooks/useCheckPermission';

export const ProductsPage = () => {
    const { success, error: toastError } = useToast();
    const queryClient = useQueryClient();

    // 1. DATA FETCHING
    const { data: products = [], isLoading } = useProducts();
    const { data: providers = [], isLoading: loadingProviders } = useProviders();
    const { parameters: categories, isLoading: loadingCategories } = useParameters(PARAM_CATEGORIES.PRODUCT_CATEGORY);
    
    // ✅ NUEVO: Cargar Estados de Proveedor
    const { parameters: providerStatuses, isLoading: loadingProviderStatuses } = useParameters(PARAM_CATEGORIES.PROVIDER_STATUS);

    // 2. FILTROS LOCALES
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>(''); 
    const [filterProvider, setFilterProvider] = useState<number | null>(null);
    
    // ✅ NUEVO: Estado para el filtro de Estado Proveedor
    const [filterProviderStatus, setFilterProviderStatus] = useState<string>('');

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  p.categoryName.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesCategory = filterCategory === ''
                ? true
                : p.categoryCode === Number(filterCategory);

            const matchesProvider = filterProvider === null
                ? true
                : p.providerId === filterProvider;

            // ✅ NUEVO: Lógica de filtrado por Estado de Proveedor
            const matchesProviderStatus = filterProviderStatus === ''
                ? true
                : p.providerStatusCode === Number(filterProviderStatus);

            return matchesSearch && matchesCategory && matchesProvider && matchesProviderStatus;
        });
    }, [products, searchTerm, filterCategory, filterProvider, filterProviderStatus]);

    // 3. ESTADOS PARA MODALES
    const [isStatusModalOpen, setStatusModalOpen] = useState(false);
    const [productToToggle, setProductToToggle] = useState<Product | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);

    // --- MUTATIONS ---
    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: boolean }) => updateProductStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setStatusModalOpen(false);
            setProductToToggle(null);
            success("Estado actualizado correctamente.");
        },
        onError: () => toastError("Error al cambiar el estado.")
    });

    const deleteMutation = useMutation({
        mutationFn: deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            success("Producto eliminado.");
            setIsDeleteModalOpen(false);
            setProductToDelete(null);
        },
        onError: () => toastError("No se pudo eliminar el producto.")
    });

    const confirmDelete = () => {
        if (productToDelete) {
            deleteMutation.mutate(productToDelete.id);
        }
    };

    // --- HANDLERS ---
    const handleStatusClick = (product: Product) => {
        setProductToToggle(product);
        setStatusModalOpen(true);
    };

    const confirmStatusChange = () => {
        if (productToToggle) {
            statusMutation.mutate({ id: productToToggle.id, status: !productToToggle.status });
        }
    };

    const handleCreate = () => {
        setEditingProduct(null);
        setIsFormModalOpen(true);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsFormModalOpen(true);
    };
    
    // ✅ LÓGICA DE COLORES POR FILA (CARD VERDE)
    const getRowClassName = (row: Product) => {
        const status = row.providerStatusName?.toLowerCase() || '';
        
        // 🔴 CANCELADO (Rojo)
        if (status.includes('cancel') || status.includes('bloquead')) {
            return '!bg-error/15 hover:!bg-error/25 border-l-4 border-l-error'; 
        }
        
        // ⚫ INACTIVO (Gris)
        if (status.includes('inactiv')) {
            return '!bg-base-200/60 hover:!bg-base-200 border-l-4 border-l-base-content/20 text-base-content/50';
        }
        
        // 🟢 CONFIRMADO (Verde - "Card Verda")
        if (status.includes('confirm')) {
             return '!bg-success/10 hover:!bg-success/20 border-l-4 border-l-success';
        }

        // 🟡 PENDIENTE (Amarillo)
        if (status.includes('pendien')) {
             return '!bg-warning/15 hover:!bg-warning/25 border-l-4 border-l-warning';
        }

        return '';
    };

    const canChangeStatus = useCheckPermission(PERMISSIONS.PRODUCTS.CHANGE_STATUS);

    // 5. DEFINICIÓN DE COLUMNAS
    const columns: Column<Product>[] = [
        {
            header: 'Producto',
            accessorKey: 'name',
            render: (row) => (
                <div>
                    <div className="font-bold text-base-content">{row.name}</div>
                    <div className="text-xs text-base-content/60 truncate max-w-[200px]" title={row.description}>
                        {row.description}
                    </div>
                </div>
            )
        },
        {
            header: 'Categoría',
            accessorKey: 'categoryName', 
            render: (row) => (
                <TravesiaBadge 
                    label={row.categoryName} 
                    code={row.categoryCode} 
                    type="PRODUCT_CATEGORY" 
                />
            )
        },
        {
            header: 'Stock / Cap.',
            render: (row) => (
                <div className="flex flex-col gap-1 text-xs">
                    <div className="flex items-center gap-1">
                        <Package size={14} className="text-primary"/>
                        <span className="font-bold">{row.availableStock}</span>
                        <span className="opacity-50">/ {row.physicalStock}</span>
                    </div>
                    {row.peopleCapacity > 0 && (
                        <div className="flex items-center gap-1 text-secondary">
                            <Users size={14} />
                            <span>{row.peopleCapacity} p.</span>
                        </div>
                    )}
                </div>
            )
        },
        {
            header: 'Precios (Bs)',
            render: (row) => (
                <div className="flex flex-col items-start gap-0.5">
                    <div className="flex items-center gap-2" title="Precio de Venta al Público">
                        <span className="badge badge-sm badge-success/10 text-success font-bold border-0 px-1.5 h-5">
                            Venta
                        </span>
                        <span className="font-mono font-bold text-base text-base-content">
                            {row.referencePrice == null ? '0.00' : row.referencePrice.toFixed(2)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 opacity-60 text-xs" title="Costo del Proveedor">
                        <span className="badge badge-sm badge-ghost font-normal px-1.5 h-4 text-[10px]">
                            Base
                        </span>
                        <span className="font-mono">
                            {row.providerCost == null ? '0.00' : row.providerCost.toFixed(2)}
                        </span>
                    </div>
                </div>
            )
        },
        {
            header: 'Ubicación',
            render: (row) => (
                 <div className="flex items-start gap-2 py-1">
                    <div className="mt-1 text-primary opacity-80"><MapPin size={16} /></div>
                    <div className="flex flex-col">
                        <span className="font-bold text-xs">{row.locationName}</span>
                        <span className="text-[10px] text-base-content/60 leading-tight max-w-[140px]">{row.locationAddress}</span>
                        {row.locationMapUrl && <a href={row.locationMapUrl} target="_blank" rel="noreferrer" className="link link-primary text-[10px]" onClick={e => e.stopPropagation()}>Ver Mapa</a>}
                    </div>
                </div>
            )
        },
        ...(canChangeStatus ? [{
            header: 'Estado',
            className: 'text-center w-24',
            render: (row: Product) => (
                <div 
                    className="flex flex-col items-center justify-center gap-1 cursor-pointer group"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleStatusClick(row); 
                    }}
                >
                    <div className="pointer-events-none transition-transform group-active:scale-95"> 
                        <TravesiaSwitch checked={row.status} onChange={() => {}} />
                    </div>
                    <span className={`text-[9px] font-bold tracking-wider ${row.status ? 'text-success' : 'text-base-content/40'}`}>
                        {row.status ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                </div>
            )
        }] : []), // Si no tiene permiso, agrega un array vacío (no renderiza nada)
        {
            header: 'Acciones',
            className: 'text-right',
            render: (row) => (
                <CrudButtons 
                    onEdit={() => handleEdit(row)} 
                    onDelete={() => {
                        setProductToDelete(row);     
                        setIsDeleteModalOpen(true);  
                    }} 
                />
            )
        }
    ];
    
    return (
        <div className="p-6 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-base-content">Inventario de Productos</h1>
                    <p className="text-sm text-base-content/60">Gestiona productos, precios y proveedores.</p>
                </div>
                <BtnCreate onClick={handleCreate} />
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-base-100 p-4 rounded-xl shadow-sm border border-base-200">
                <div className="md:col-span-1">
                    <TravesiaInput 
                        label="Buscar" 
                        placeholder="Nombre..." 
                        icon="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                {/* Filtro Categoría */}
                <div>
                    <TravesiaSelect 
                        label="Categoría"
                        options={categories.map(cat => ({ value: cat.numericCode, label: cat.name }))}
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        placeholder="Todas"
                        isLoading={loadingCategories}
                        enableDefaultOption
                    />
                </div>

                {/* ✅ NUEVO: Filtro Estado Proveedor */}
                <div>
                    <TravesiaSelect 
                        label="Estado Proveedor"
                        options={providerStatuses.map(st => ({ value: st.numericCode, label: st.name }))}
                        value={filterProviderStatus}
                        onChange={(e) => setFilterProviderStatus(e.target.value)}
                        placeholder="Todos"
                        isLoading={loadingProviderStatuses}
                        enableDefaultOption
                    />
                </div>

                {/* Filtro Proveedor Específico */}
                <div>
                    <RichSelect 
                        label="Proveedor Específico"
                        placeholder="Filtrar por proveedor..."
                        isLoading={loadingProviders}
                        value={filterProvider}
                        onChange={(val) => setFilterProvider(val ? Number(val) : null)}
                        // Mapeo Inteligente con Badges
                        options={providers.map(p => {
                            const statusLower = p.statusName.toLowerCase();
                            // Colores de Badge
                            let badgeClass = "badge-ghost"; // Default
                            if (statusLower.includes('confirm')) badgeClass = "badge-success text-white";
                            else if (statusLower.includes('pendien')) badgeClass = "badge-warning text-white";
                            else if (statusLower.includes('cancel')) badgeClass = "badge-error text-white";
                            
                            return {
                                value: p.id,
                                label: p.name,
                                subtitle: p.cityName,
                                rightContent: (
                                    <span className={`badge ${badgeClass} text-[9px] font-bold h-5 px-1.5 border-0`}>
                                        {p.statusName.toUpperCase()}
                                    </span>
                                )
                            };
                        })}
                    />
                    {filterProvider && (
                        <button 
                            onClick={() => setFilterProvider(null)}
                            className="text-[10px] text-primary hover:underline mt-1 ml-1"
                        >
                            Ver todos los proveedores
                        </button>
                    )}
                </div>
            </div>

            <TravesiaTable 
                data={filteredProducts} 
                columns={columns} 
                isLoading={isLoading}
                rowClassName={getRowClassName} 
            />

            {/* MODALES */}
            {isFormModalOpen && (
                <ProductFormModal 
                    isOpen={isFormModalOpen}
                    onClose={() => setIsFormModalOpen(false)}
                    productToEdit={editingProduct}
                />
            )}

            <ConfirmationModal
                isOpen={isStatusModalOpen}
                onClose={() => { setStatusModalOpen(false); setProductToToggle(null); }}
                onConfirm={confirmStatusChange}
                title={productToToggle?.status ? "¿Deshabilitar?" : "¿Habilitar?"}
                message={`¿Estás seguro de cambiar el estado de "${productToToggle?.name}"?`}
                confirmText={productToToggle?.status ? "Sí, Deshabilitar" : "Sí, Habilitar"}
                variant={productToToggle?.status ? "danger" : "primary"}
                isLoading={statusMutation.isPending}
            />
            
            
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => { setIsDeleteModalOpen(false); setProductToDelete(null); }}
                onConfirm={confirmDelete}
                title="¿Eliminar Producto?"
                message={`Estás a punto de eliminar "${productToDelete?.name}". Esta acción no se puede deshacer.`}
                confirmText="Sí, Eliminar"
                variant="danger"
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
};