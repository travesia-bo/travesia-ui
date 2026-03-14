import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Wallet, Eye } from "lucide-react";

// Componentes Reutilizables
import { TravesiaTable, type Column } from "../../../components/ui/TravesiaTable";
import { TravesiaBadge } from "../../../components/ui/TravesiaBadge";
import { CrudButtons } from "../../../components/ui/CrudButtons";
import { ConfirmationModal } from "../../../components/ui/ConfirmationModal";
import { useToast } from "../../../context/ToastContext";

// Configuración y Servicios
import { getTransactions, deleteTransaction } from "../services/transactionService";
import type { TransactionResponse } from "../types";

import { TransactionFormModal } from "../components/TransactionFormModal";
import { TransactionDetailsModal } from "../components/TransactionDetailsModal";

export const IncomePage = () => {
    const { success, error: toastError } = useToast();
    const queryClient = useQueryClient();

    // Estados Modal Edición
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState<TransactionResponse | null>(null);
    
    // Estados Modal Detalles (Ojo)
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [transactionToView, setTransactionToView] = useState<TransactionResponse | null>(null);

    // ✅ NUEVOS ESTADOS: Modal de Eliminación
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState<TransactionResponse | null>(null);

    const { data: transactions = [], isLoading } = useQuery({
        queryKey: ['finance', 'income'],
        queryFn: getTransactions,
        staleTime: 1000 * 60 * 5, 
    });

    // ✅ MUTACIÓN PARA ELIMINAR
    const deleteMutation = useMutation({
        mutationFn: deleteTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance', 'income'] });
            setIsDeleteModalOpen(false);
            setTransactionToDelete(null);
            success("Transacción eliminada correctamente");
        },
        onError: (err: any) => {
            console.error(err);
            toastError("No se pudo eliminar la transacción. Puede que ya esté aplicada a un cobro.");
            setIsDeleteModalOpen(false);
        }
    });
    
    // Handlers
    const handleEdit = (transaction: TransactionResponse) => {
        setTransactionToEdit(transaction);
        setIsEditModalOpen(true);
    };

    const handleViewDetails = (transaction: TransactionResponse) => {
        setTransactionToView(transaction);
        setIsDetailsModalOpen(true);
    };

    // ✅ HANDLERS DE ELIMINACIÓN
    const handleDeleteClick = (transaction: TransactionResponse) => {
        setTransactionToDelete(transaction);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (transactionToDelete) {
            deleteMutation.mutate(transactionToDelete.id);
        }
    };

    const columns: Column<TransactionResponse>[] = [
        { 
            header: "Fecha y Hora", 
            render: (row) => (
                <div className="flex flex-col">
                    {/* ✅ Formato exacto del banco + fuente monoespaciada para alinear números */}
                    <span className="font-bold text-sm font-mono text-base-content/90">
                        {format(new Date(row.transactionDate), "dd/MM/yyyy HH:mm:ss")}
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
            className: "text-right w-36", 
            render: (row) => (
                <div className="flex items-center justify-end gap-2">
                    {/* Botón Detalles */}
                    <button 
                        className="btn btn-square btn-sm btn-ghost text-info hover:bg-info/10"
                        onClick={() => handleViewDetails(row)}
                        title="Ver desglose de aplicación"
                    >
                        <Eye size={18} />
                    </button>
                    
                    <CrudButtons 
                        onEdit={() => handleEdit(row)}
                        // ✅ CONECTAMOS EL BOTÓN DE ELIMINAR
                        onDelete={() => handleDeleteClick(row)} 
                    />
                </div>
            )
        }
    ];

    return (
        <div className="p-6 space-y-6 animate-fade-in">
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
                {/* <BtnExcel /> */}
            </div>

            {/* Tabla */}
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

            {/* Modal de Detalles */}
            <TransactionDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => { setIsDetailsModalOpen(false); setTransactionToView(null); }}
                transaction={transactionToView}
            />

            {/* ✅ MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => { setIsDeleteModalOpen(false); setTransactionToDelete(null); }}
                onConfirm={confirmDelete}
                title="¿Eliminar Transacción?"
                message={
                    <>
                        Estás a punto de eliminar permanentemente la transacción por <span className="font-bold">Bs. {transactionToDelete?.amount.toFixed(2)}</span>.
                        <br/><br/>
                        <span className="text-error font-bold">¡Atención!</span> Si esta transacción ya fue aplicada a una o más reservas, esas reservas perderán este pago y volverán a figurar como deuda.
                    </>
                }
                confirmText="Sí, Eliminar"
                variant="danger" // Botón rojo
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
};

export default IncomePage;