import { useState, useMemo } from 'react';
import { Search, Hash, Users, Calendar, Eye, DollarSign } from 'lucide-react';

// Hooks y Servicios
import { useQuery } from '@tanstack/react-query';
import { getMyReservations } from '../services/reservationService';
import { useParameters } from '../../../hooks/useParameters';
import { PARAM_CATEGORIES } from '../../../config/constants';
import { useCheckPermission } from '../../../hooks/useCheckPermission';
import { PERMISSIONS } from '../../../config/permissions';

// UI Components
import { TravesiaTable, Column } from '../../../components/ui/TravesiaTable';
import { TravesiaInput } from '../../../components/ui/TravesiaInput';
import { TravesiaSelect } from '../../../components/ui/TravesiaSelect';
import { TravesiaBadge } from '../../../components/ui/TravesiaBadge';
import { ReservationDetailModal } from '../components/ReservationDetailModal';

// Types
import type { ReservationResponse } from '../types';

export const ReservationsPage = () => {
    // 1. DATA FETCHING
    const { data: reservations = [], isLoading } = useQuery({
        queryKey: ['my-reservations'],
        queryFn: getMyReservations
    });

    // Cargar estados de reserva para el filtro
    const { parameters: reservationStatuses, isLoading: loadingStatuses } = 
        useParameters(PARAM_CATEGORIES.RESERVATION_STATUS || 'RESERVATION_STATUS');

    // 2. PERMISOS
    const canManageCommissions = useCheckPermission(PERMISSIONS.SALES.MANAGE_COMMISSIONS);

    // 3. FILTROS LOCALES
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('');

    const filteredReservations = useMemo(() => {
        return reservations.filter(res => {
            const term = searchTerm.toLowerCase();
            const matchesSearch = 
                res.reservationCode.toLowerCase().includes(term) ||
                res.packageName.toLowerCase().includes(term) ||
                res.clients.some(c => c.fullName.toLowerCase().includes(term)) ||
                res.userNameSeller?.toLowerCase().includes(term);

            const matchesStatus = filterStatus === ''
                ? true
                : res.statusCode === Number(filterStatus);

            return matchesSearch && matchesStatus;
        });
    }, [reservations, searchTerm, filterStatus]);

    // 4. ESTADOS PARA MODALES
    const [selectedReservation, setSelectedReservation] = useState<ReservationResponse | null>(null);

    // 5. LÓGICA DE COLORES POR FILA (Basado en statusCode)
    const getRowClassName = (row: ReservationResponse) => {
        const code = row.statusCode;switch (code) {
        case 101: return '!bg-warning/10 border-l-4 border-l-warning'; 
        case 102: return '!bg-success/10 border-l-4 border-l-success';
        case 103: return '!bg-error/10 border-l-4 border-l-error opacity-70';
        case 104: return '!bg-orange-500/10 border-l-4 border-l-orange-500'; // Expirado
        case 105: return '!bg-info/10 border-l-4 border-l-info';           // Completado
        default: return '';
        }
    };

    // 6. DEFINICIÓN DE COLUMNAS
    const columns: Column<ReservationResponse>[] = [
        {
            header: 'Reserva',
            accessorKey: 'reservationCode',
            render: (row) => (
                <div className="flex flex-col">
                    <span className="font-mono font-extrabold text-primary flex items-center gap-1">
                        <Hash size={14} /> {row.reservationCode}
                    </span>
                    <span className="text-[10px] opacity-60 flex items-center gap-1">
                        <Calendar size={12} /> {new Date(row.reservationDate).toLocaleDateString()}
                    </span>
                </div>
            )
        },
        {
        header: 'Ganancia',
        render: (row: ReservationResponse) => (
            <div className="flex flex-col">
                {/* ✅ Solo muestra el username si tiene el permiso de gestión */}
                {canManageCommissions && (
                    <span className="text-xs font-bold text-base-content/70">
                        @{row.userNameSeller}
                    </span>
                )}
                
                {/* ✅ La comisión se muestra siempre (es su propia ganancia si es vendedor) */}
                <div className="flex items-center text-success text-[18px] font-mono font-bold bg-success/10 w-fit px-1.5 rounded mt-0.5">
                    <DollarSign size={18} />
                    <span>{row.commissionSeller.toFixed(2)}</span>
                </div>
            </div>
            )
        },
        {
            header: 'Paquete / Pasajeros',
            render: (row) => (
                <div className="max-w-[250px]">
                    <div className="text-xs font-bold truncate" title={row.packageName}>{row.packageName}</div>
                    <div className="flex items-center gap-1 text-[10px] opacity-70 mt-1">
                        <Users size={12} />
                        <span>{row.clients.length} cliente(s): </span>
                        <span className="italic truncate">
                            {row.clients.map(c => c.fullName.split(' ')[0]).join(', ')}
                        </span>
                    </div>
                </div>
            )
        },
        {
            header: 'Inversión Total',
            render: (row) => (
                <div className="font-mono text-right pr-4">
                    <div className="text-sm font-bold">Bs. {row.totalPrice.toFixed(2)}</div>
                    {row.clients.some(c => c.pendingAmount > 0) && (
                        <div className="text-[9px] text-error font-bold italic">
                            Saldo pendiente
                        </div>
                    )}
                </div>
            )
        },
        {
            header: 'Estado',
            render: (row) => (
                <TravesiaBadge 
                    label={row.statusName} 
                    code={row.statusCode} 
                    type="RESERVATION_STATUS" 
                />
            )
        },
        {
            header: 'Acciones',
            className: 'text-right',
            render: (row) => (
                <button 
                    className="btn btn-circle btn-ghost btn-sm text-info hover:bg-info/20"
                    onClick={() => setSelectedReservation(row)}
                >
                    <Eye size={18} />
                </button>
            )
        }
    ];

    return (
        <div className="p-6 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-base-content">Control de Reservaciones</h1>
                    <p className="text-sm text-base-content/60">Monitoreo de ventas, pagos y comisiones de vendedores.</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-base-100 p-4 rounded-xl shadow-sm border border-base-200">
                <div className="md:col-span-1">
                    <TravesiaInput 
                        label="Búsqueda Inteligente" 
                        placeholder="Código, paquete o cliente..." 
                        icon="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div>
                    <TravesiaSelect 
                        label="Estado de Reserva"
                        options={reservationStatuses.map(st => ({ value: st.numericCode, label: st.name }))}
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        placeholder="Todos los estados"
                        isLoading={loadingStatuses}
                        enableDefaultOption
                    />
                </div>
            </div>

            {/* Tabla Principal */}
            <TravesiaTable 
                data={filteredReservations} 
                columns={columns} 
                isLoading={isLoading}
                rowClassName={getRowClassName} 
            />

            {/* Modal de Detalle */}
            {selectedReservation && (
                <ReservationDetailModal 
                    reservation={selectedReservation} 
                    onClose={() => setSelectedReservation(null)} 
                />
            )}
        </div>
    );
};