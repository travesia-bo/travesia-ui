import { useState, useMemo } from 'react';
import { useProviders } from '../hooks/useProviders';
import { useCities } from '../../../hooks/useCities';
import { useParameters } from '../../../hooks/useParameters';
import { PARAM_CATEGORIES } from '../../../config/constants';
// Imports renombrados a Travesia
import { TravesiaTable, Column } from '../../../components/ui/TravesiaTable'; // Antes ComerziaTable
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { TravesiaInput } from '../../../components/ui/TravesiaInput';       // Antes ComerziaInput
import { TravesiaSelect } from '../../../components/ui/TravesiaSelect';     // Antes ComerziaSelect
import { TravesiaButton } from '../../../components/ui/TravesiaButton';     // Antes ComerziaButton
import { CrudButtons, BtnCreate } from '../../../components/ui/CrudButtons';           // ¡Ahora sí existe!
import { IconRenderer } from '../../../components/ui/IconRenderer';
import { Provider } from '../types';
import { ProviderFormModal } from '../components/ProviderFormModal';
import { useMutation, useQueryClient } from '@tanstack/react-query'; // Importar
import { deleteProvider } from '../services/providerService'; // Importar servicio delete

export const ProvidersPage = () => {
    // 1. Fetching de Datos
    const { data: providers = [], isLoading: loadingProviders } = useProviders();
    const { data: cities = [], isLoading: loadingCities } = useCities();
    const { parameters: statuses, isLoading: loadingStatuses } = useParameters(PARAM_CATEGORIES.PROVIDER_STATUS);

    // 2. Estados locales para filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCityId, setSelectedCityId] = useState<string>('');
    const [selectedStatusCode, setSelectedStatusCode] = useState<string>('');

    // 3. Lógica de Filtrado
    const filteredProviders = useMemo(() => {
        return providers.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  p.contactFullName.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesCity = selectedCityId ? p.cityName === cities.find(c => c.id === Number(selectedCityId))?.name : true; 
            const matchesStatus = selectedStatusCode ? p.statusCode === Number(selectedStatusCode) : true;

            return matchesSearch && matchesStatus && (!selectedCityId || matchesCity); 
        });
    }, [providers, searchTerm, selectedCityId, selectedStatusCode, cities]);


    const queryClient = useQueryClient();

    // 1. MUTATION PARA ELIMINAR
    const deleteMutation = useMutation({
        mutationFn: deleteProvider,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['providers'] });
            // toast.success("Proveedor eliminado");
        },
        onError: (error) => {
            alert("No se pudo eliminar el proveedor. Puede que tenga registros asociados.");
        }
    });

    // 2. FUNCIÓN MANEJADORA DE ELIMINACIÓN
    const handleDelete = (id: number) => {
        // Confirmación simple del navegador (luego podemos hacer un modal bonito)
        if (window.confirm("¿Estás seguro de eliminar este proveedor? Esta acción no se puede deshacer.")) {
            deleteMutation.mutate(id);
        }
    };
    
    // 4. Definición de Columnas Actualizada
    const columns: Column<Provider>[] = [
        { 
            header: 'Proveedor', 
            accessorKey: 'name', 
            className: 'font-bold text-base-content' 
        },
        // NUEVA COLUMNA: Dirección
        { 
            header: 'Dirección', 
            accessorKey: 'address', 
            className: 'w-1/4 text-xs opacity-80' // Un poco más pequeña para que no ocupe todo
        },
        { 
            header: 'Ciudad', 
            accessorKey: 'cityName' 
        },
        // COLUMNA CONTACTO MEJORADA (Con Email)
        { 
            header: 'Contacto', 
            render: (row) => (
                <div className="flex flex-col gap-1 py-1">
                    <span className="font-medium text-sm">{row.contactFullName}</span>
                    
                    {/* Teléfono e Email agrupados */}
                    <div className="flex flex-col gap-0.5 text-xs opacity-70">
                        <span className="flex items-center gap-1.5">
                            <IconRenderer iconName="phone" size={12}/> 
                            {row.contactPhoneNumber}
                        </span>
                        
                        {/* Renderizado condicional del correo si existe */}
                        {row.contactEmail && (
                            <span className="flex items-center gap-1.5 text-primary font-medium">
                                <IconRenderer iconName="mail" size={12}/> 
                                {row.contactEmail}
                            </span>
                        )}
                    </div>
                </div>
            )
        },
        { 
            header: 'Estado', 
            render: (row) => (
                <StatusBadge statusName={row.statusName} statusCode={row.statusCode} />
            )
        },
        { 
            header: 'Acciones', 
            className: 'w-24 text-right', 
            render: (row) => (
                <CrudButtons 
                    // CONECTAMOS EDITAR
                    onEdit={() => {
                        setEditingProvider(row); // Cargamos el proveedor clickeado
                        setIsModalOpen(true);    // Abrimos modal
                    }}
                    // CONECTAMOS ELIMINAR
                    onDelete={() => handleDelete(row.id)}
                />
            )
        }
    ];

    // ... estados ...
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState<Provider | null>(null);

    // ✅ ESTA ES LA FUNCIÓN CLAVE
    const handleCreate = () => {
        setEditingProvider(null); // NULL indica "Modo Crear"
        setIsModalOpen(true);     // Abre el Modal
    };

    return (
        <div className="p-6 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-base-content">Proveedores</h1>
                    <p className="text-sm text-base-content/60">Gestión de hoteles, alojamientos y servicios.</p>
                </div>
                <BtnCreate 
                    onClick={handleCreate}
                />
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-base-100 p-4 rounded-xl shadow-sm border border-base-200">
                <div className="md:col-span-2">
                    <TravesiaInput 
                        label="Buscar" 
                        placeholder="Nombre, contacto..." 
                        icon="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div>
                    <TravesiaSelect 
                        label="Ciudad"
                        name="city"
                        options={cities.map(c => ({ value: c.id, label: c.name }))}
                        value={selectedCityId}
                        onChange={(e) => setSelectedCityId(e.target.value)}
                        placeholder="Todas las ciudades"
                        isLoading={loadingCities}
                        enableDefaultOption
                    />
                </div>
                <div>
                    <TravesiaSelect 
                        label="Estado"
                        name="status"
                        options={statuses.map(s => ({ value: s.numericCode, label: s.name }))}
                        value={selectedStatusCode}
                        onChange={(e) => setSelectedStatusCode(e.target.value)}
                        placeholder="Todos los estados"
                        isLoading={loadingStatuses}
                        enableDefaultOption
                    />
                </div>
            </div>

            {/* Tabla Modular */}
            <TravesiaTable 
                data={filteredProviders} 
                columns={columns} 
                isLoading={loadingProviders} 
            />
        
        
            {isModalOpen && (
                <ProviderFormModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                providerToEdit={editingProvider}
                />
            )}
        </div>
    );
};