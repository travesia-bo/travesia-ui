import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Wallet, Eye } from "lucide-react"; // ✅ Importar Eye

// Componentes Reutilizables
import { TravesiaTable, type Column } from "../../../components/ui/TravesiaTable";
import { TravesiaBadge } from "../../../components/ui/TravesiaBadge";
import { BtnExcel, CrudButtons } from "../../../components/ui/CrudButtons";

// Configuración y Servicios
import { getTransactions } from "../services/transactionService";
import type { TransactionResponse } from "../types";

import { TransactionFormModal } from "../components/TransactionFormModal";
// ✅ IMPORTAR NUEVO MODAL
import { TransactionDetailsModal } from "../components/TransactionDetailsModal";

export const IncomePage = () => {
    // Estados Modal Edición
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState<TransactionResponse | null>(null);
    
    // ✅ Estados Modal Detalles (Ojo)
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [transactionToView, setTransactionToView] = useState<TransactionResponse | null>(null);

    const { data: transactions = [], isLoading } = useQuery({
        queryKey: ['finance', 'income'],
        queryFn: getTransactions,
        staleTime: 1000 * 60 * 5, // 5 min cache
    });
    
    const handleEdit = (transaction: TransactionResponse) => {
        setTransactionToEdit(transaction);
        setIsEditModalOpen(true);
    };

    // ✅ Función para abrir Detalles
    const handleViewDetails = (transaction: TransactionResponse) => {
        setTransactionToView(transaction);
        setIsDetailsModalOpen(true);
    };

    const columns: Column<TransactionResponse>[] = [
        { 
            header: "Fecha", 
            render: (row) => (
                <div className="flex flex-col">
                    <span className="font-bold text-sm">
                        {format(new Date(row.transactionDate), "dd MMM yyyy", { locale: es })}
                    </span>
                </div>
            )
        },
        { 
            header: "Método Pago", 
            accessorKey: "paymentMethodName",
            render: (row) => (
                <TravesiaBadge 
                    code={row.paymentMethodCode}
                    label={row.paymentMethodName}
                    type="PAYMENT_METHOD"
                    className="scale-90 origin-left"
                />
            )
        },
        { 
            header: "Referencia", 
            render: (row) => row.bankReference || <span className="opacity-30 text-xs italic">--</span>,
            className: "font-mono text-xs"
        },
        { 
            header: "Estado", 
            render: (row) => (
                <TravesiaBadge 
                    code={row.statusCode}
                    label={row.statusName}
                    type="TRANSACTION_STATUS"
                    className="scale-90 origin-left"
                />
            )
        },
        { 
            header: "Monto", 
            className: "text-right",
            render: (row) => (
                <span className="font-bold text-base font-mono">
                    {new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(row.amount)}
                </span>
            )
        },
        {
            header: "Acciones",
            className: "text-right w-36", // Un poco más ancho para que entren 3 botones
            render: (row) => (
                <div className="flex items-center justify-end gap-2">
                    {/* ✅ BOTÓN DE DETALLES (OJO) */}
                    <button 
                        className="btn btn-square btn-sm btn-ghost text-info hover:bg-info/10"
                        onClick={() => handleViewDetails(row)}
                        title="Ver desglose de aplicación"
                    >
                        <Eye size={18} />
                    </button>
                    
                    {/* BOTONES CRUD ORIGINALES */}
                    <CrudButtons 
                        onEdit={() => handleEdit(row)}
                        onDelete={() => console.log("Lógica pendiente para borrar ID:", row.id)} 
                    />
                </div>
            )
        }
    ];

    return (
        <div className="p-6 space-y-6 animate-fade-in container mx-auto max-w-7xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-base-200 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-base-content flex items-center gap-2">
                        <Wallet className="text-primary" /> 
                        Transacciones
                    </h1>
                    <p className="text-sm text-base-content/60">
                        Control de flujo de caja y conciliación bancaria.
                    </p>
                </div>
                <BtnExcel />
            </div>

            {/* Tabla Reutilizable */}
            <TravesiaTable
                data={transactions}
                columns={columns}
                isLoading={isLoading}
                rowClassName={(row) => row.statusCode === 501 ? "bg-warning/5" : ""}
            />

            {/* Modal de Edición */}
            {isEditModalOpen && (
                <TransactionFormModal 
                    isOpen={isEditModalOpen}
                    onClose={() => { setIsEditModalOpen(false); setTransactionToEdit(null); }}
                    transactionToEdit={transactionToEdit}
                />
            )}

            {/* ✅ MODAL DE DETALLES */}
            <TransactionDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => { setIsDetailsModalOpen(false); setTransactionToView(null); }}
                transaction={transactionToView}
            />
        </div>
    );
};

export default IncomePage;