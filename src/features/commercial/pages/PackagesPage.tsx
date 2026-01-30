import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePackages } from '../hooks/usePackages';
import { useParameters } from '../../../hooks/useParameters';
import { PARAM_CATEGORIES } from '../../../config/constants';
import { Package, PackageDetail } from '../types';

// Servicios
import { updatePackageStatus, updatePackageVisibility, deletePackage } from '../services/packageService';

// UI Components
import { TravesiaTable, Column } from '../../../components/ui/TravesiaTable';
import { TravesiaInput } from '../../../components/ui/TravesiaInput';
import { TravesiaSelect } from '../../../components/ui/TravesiaSelect';
import { CrudButtons, BtnCreate } from '../../../components/ui/CrudButtons';
import { TravesiaSwitch } from '../../../components/ui/TravesiaSwitch';
import { PackageDetailsModal } from '../components/PackageDetailsModal';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal'; // Componente reutilizable
import { Eye, Users, Package as BoxIcon, Globe, Power } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export const PackagesPage = () => {
    const { success, error: toastError } = useToast();
    const queryClient = useQueryClient();

    // 1. Data Fetching
    const { data: packages = [], isLoading } = usePackages();
    const { parameters: categories, isLoading: loadingCategories } = useParameters(PARAM_CATEGORIES.PRODUCT_CATEGORY);

    // 2. Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('');
    const [filterPeople, setFilterPeople] = useState<string>('');

    const filteredPackages = useMemo(() => {
        return packages.filter(pkg => {
            const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterCategory === '' 
                ? true 
                : pkg.details.some((d: PackageDetail) => d.categoryCode === Number(filterCategory));
            const matchesPeople = filterPeople === '' 
                ? true 
                : pkg.peopleCount === Number(filterPeople);
            return matchesSearch && matchesCategory && matchesPeople;
        });
    }, [packages, searchTerm, filterCategory, filterPeople]);

    // 3. Estados de Modales (Visualización y Edición)
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
    
    // --- ESTADOS PARA MODALES DE CONFIRMACIÓN ---
    const [packageToToggle, setPackageToToggle] = useState<Package | null>(null); // Paquete seleccionado para cambiar
    
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);      // Modal Activo/Inactivo
    const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false); // Modal Público/Privado
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);      // Modal Eliminar

    // --- MUTATIONS ---

    // A. STATUS MUTATION
    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: boolean }) => updatePackageStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['packages'] });
            setIsStatusModalOpen(false);
            setPackageToToggle(null);
            success("Estado del paquete actualizado.");
        },
        onError: () => toastError("Error al actualizar el estado.")
    });

    // B. VISIBILITY MUTATION
    const visibilityMutation = useMutation({
        mutationFn: ({ id, isPublic }: { id: number; isPublic: boolean }) => updatePackageVisibility(id, isPublic),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['packages'] });
            setIsVisibilityModalOpen(false);
            setPackageToToggle(null);
            success("Visibilidad del paquete actualizada.");
        },
        onError: () => toastError("Error al cambiar la visibilidad.")
    });

    // C. DELETE MUTATION
    const deleteMutation = useMutation({
        mutationFn: deletePackage,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['packages'] });
            setIsDeleteModalOpen(false);
            setPackageToToggle(null);
            success("Paquete eliminado correctamente.");
        },
        onError: () => toastError("No se pudo eliminar el paquete.")
    });

    // --- HANDLERS (Interceptores que abren modales) ---

    // 1. Manejo de STATUS (Activo/Inactivo)
    const handleStatusClick = (pkg: Package) => {
        setPackageToToggle(pkg);
        setIsStatusModalOpen(true);
    };

    const confirmStatusChange = () => {
        if (packageToToggle) {
            statusMutation.mutate({ id: packageToToggle.id, status: !packageToToggle.status });
        }
    };

    // 2. Manejo de VISIBILIDAD (Público/Privado)
    const handleVisibilityClick = (pkg: Package) => {
        setPackageToToggle(pkg);
        setIsVisibilityModalOpen(true);
    };

    const confirmVisibilityChange = () => {
        if (packageToToggle) {
            visibilityMutation.mutate({ id: packageToToggle.id, isPublic: !packageToToggle.isPublic });
        }
    };

    // 3. Manejo de ELIMINAR
    const handleDeleteClick = (pkg: Package) => {
        setPackageToToggle(pkg);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (packageToToggle) {
            deleteMutation.mutate(packageToToggle.id);
        }
    };

    // 5. Definición de Columnas
    const columns: Column<Package>[] = [
        {
            header: 'Paquete',
            accessorKey: 'name',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary hidden sm:block">
                        <BoxIcon size={20} />
                    </div>
                    <div>
                        <div className="font-bold text-base-content">{row.name}</div>
                        <div className="text-xs text-base-content/60 truncate max-w-[200px]" title={row.description}>
                            {row.description}
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: 'Capacidad / Stock',
            render: (row) => (
                <div className="flex flex-col gap-1 text-xs">
                    <div className="flex items-center gap-1 font-medium">
                        <Users size={14} className="text-secondary" />
                        <span>{row.peopleCount} Pers.</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-70">
                        <BoxIcon size={14} />
                        <span>{row.availableStock} Disp.</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Precio',
            accessorKey: 'totalPrice',
            render: (row) => (
                <div className="flex flex-col">
                    <span className="font-mono font-bold text-sm text-success">Bs. {row.totalPrice}</span>
                    {row.peopleCount > 1 && (
                        <span className="text-[10px] opacity-60">({row.pricePerPerson} c/u)</span>
                    )}
                </div>
            )
        },
        // COLUMN: PUBLICO (Switch 1)
        {
            header: <span className="flex items-center gap-1"><Globe size={14}/> Público</span>,
            className: 'text-center w-20',
            render: (row) => (
                <div 
                    className="flex justify-center cursor-pointer" 
                    onClick={(e) => { e.stopPropagation(); handleVisibilityClick(row); }}
                >
                    <div className="pointer-events-none">
                        <TravesiaSwitch 
                            checked={row.isPublic} 
                            onChange={() => {}} 
                            // Loading solo si es ESTE paquete Y es ESTA mutación
                            isLoading={visibilityMutation.isPending && visibilityMutation.variables?.id === row.id}
                        />
                    </div>
                </div>
            )
        },
        // COLUMN: STATUS (Switch 2)
        {
            header: <span className="flex items-center gap-1"><Power size={14}/> Activo</span>,
            className: 'text-center w-20',
            render: (row) => (
                <div 
                    className="flex justify-center cursor-pointer" 
                    onClick={(e) => { e.stopPropagation(); handleStatusClick(row); }}
                >
                    <div className="pointer-events-none">
                        <TravesiaSwitch 
                            checked={row.status} 
                            onChange={() => {}} 
                            isLoading={statusMutation.isPending && statusMutation.variables?.id === row.id}
                        />
                    </div>
                </div>
            )
        },
        {
            header: 'Acciones',
            className: 'text-right',
            render: (row) => (
                <div className="flex justify-end items-center gap-2">
                    <button 
                        className="btn btn-square btn-sm btn-ghost text-info hover:bg-info/10"
                        onClick={() => { setSelectedPackage(row); setDetailsModalOpen(true); }}
                        title="Ver productos del paquete"
                    >
                        <Eye size={18} />
                    </button>

                    <CrudButtons 
                        onEdit={() => console.log("Editar Pendiente", row.id)} 
                        onDelete={() => handleDeleteClick(row)} 
                    />
                </div>
            )
        }
    ];

    return (
        <div className="p-6 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-base-content">Paquetes Comerciales</h1>
                    <p className="text-sm text-base-content/60">Gestiona ofertas, combos y promociones.</p>
                </div>
                <BtnCreate onClick={() => console.log("Crear Paquete Pendiente")} />
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-base-100 p-4 rounded-xl shadow-sm border border-base-200">
                <div className="md:col-span-2">
                    <TravesiaInput 
                        label="Buscar Paquete" 
                        placeholder="Nombre..." 
                        icon="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div>
                    <TravesiaSelect 
                        label="Incluye productos de..."
                        options={categories.map(cat => ({ value: cat.numericCode, label: cat.name }))}
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        placeholder="Cualquier categoría"
                        isLoading={loadingCategories}
                        enableDefaultOption
                    />
                </div>
                <div>
                    <TravesiaSelect 
                        label="Para..."
                        options={[
                            { value: 1, label: "1 Persona" },
                            { value: 2, label: "2 Personas" },
                            { value: 3, label: "3 Personas" },
                            { value: 4, label: "4+ Personas" },
                        ]}
                        value={filterPeople}
                        onChange={(e) => setFilterPeople(e.target.value)}
                        placeholder="Cualquier capacidad"
                        enableDefaultOption
                    />
                </div>
            </div>

            {/* TABLA */}
            <TravesiaTable 
                data={filteredPackages} 
                columns={columns} 
                isLoading={isLoading} 
            />

            {/* MODAL DETALLES (Info) */}
            <PackageDetailsModal 
                isOpen={detailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                pkg={selectedPackage}
            />

            {/* --- MODALES DE CONFIRMACIÓN --- */}

            {/* 1. Confirmar STATUS (Activo/Inactivo) */}
            <ConfirmationModal
                isOpen={isStatusModalOpen}
                onClose={() => { setIsStatusModalOpen(false); setPackageToToggle(null); }}
                onConfirm={confirmStatusChange}
                title={packageToToggle?.status ? "¿Desactivar Paquete?" : "¿Activar Paquete?"}
                message={packageToToggle?.status 
                    ? `Al desactivar "${packageToToggle.name}", dejará de ser elegible para ventas.` 
                    : `El paquete "${packageToToggle?.name}" volverá a estar operativo.`}
                confirmText={packageToToggle?.status ? "Sí, Desactivar" : "Sí, Activar"}
                variant={packageToToggle?.status ? "warning" : "primary"}
                isLoading={statusMutation.isPending}
            />

            {/* 2. Confirmar VISIBILIDAD (Público/Privado) */}
            <ConfirmationModal
                isOpen={isVisibilityModalOpen}
                onClose={() => { setIsVisibilityModalOpen(false); setPackageToToggle(null); }}
                onConfirm={confirmVisibilityChange}
                title={packageToToggle?.isPublic ? "¿Ocultar Paquete?" : "¿Publicar Paquete?"}
                message={packageToToggle?.isPublic 
                    ? `El paquete "${packageToToggle.name}" dejará de ser visible en la web pública.` 
                    : `El paquete "${packageToToggle?.name}" será visible para todos los clientes.`}
                confirmText={packageToToggle?.isPublic ? "Sí, Ocultar" : "Sí, Publicar"}
                variant={packageToToggle?.isPublic ? "warning" : "primary"}
                isLoading={visibilityMutation.isPending}
            />

            {/* 3. Confirmar ELIMINAR */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => { setIsDeleteModalOpen(false); setPackageToToggle(null); }}
                onConfirm={confirmDelete}
                title="¿Eliminar Paquete?"
                message={`Estás a punto de eliminar "${packageToToggle?.name}". Esta acción no se puede deshacer.`}
                confirmText="Sí, Eliminar"
                variant="danger"
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
};