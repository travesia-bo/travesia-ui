import { useState, useMemo } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useParameters } from '../../../hooks/useParameters'; 
import { PARAM_CATEGORIES } from '../../../config/constants'; 
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProductStatus, deleteProduct } from '../services/productService';

import { TravesiaTable, Column } from '../../../components/ui/TravesiaTable';
import { TravesiaInput } from '../../../components/ui/TravesiaInput';
import { TravesiaSelect } from '../../../components/ui/TravesiaSelect';
import { CrudButtons, BtnCreate } from '../../../components/ui/CrudButtons';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { TravesiaBadge } from '../../../components/ui/TravesiaBadge'; 
import { MapPin, Package, Users } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { Product } from '../types';
import { TravesiaSwitch } from '../../../components/ui/TravesiaSwitch';
import { ProductFormModal } from '../components/ProductFormModal'; 

export const ProductsPage = () => {
    const { success, error: toastError } = useToast();
    const queryClient = useQueryClient();

    // 1. DATA FETCHING
    const { data: products = [], isLoading } = useProducts();
    
    // Cargar Categorías
    const { parameters: categories, isLoading: loadingCategories } = useParameters(PARAM_CATEGORIES.PRODUCT_CATEGORY);

    // 2. FILTROS LOCALES
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>(''); 
    const [filterCategory, setFilterCategory] = useState<string>(''); 

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  p.categoryName.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = filterStatus === '' 
                ? true 
                : String(p.status) === filterStatus;

            const matchesCategory = filterCategory === ''
                ? true
                : p.categoryCode === Number(filterCategory);

            return matchesSearch && matchesStatus && matchesCategory;
        });
    }, [products, searchTerm, filterStatus, filterCategory]);

    // 3. ESTADOS PARA MODALES
    const [isStatusModalOpen, setStatusModalOpen] = useState(false);
    const [productToToggle, setProductToToggle] = useState<Product | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // --- LÓGICA RECUPERADA: CAMBIO DE ESTADO ---
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

    const handleStatusClick = (product: Product) => {
        setProductToToggle(product);
        setStatusModalOpen(true);
    };

    const confirmStatusChange = () => {
        if (productToToggle) {
            statusMutation.mutate({ id: productToToggle.id, status: !productToToggle.status });
        }
    };

    // --- LÓGICA RECUPERADA: CREAR / EDITAR ---
    const handleCreate = () => {
        setEditingProduct(null);
        setIsFormModalOpen(true);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsFormModalOpen(true);
    };

    // --- LÓGICA: ELIMINAR ---
    const deleteMutation = useMutation({
        mutationFn: deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            success("Producto eliminado.");
        },
        onError: () => toastError("No se pudo eliminar el producto.")
    });

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
            header: 'Costo',
            render: (row) => <span className="font-mono text-sm">Bs. {row.providerCost.toFixed(2)}</span>
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
        // --- COLUMNA ESTADO (ARREGLADA) ---
        {
            header: 'Estado',
            className: 'text-center w-24',
            render: (row) => (
                // Usamos un div que atrapa el clic y detiene la propagación
                <div 
                    className="flex flex-col items-center justify-center gap-1 cursor-pointer group"
                    onClick={(e) => {
                        e.stopPropagation(); // ¡Vital! Evita clicks fantasma
                        handleStatusClick(row); 
                    }}
                >
                    {/* pointer-events-none asegura que el clic lo reciba el div padre */}
                    <div className="pointer-events-none transition-transform group-active:scale-95"> 
                        <TravesiaSwitch 
                            checked={row.status}
                            onChange={() => {}} 
                        />
                    </div>

                    <span className={`text-[9px] font-bold tracking-wider ${row.status ? 'text-success' : 'text-base-content/40'}`}>
                        {row.status ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                </div>
            )
        },
        {
            header: 'Acciones',
            className: 'text-right',
            render: (row) => (
                <CrudButtons 
                    onEdit={() => handleEdit(row)} 
                    onDelete={() => {
                        if(window.confirm("¿Estás seguro de eliminar este producto?")) {
                            deleteMutation.mutate(row.id);
                        }
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
                    <p className="text-sm text-base-content/60">Gestiona habitaciones, transporte y artículos.</p>
                </div>
                <BtnCreate onClick={handleCreate} />
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-base-100 p-4 rounded-xl shadow-sm border border-base-200">
                <div className="md:col-span-2">
                    <TravesiaInput 
                        label="Buscar" 
                        placeholder="Nombre..." 
                        icon="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div>
                    <TravesiaSelect 
                        label="Categoría"
                        name="categoryFilter"
                        options={categories.map(cat => ({ 
                            value: cat.numericCode, 
                            label: cat.name 
                        }))}
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        placeholder="Todas"
                        isLoading={loadingCategories}
                        enableDefaultOption
                    />
                </div>

                <div>
                    <TravesiaSelect 
                        label="Estado"
                        name="statusFilter"
                        options={[
                            { value: 'true', label: 'Activos' },
                            { value: 'false', label: 'Inactivos' }
                        ]}
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        placeholder="Todos"
                        enableDefaultOption
                    />
                </div>
            </div>

            <TravesiaTable 
                data={filteredProducts} 
                columns={columns} 
                isLoading={isLoading} 
            />

            {/* MODAL FORMULARIO */}
            {isFormModalOpen && (
                <ProductFormModal 
                    isOpen={isFormModalOpen}
                    onClose={() => setIsFormModalOpen(false)}
                    productToEdit={editingProduct}
                />
            )}

            {/* MODAL CONFIRMACIÓN ESTADO */}
            <ConfirmationModal
                isOpen={isStatusModalOpen}
                onClose={() => { setStatusModalOpen(false); setProductToToggle(null); }}
                onConfirm={confirmStatusChange}
                title={productToToggle?.status ? "¿Deshabilitar?" : "¿Habilitar?"}
                message={`¿Estás seguro de cambiar el estado de "${productToToggle?.name}"?`}
                confirmText={productToToggle?.status ? "Sí, Deshabilitar" : "Sí, Habilitar"}
                variant={productToToggle?.status ? "warning" : "primary"}
                isLoading={statusMutation.isPending}
            />
        </div>
    );
};