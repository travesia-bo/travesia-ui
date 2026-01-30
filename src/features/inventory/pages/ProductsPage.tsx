import { useState, useMemo } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useParameters } from '../../../hooks/useParameters'; // <--- 1. Importar Hook
import { PARAM_CATEGORIES } from '../../../config/constants'; // <--- 2. Importar Constante
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProductStatus, deleteProduct } from '../services/productService';

import { TravesiaTable, Column } from '../../../components/ui/TravesiaTable';
import { TravesiaInput } from '../../../components/ui/TravesiaInput';
import { TravesiaSelect } from '../../../components/ui/TravesiaSelect';
import { CrudButtons, BtnCreate } from '../../../components/ui/CrudButtons';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { TravesiaBadge } from '../../../components/ui/TravesiaBadge'; // <--- 3. Importar Nuevo Badge
import { MapPin, Package, Users } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { Product } from '../types';

export const ProductsPage = () => {
    const { success, error: toastError } = useToast();
    const queryClient = useQueryClient();

    // 1. DATA FETCHING
    const { data: products = [], isLoading } = useProducts();
    
    // Cargar Categorías para el Select
    const { parameters: categories, isLoading: loadingCategories } = useParameters(PARAM_CATEGORIES.PRODUCT_CATEGORY);

    // 2. FILTROS LOCALES
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>(''); 
    const [filterCategory, setFilterCategory] = useState<string>(''); // <--- 4. Nuevo Estado

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  p.categoryName.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = filterStatus === '' 
                ? true 
                : String(p.status) === filterStatus;

            // <--- 5. Lógica de Filtrado por Categoría
            const matchesCategory = filterCategory === ''
                ? true
                : p.categoryCode === Number(filterCategory);

            return matchesSearch && matchesStatus && matchesCategory;
        });
    }, [products, searchTerm, filterStatus, filterCategory]);

    // ... (Mutation logic igual que antes) ...
    const statusMutation = useMutation({ /* ... */ });
    const deleteMutation = useMutation({ /* ... */ });
    const [isStatusModalOpen, setStatusModalOpen] = useState(false);
    const [productToToggle, setProductToToggle] = useState<Product | null>(null);
    const handleStatusClick = (product: Product) => { /* ... */ };
    const confirmStatusChange = () => { /* ... */ };

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
            accessorKey: 'categoryName', // Para ordenamiento
            render: (row) => (
                // <--- 6. AQUÍ USAMOS EL NUEVO BADGE
                <TravesiaBadge 
                    label={row.categoryName} 
                    code={row.categoryCode} 
                    type="PRODUCT_CATEGORY" 
                />
            )
        },
        // ... (Resto de columnas Stocks, Costo, Ubicación igual que antes) ...
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
        {
            header: 'Estado',
            className: 'text-center',
            render: (row) => (
                <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                    <input 
                        type="checkbox" 
                        className={`toggle toggle-sm ${row.status ? 'toggle-success' : 'toggle-error'}`}
                        checked={row.status}
                        onChange={() => handleStatusClick(row)} 
                    />
                </div>
            )
        },
        {
            header: 'Acciones',
            className: 'text-right',
            render: (row) => <CrudButtons onEdit={() => {}} onDelete={() => {}} />
        }
    ];

    return (
        <div className="p-6 space-y-6 animate-fade-in">
            {/* Header igual... */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-base-content">Inventario de Productos</h1>
                    <p className="text-sm text-base-content/60">Gestiona habitaciones, transporte y artículos.</p>
                </div>
                <BtnCreate onClick={() => alert("Próximamente")} />
            </div>

            {/* 2. Filtros ACTUALIZADOS */}
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
                
                {/* <--- 7. NUEVO SELECT DE CATEGORÍA */}
                <div>
                    <TravesiaSelect 
                        label="Categoría"
                        name="categoryFilter"
                        // Mapeamos los parametros que vienen del hook a opciones
                        options={categories.map(cat => ({ 
                            value: cat.numericCode, // Usamos el código numérico (ej: 601) como valor
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

            <ConfirmationModal
                isOpen={isStatusModalOpen}
                onClose={() => { setStatusModalOpen(false); setProductToToggle(null); }}
                onConfirm={confirmStatusChange}
                title={productToToggle?.status ? "¿Deshabilitar?" : "¿Habilitar?"}
                message={`¿Estás seguro de cambiar el estado de "${productToToggle?.name}"?`}
                confirmText="Sí, Cambiar"
                variant={productToToggle?.status ? "warning" : "primary"}
                isLoading={statusMutation.isPending}
            />
        </div>
    );
};