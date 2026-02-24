// src/features/sales/components/PaymentHistoryModal.tsx
import { TravesiaModal } from "../../../components/ui/TravesiaModal";
import { type ClientFinancialReportResponse } from "../types";
import { CreditCard, Calendar } from "lucide-react";
import { TravesiaBadge } from "../../../components/ui/TravesiaBadge";

interface Props {
    report: ClientFinancialReportResponse | null;
    onClose: () => void;
}

export const PaymentHistoryModal = ({ report, onClose }: Props) => {
    if (!report) return null;

    return (
        <TravesiaModal
            isOpen={!!report}
            onClose={onClose}
            closeOnOutsideClick={true}
            title={
                <div className="flex flex-col">
                    <span className="flex items-center gap-2">
                        <CreditCard className="text-primary" size={20} />
                        Historial de Pagos
                    </span>
                    <span className="text-xs font-normal opacity-70">
                        {report.clientFullName} - {report.packageName}
                    </span>
                </div>
            }
            size="lg"
        >
            <div className="space-y-6">
                {/* 1. Resumen Financiero (Cards) */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-base-200/50 p-3 rounded-xl border border-base-200">
                        <span className="text-[10px] uppercase font-bold opacity-60 block">Acordado</span>
                        <span className="text-lg font-mono font-bold">Bs. {report.agreedPrice.toFixed(2)}</span>
                    </div>
                    <div className="bg-success/10 p-3 rounded-xl border border-success/20">
                        <span className="text-[10px] uppercase font-bold text-success block">Pagado</span>
                        <span className="text-lg font-mono font-bold text-success">Bs. {report.totalPaid.toFixed(2)}</span>
                    </div>
                    <div className={`p-3 rounded-xl border ${report.balance > 0 ? 'bg-error/10 border-error/20' : 'bg-base-200/50 border-base-200'}`}>
                        <span className={`text-[10px] uppercase font-bold block ${report.balance > 0 ? 'text-error' : 'opacity-60'}`}>
                            Saldo Pendiente
                        </span>
                        <span className={`text-lg font-mono font-bold ${report.balance > 0 ? 'text-error' : ''}`}>
                            Bs. {report.balance.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* 2. Tabla de Transacciones */}
                <div className="overflow-hidden rounded-lg border border-base-200">
                    <table className="table table-sm w-full bg-base-100">
                        <thead className="bg-base-200/50">
                            <tr>
                                <th>Fecha</th>
                                <th>Método</th>
                                <th>Estado Pago</th>
                                <th>Referencia</th>
                                <th className="text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.paymentHistory.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 opacity-50 italic text-xs">
                                        No hay pagos registrados aún.
                                    </td>
                                </tr>
                            ) : (
                                report.paymentHistory.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-base-200/30">
                                        <td className="font-mono text-xs">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={12} className="opacity-50"/>
                                                {new Date(payment.date).toLocaleDateString()} 
                                                <span className="opacity-50 text-[10px]">{new Date(payment.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                        </td>
                                        <td>
                                            {/* Usamos tu componente Badge para mapear el código 401, 402, etc. */}
                                            <TravesiaBadge 
                                                code={payment.paymentMethodCode} 
                                                label={payment.paymentMethodName.toString()} // Fallback label, idealmente tendrías un map
                                                type="PAYMENT_METHOD" // O crea un tipo PAYMENT_METHOD en badgeConfig
                                                className="scale-90 origin-left"
                                            />
                                        </td>
                                        <td>
                                            {/* Usamos tu componente Badge para mapear el código 401, 402, etc. */}
                                            <TravesiaBadge 
                                                code={payment.paymentStatusCode} 
                                                label={payment.paymentStatusName.toString()} // Fallback label, idealmente tendrías un map
                                                type="TRANSACTION_STATUS" // O crea un tipo PAYMENT_METHOD en badgeConfig
                                                className="scale-90 origin-left"
                                            />
                                        </td>
                                        <td className="font-mono text-xs opacity-70">
                                            {payment.bankReference || '---'}
                                        </td>
                                        <td className="text-right font-bold font-mono text-success">
                                            + Bs. {payment.amount.toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </TravesiaModal>
    );
};