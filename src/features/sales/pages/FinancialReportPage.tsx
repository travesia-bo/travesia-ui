// src/features/sales/pages/FinancialReportPage.tsx
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, Wallet, User } from 'lucide-react';

// Servicios y Tipos
import { getFinancialReports } from '../services/financialService';
import type { ClientFinancialReportResponse } from '../types';

// UI Components
import { TravesiaTable, type Column } from '../../../components/ui/TravesiaTable';
import { TravesiaInput } from '../../../components/ui/TravesiaInput';
import { BtnCreate } from '../../../components/ui/CrudButtons';
import { PaymentHistoryModal } from '../components/PaymentHistoryModal';
// import { useToast } from '../../../context/ToastContext';
import { PaymentRegistrationModal } from '../components/PaymentRegistrationModal';

export const FinancialReportPage = () => {
    // const { success, error: toastError } = useToast();
    
    // 1. Data Fetching
    const { data: reports = [], isLoading } = useQuery({
        queryKey: ['financial-reports'],
        queryFn: getFinancialReports
    });

    // 2. Estado Local
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReport, setSelectedReport] = useState<ClientFinancialReportResponse | null>(null);

    // 3. Filtrado
    const filteredReports = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return reports.filter(r => 
            r.clientFullName.toLowerCase().includes(term) ||
            r.packageName.toLowerCase().includes(term)
        );
    }, [reports, searchTerm]);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); 

    // 4. Handlers
    const handleCreatePayment = () => {
        setIsCreateModalOpen(true); 
    };
    // const handleEdit = (row: ClientFinancialReportResponse) => {
    //     // TODO: Lógica de edición
    //     success(`Editar pagos de ${row.clientFullName}`);
    // };

    // const handleDelete = (_row: ClientFinancialReportResponse) => {
    //     // TODO: Lógica de borrado (quizás borrar el último pago?)
    //     toastError("Función de eliminar no implementada aún");
    // };

    // 5. Columnas
    const columns: Column<ClientFinancialReportResponse>[] = [
    {
            header: 'Cliente',
            accessorKey: 'clientFullName',
            render: (row) => (
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <User size={16} className="text-primary" />
                        <span className="font-bold text-base-content">{row.clientFullName}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Paquete',
            accessorKey: 'packageName',
            render: (row) => (
                <div className="max-w-[200px] truncate text-xs font-medium" title={row.packageName}>
                    {row.packageName}
                </div>
            )
        },
        {
            header: 'Progreso Pago',
            render: (row) => {
                // Cálculo de porcentaje para barra de progreso visual
                const percentage = Math.min((row.totalPaid / row.agreedPrice) * 100, 100);
                return (
                    <div className="flex flex-col gap-1 w-32">
                        <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-success font-bold">Bs. {row.totalPaid.toFixed(0)}</span>
                            <span className="opacity-50">/ {row.agreedPrice.toFixed(0)}</span>
                        </div>
                        <progress 
                            className={`progress progress-xs w-full ${percentage >= 100 ? 'progress-success' : 'progress-primary'}`} 
                            value={percentage} 
                            max="100"
                        ></progress>
                    </div>
                )
            }
        },
        {
            header: 'Saldo',
            render: (row) => (
                <div className="font-mono text-left font-bold">
                    {row.balance > 0 ? (
                        <span className="text-error">Bs. {row.balance.toFixed(2)}</span>
                    ) : (
                        <span className="text-success text-xs bg-success/10 px-2 py-1 rounded-full">Completado</span>
                    )}
                </div>
            )
        },
        {
            header: '',
            className: 'text-right',
            render: (row) => (
                <div className="flex justify-end gap-2">
                    {/* Botón Ver (Ojo) */}
                    <button 
                        className="btn btn-circle btn-ghost btn-sm text-info hover:bg-info/20"
                        onClick={() => setSelectedReport(row)}
                        title="Ver historial de pagos"
                    >
                        <Eye size={18} />
                    </button>

                    {/* Botones CRUD Standard (Editar / Borrar) */}
                    {/* <CrudButtons 
                        onEdit={() => handleEdit(row)}
                        onDelete={() => handleDelete(row)}
                        // Ocultamos delete si no hay pagos para borrar, por ejemplo
                        // disabledDelete={row.paymentHistory.length === 0}
                    /> */}
                </div>
            )
        }
    ];

    return (
        <div className="p-6 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-base-content flex items-center gap-2">
                        <Wallet className="text-primary" /> 
                        Reporte Financiero
                    </h1>
                    <p className="text-sm text-base-content/60">Gestiona transacciones, cobros y saldos de clientes.</p>
                </div>
                
                {/* Botón Adicionar Pago */}
                <BtnCreate 
                    label="Registrar Pago" 
                    onClick={handleCreatePayment} 
                />
            </div>

            {/* Filtros */}
            <div className="bg-base-100 p-4 rounded-xl shadow-sm border border-base-200">
                <div className="w-full md:w-1/3">
                    <TravesiaInput 
                        label="Buscar Cliente" 
                        placeholder="Nombre del cliente o paquete..." 
                        icon="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabla */}
            <TravesiaTable 
                data={filteredReports} 
                columns={columns} 
                isLoading={isLoading}
            />

            {/* Modal de Detalle */}
            <PaymentHistoryModal 
                report={selectedReport} 
                onClose={() => setSelectedReport(null)} 
            />

            {/* Modal de Creación de Pago (Nuevo) */}
            <PaymentRegistrationModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
            />
        </div>
    );
};