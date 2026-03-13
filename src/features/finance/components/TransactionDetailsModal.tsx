import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Wallet, FileText, User, Package, Hash } from "lucide-react";
import { TravesiaModal } from "../../../components/ui/TravesiaModal";
import { TravesiaBadge } from "../../../components/ui/TravesiaBadge";
import type { TransactionResponse } from "../types/index";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    transaction: TransactionResponse | null;
}

export const TransactionDetailsModal = ({ isOpen, onClose, transaction }: Props) => {
    if (!transaction) return null;

    // Calcular el total aplicado para verificar que cuadre (opcional, por seguridad visual)
    const totalApplied = transaction.applications.reduce((sum, app) => sum + app.appliedAmount, 0);

    return (
        <TravesiaModal
            isOpen={isOpen}
            onClose={onClose}
            closeOnOutsideClick={true}
            title={
                <div className="flex items-center gap-2">
                    <Wallet className="text-primary" />
                    <span>Detalle de Transacción #{transaction.id}</span>
                </div>
            }
            size="lg"
        >
            <div className="space-y-6">
                
                {/* --- 1. CABECERA RESUMEN --- */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-base-200/50 p-4 rounded-xl border border-base-200">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold opacity-60">Monto Total</span>
                        <span className="font-mono font-bold text-lg text-primary">
                            Bs. {transaction.amount.toFixed(2)}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold opacity-60">Fecha</span>
                        <span className="text-sm font-medium">
                            {format(new Date(transaction.transactionDate), "dd MMM yyyy", { locale: es })}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold opacity-60">Método</span>
                        <TravesiaBadge 
                            code={transaction.paymentMethodCode} 
                            label={transaction.paymentMethodName} 
                            type="PAYMENT_METHOD" 
                            className="scale-90 origin-left mt-1"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold opacity-60">Estado</span>
                        <TravesiaBadge 
                            code={transaction.statusCode} 
                            label={transaction.statusName} 
                            type="TRANSACTION_STATUS" 
                            className="scale-90 origin-left mt-1"
                        />
                    </div>
                </div>

                {transaction.bankReference && (
                    <div className="bg-info/10 text-info-content p-3 rounded-lg flex items-center gap-3 text-sm">
                        <FileText size={16} />
                        <div>
                            <span className="font-bold mr-2">Referencia:</span>
                            <span className="font-mono">{transaction.bankReference}</span>
                        </div>
                    </div>
                )}

                {/* --- 2. LISTA DE APLICACIONES (DESGLOSE) --- */}
                <div>
                    <h3 className="font-bold text-sm mb-3 text-base-content/80 flex items-center justify-between">
                        <span>Desglose de Aplicación</span>
                        <span className="text-xs font-normal">
                            Total Aplicado: <span className="font-mono font-bold">Bs. {totalApplied.toFixed(2)}</span>
                        </span>
                    </h3>

                    {transaction.applications.length === 0 ? (
                        <div className="text-center py-6 bg-base-200 rounded-xl opacity-60 text-sm">
                            Esta transacción aún no ha sido aplicada a ninguna deuda.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {transaction.applications.map((app) => (
                                <div key={app.appliedPaymentId} className="flex flex-col md:flex-row items-start md:items-center justify-between p-3 border border-base-200 rounded-xl shadow-sm bg-base-100 gap-3">
                                    
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 font-bold text-sm">
                                            <User size={14} className="text-primary shrink-0"/>
                                            <span className="truncate">{app.clientFullName}</span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs opacity-70 mt-1">
                                            <span className="flex items-center gap-1">
                                                <Package size={12}/> {app.packageName}
                                            </span>
                                            <span className="flex items-center gap-1 font-mono">
                                                <Hash size={12}/> {app.reservationCode}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="font-mono font-black text-success whitespace-nowrap bg-success/10 px-3 py-1.5 rounded-lg shrink-0">
                                        Bs. {app.appliedAmount.toFixed(2)}
                                    </div>
                                    
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </TravesiaModal>
    );
};