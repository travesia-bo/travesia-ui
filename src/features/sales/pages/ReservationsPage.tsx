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
import { RESERVATION_STATUS_ID } from '../../../config/constants';

export const ReservationsPage = () => {
    // 1. DATA FETCHING
    const { data: reservations = [], isLoading } = useQuery({
        queryKey: ['my-reservations'],
        queryFn: getMyReservations
    });

    // Cargar estados de reserva para el filtro
    const { parameters: reservationStatuses, isLoading: loadingStatuses } = 
        useParameters(PARAM_CATEGORIES.RESERVATION_STATUS || 'RESERVATION_STATUS');

    const [filterSeller, setFilterSeller] = useState<string>('');

    const availableSellers = useMemo(() => {
        const sellers = reservations
            .map(res => res.userNameSeller)
            .filter((name): name is string => !!name);
        return Array.from(new Set(sellers)).sort();
    }, [reservations]);

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

            const matchesSeller = filterSeller === ''
                ? true
                : res.userNameSeller === filterSeller;

            return matchesSearch && matchesStatus && matchesSeller;
        });
    }, [reservations, searchTerm, filterStatus, filterSeller]);

    // 3.1 CÁLCULO DE TOTALES (Basado en la lista filtrada)
    const totalCommissions = useMemo(() => {
        return filteredReservations
            .filter(res => res.statusCode === RESERVATION_STATUS_ID.CONFIRMED)
            .reduce((acc, res) => acc + (res.commissionSeller || 0), 0);
    }, [filteredReservations]);

    // 4. ESTADOS PARA MODALES
    const [selectedReservation, setSelectedReservation] = useState<ReservationResponse | null>(null);

    // 5. LÓGICA DE COLORES POR FILA (Basado en statusCode)
    const getRowClassName = (row: ReservationResponse) => {
        const code = row.statusCode;switch (code) {
        case RESERVATION_STATUS_ID.PENDING: return '!bg-warning/10 border-l-4 border-l-warning'; 
        case RESERVATION_STATUS_ID.CONFIRMED: return '!bg-success/10 border-l-4 border-l-success';
        case RESERVATION_STATUS_ID.CANCELLED: return '!bg-error/10 border-l-4 border-l-error opacity-70';
        case RESERVATION_STATUS_ID.EXPIRED: return '!bg-orange-500/10 border-l-4 border-l-orange-500'; // Expirado
        case RESERVATION_STATUS_ID.COMPLETED: return '!bg-info/10 border-l-4 border-l-info';           // Completado
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
                    <span>Bs. {row.commissionSeller.toFixed(2)}</span>
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
        <div className="p-4 md:p-6 space-y-6 animate-fade-in pb-20 md:pb-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-base-content">Control de Reservaciones</h1>
                    <p className="text-xs md:text-sm text-base-content/60">Monitoreo de ventas, pagos y comisiones de vendedores.</p>
                </div>
            </div>

            {/* Filtros */}
            <div className={`grid grid-cols-1 ${canManageCommissions ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4 bg-base-100 p-4 rounded-xl shadow-sm border border-base-200 items-end`}>
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
                
                {/* ✅ FILTRO DE VENDEDOR: Solo visible para quienes pueden gestionar comisiones */}
                {canManageCommissions && (
                    <div className="animate-fade-in">
                        <TravesiaSelect 
                            label="Filtrar por Vendedor"
                            placeholder="Todos los vendedores"
                            options={availableSellers.map(seller => ({ value: seller, label: `@${seller}` }))}
                            value={filterSeller}
                            onChange={(e) => setFilterSeller(e.target.value)}
                            enableDefaultOption
                        />
                    </div>
                )}

                {/* KPI de Ganancia Real - Adaptado Mobile: Se alinea a la derecha en PC, ocupa ancho en móvil si es necesario */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center h-full pb-1 pt-2 md:pt-0 border-t md:border-t-0 border-base-200 mt-2 md:mt-0">
                    <div className="flex items-center gap-1.5 mb-0 md:mb-1">
                        <span className="text-[10px] uppercase font-black opacity-60 tracking-wider">Comisión acumulada</span>
                        <div className="badge badge-success badge-xs outline outline-1 outline-success/20"></div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center justify-end text-success font-mono font-black text-xl md:text-2xl gap-1">
                            <span className="text-sm">Bs.</span>
                            {totalCommissions.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <span className="text-[9px] opacity-50 italic hidden md:block">
                            Calculado sobre {filteredReservations.filter(r => r.statusCode === 102).length} ventas confirmadas
                        </span>
                    </div>
                </div>
            
            </div>

            {/* ✅ VISTA DE ESCRITORIO (Tabla) */}
            <div className="hidden md:block">
                <TravesiaTable 
                    data={filteredReservations} 
                    columns={columns} 
                    isLoading={isLoading}
                    rowClassName={getRowClassName} 
                />
            </div>

            {/* ✅ VISTA MÓVIL (Tarjetas) */}
            <div className="md:hidden space-y-4">
                {isLoading ? (
                    <div className="flex justify-center py-8"><span className="loading loading-dots loading-lg text-primary"></span></div>
                ) : filteredReservations.length === 0 ? (
                    <div className="text-center py-10 opacity-50 italic text-sm">No se encontraron reservas</div>
                ) : (
                    filteredReservations.map(res => (
                        <div 
                            key={res.id}
                            onClick={() => setSelectedReservation(res)}
                            className={`p-4 rounded-xl border shadow-sm active:scale-[0.98] transition-transform cursor-pointer bg-base-100 relative overflow-hidden ${getRowClassName(res)}`}
                        >
                            {/* Header de la Tarjeta */}
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5">
                                        <Hash size={14} className="text-primary" />
                                        <span className="font-mono font-black text-base">{res.reservationCode}</span>
                                    </div>
                                    <span className="text-[10px] opacity-60 flex items-center gap-1">
                                        <Calendar size={10} /> {new Date(res.reservationDate).toLocaleDateString()}
                                    </span>
                                </div>
                                <TravesiaBadge label={res.statusName} code={res.statusCode} type="RESERVATION_STATUS" />
                            </div>

                            {/* Cuerpo de la Tarjeta */}
                            <div className="mb-3">
                                <div className="text-sm font-bold line-clamp-2 leading-tight mb-1">{res.packageName}</div>
                                <div className="flex items-center gap-2 text-[11px] opacity-70">
                                    <Users size={12} /> 
                                    <span>{res.clients.length} pasajero(s)</span>
                                </div>
                            </div>

                            {/* Footer de la Tarjeta (Finanzas) */}
                            <div className="flex justify-between items-end border-t border-base-content/10 pt-3 mt-1">
                                <div className="flex flex-col">
                                    {/* Comisión */}
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase font-bold opacity-40">Mi Ganancia</span>
                                        <div className="flex items-center text-success font-mono font-black text-lg gap-0.5">
                                            <span className="text-xs">Bs.</span>
                                            {res.commissionSeller.toFixed(2)}
                                        </div>
                                    </div>
                                    {/* Vendedor (si aplica) */}
                                    {canManageCommissions && (
                                        <span className="text-[10px] font-bold opacity-50 mt-1">@{res.userNameSeller}</span>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <div className="text-[9px] uppercase font-bold opacity-40">Total</div>
                                        <div className="font-mono font-bold text-sm">Bs. {res.totalPrice.toFixed(2)}</div>
                                    </div>
                                    <button className="btn btn-sm btn-circle btn-ghost bg-base-200 text-info">
                                        <Eye size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

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