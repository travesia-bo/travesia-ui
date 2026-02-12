import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Wallet } from "lucide-react";
// import { ExternalLink, ImageOff } from "lucide-react";

// Componentes Reutilizables
import { TravesiaTable, type Column } from "../../../components/ui/TravesiaTable";
import { TravesiaBadge } from "../../../components/ui/TravesiaBadge";
import { BtnExcel, CrudButtons } from "../../../components/ui/CrudButtons";

// Configuración y Servicios
import { getTransactions } from "../services/transactionService";
import { getBadgeStyle } from "../../../config/badgeConfig";
import type { TransactionResponse } from "../types";

import { TransactionFormModal } from "../components/TransactionFormModal";


export const IncomePage = () => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState<TransactionResponse | null>(null);
    
    const { data: transactions = [], isLoading } = useQuery({
        queryKey: ['finance', 'income'],
        queryFn: getTransactions,
        staleTime: 1000 * 60 * 5, // 5 min cache
    });
    
    // ✅ Handler para abrir edición
    const handleEdit = (transaction: TransactionResponse) => {
        setTransactionToEdit(transaction);
        setIsEditModalOpen(true);
    };

    // Definición de Columnas para TravesiaTable
    const columns: Column<TransactionResponse>[] = [
        { 
            header: "Fecha", 
            render: (row) => (
                <div className="flex flex-col">
                    <span className="font-bold text-sm">
                        {format(new Date(row.transactionDate), "dd MMM, yyyy", { locale: es })}
                    </span>
                    <span className="text-xs opacity-60">
                        {format(new Date(row.transactionDate), "HH:mm a")}
                    </span>
                </div>
            )
        },
        { 
            header: "Método Pago", 
            accessorKey: "paymentMethodName",
            render: (row) => (
                <div className="badge badge-sm badge-outline opacity-80">
                    {row.paymentMethodName}
                </div>
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
                    className={getBadgeStyle('TRANSACTION_STATUS', row.statusCode)}
                >
                    {row.statusName}
                </TravesiaBadge>
            )
        },
        // { 
        //     header: "Comprobante", 
        //     render: (row) => row.proofUrl ? (
        //         <a 
        //             href={row.proofUrl} 
        //             target="_blank" 
        //             rel="noopener noreferrer" 
        //             className="btn btn-xs btn-ghost gap-1 text-primary"
        //         >
        //             <ExternalLink size={14} /> Ver
        //         </a>
        //     ) : (
        //         <span className="opacity-30 flex items-center gap-1 text-xs">
        //             <ImageOff size={14} /> Sin img
        //         </span>
        //     )
        // },
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
            className: "text-right w-32",
            render: (row) => (
                <CrudButtons 
                    onEdit={() => handleEdit(row)}
                    onDelete={() => console.log("Lógica pendiente para borrar ID:", row.id)} 
                />
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
                // Ejemplo de uso de rowClassName si quisieras resaltar filas pendientes
                rowClassName={(row) => row.statusCode === 501 ? "bg-warning/5" : ""}
            />
            {/* ✅ Modal de Edición */}
            {isEditModalOpen && (
                <TransactionFormModal 
                    isOpen={isEditModalOpen}
                    onClose={() => { setIsEditModalOpen(false); setTransactionToEdit(null); }}
                    transactionToEdit={transactionToEdit}
                />
            )}
        </div>
    );
};

export default IncomePage;