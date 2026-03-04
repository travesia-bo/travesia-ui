import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Mail, Phone, Target, CheckCircle2 } from 'lucide-react';

// Servicios y Tipos
import { getSellers } from '../services/sellerService';
import type { SellerResponse } from '../types/index';
import { useToast } from '../../../context/ToastContext';

// UI Components
import { TravesiaTable, type Column } from '../../../components/ui/TravesiaTable';
import { TravesiaInput } from '../../../components/ui/TravesiaInput';
import { TravesiaSelect } from '../../../components/ui/TravesiaSelect';
import { CrudButtons, BtnCreate } from '../../../components/ui/CrudButtons';
import { StatusBadge } from '../../../components/ui/StatusBadge';

import { SellerFormModal } from '../components/SellerFormModal';

export const SellerPage = () => {
    const { error: toastError } = useToast();

    // 1. Data Fetching
    const { data: sellers = [], isLoading, isError } = useQuery({
        queryKey: ['sellers'],
        queryFn: getSellers
    });

    if (isError) toastError("Error al cargar los vendedores.");

    // 2. Filtros (Estado Local)
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterExempt, setFilterExempt] = useState<string>('');

    // 3. Lógica de Filtrado Local
    const filteredSellers = useMemo(() => {
        return sellers.filter(seller => {
            const matchesSearch = 
                seller.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                seller.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                seller.identityCard.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = filterStatus === '' 
                ? true 
                : seller.userStatusCode === Number(filterStatus);
                
            const matchesExempt = filterExempt === '' 
                ? true 
                : seller.isCommissionExempt.toString() === filterExempt;

            return matchesSearch && matchesStatus && matchesExempt;
        });
    }, [sellers, searchTerm, filterStatus, filterExempt]);

    // 4. Handlers (Listos para implementar modales)
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingSeller, setEditingSeller] = useState<SellerResponse | null>(null);

    const handleCreate = () => {
        setEditingSeller(null);
        setIsFormModalOpen(true);
    };

    const handleEdit = (seller: SellerResponse) => {
        setEditingSeller(seller);
        setIsFormModalOpen(true);
    };
    const handleDeleteClick = (seller: SellerResponse) => {
        // TODO: setSellerToToggle(seller); setIsDeleteModalOpen(true);
        console.log("Eliminar vendedor:", seller.id);
    };

    // 5. Definición de Columnas
    const columns: Column<SellerResponse>[] = [
        {
            header: 'Vendedor',
            accessorKey: 'fullName',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full text-primary hidden sm:block">
                        <Users size={18} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-base-content">{row.fullName}</span>
                        <div className="flex items-center gap-2 text-xs text-base-content/60">
                            <span className="font-mono">@{row.username}</span>
                            <span>•</span>
                            <span>CI: {row.identityCard}</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: 'Contacto',
            render: (row) => (
                <div className="flex flex-col gap-1 py-1 text-sm">
                    <span className="flex items-center gap-2">
                        <Phone size={14} className="text-secondary" />
                        {row.phoneNumber}
                    </span>
                    <span className="flex items-center gap-2 opacity-70 text-xs">
                        <Mail size={14} />
                        {row.email}
                    </span>
                </div>
            )
        },
        {
            header: 'Metas / Comisiones',
            render: (row) => (
                <div className="flex flex-col gap-1">
                    {row.isCommissionExempt ? (
                        <div className="flex items-center gap-1 text-info text-xs font-bold bg-info/10 w-fit px-2 py-1 rounded">
                            <CheckCircle2 size={14} /> Exento de Metas
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-1 text-xs opacity-70">
                                <Target size={14} className="text-warning"/>
                                Tipo Meta: {row.targetTypeName}
                            </div>
                            <div className="font-mono font-bold text-sm">
                                Objetivo: {row.targetValue}
                            </div>
                        </>
                    )}
                </div>
            )
        },
        {
            header: 'Estado',
            className: 'text-center',
            render: (row) => (
                // Reutilizamos tu StatusBadge
                <StatusBadge 
                    statusName={row.userStatusName} 
                    statusCode={row.userStatusCode} 
                />
            )
        },
        {
            header: 'Acciones',
            className: 'text-right w-24',
            render: (row) => (
                <CrudButtons 
                    onEdit={() => handleEdit(row)} 
                    onDelete={() => handleDeleteClick(row)} 
                />
            )
        }
    ];

    return (
        <div className="p-6 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-base-content">Equipo de Ventas</h1>
                    <p className="text-sm text-base-content/60">Gestiona vendedores, accesos y metas comerciales.</p>
                </div>
                <BtnCreate onClick={handleCreate} label="Nuevo Vendedor" />
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-base-100 p-4 rounded-xl shadow-sm border border-base-200">
                <div className="md:col-span-2">
                    <TravesiaInput 
                        label="Buscar Vendedor" 
                        placeholder="Nombre, usuario o CI..." 
                        icon="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div>
                    <TravesiaSelect 
                        label="Exención de Metas"
                        options={[
                            { value: 'true', label: "Exentos" },
                            { value: 'false', label: "Con Metas" }
                        ]}
                        value={filterExempt}
                        onChange={(e) => setFilterExempt(e.target.value)}
                        placeholder="Todos"
                        enableDefaultOption
                    />
                </div>
                <div>
                    <TravesiaSelect 
                        label="Estado de Usuario"
                        options={[
                            { value: 111, label: "Activo" }, // Asumiendo que 111 es activo (ajusta según tu BD)
                            { value: 112, label: "Inactivo" }
                        ]}
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        placeholder="Todos los estados"
                        enableDefaultOption
                    />
                </div>
            </div>

            {/* Tabla */}
            <TravesiaTable 
                data={filteredSellers} 
                columns={columns} 
                isLoading={isLoading} 
            />

            {/* Modal Crear/Editar */}
            {isFormModalOpen && (
                <SellerFormModal
                    isOpen={isFormModalOpen}
                    onClose={() => setIsFormModalOpen(false)}
                    sellerToEdit={editingSeller}
                />
            )}

            {/* <SellerFormModal isOpen={...} onClose={...} sellerToEdit={...} /> */}
            {/* <ConfirmationModal isOpen={...} onClose={...} /> */}
        </div>
    );
};