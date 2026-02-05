import { TravesiaModal } from "../../../components/ui/TravesiaModal";
import { ReservationResponse } from "../types";
import { User, CreditCard, AlertCircle, Info } from "lucide-react";

interface Props {
    reservation: ReservationResponse | null;
    onClose: () => void;
}

export const ReservationDetailModal = ({ reservation, onClose }: Props) => {
    if (!reservation) return null;

    return (
        <TravesiaModal
            isOpen={!!reservation}
            onClose={onClose}
            title={`Detalle de Reserva: ${reservation.reservationCode}`}
            size="lg"
        >
            <div className="space-y-6">
                {/* Info General del Paquete */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-base-200/50 p-4 rounded-xl text-sm">
                    <div>
                        <span className="block opacity-60 uppercase text-[10px] font-bold">Paquete</span>
                        <span className="font-semibold">{reservation.packageName}</span>
                    </div>
                    <div className="text-right">
                        <span className="block opacity-60 uppercase text-[10px] font-bold">Fecha de Reserva</span>
                        <span>{new Date(reservation.reservationDate).toLocaleString()}</span>
                    </div>
                </div>

                <h3 className="font-bold flex items-center gap-2 border-b pb-2">
                    <User size={18} className="text-primary"/> Pasajeros Registrados
                </h3>

                <div className="overflow-x-auto">
                    <table className="table table-sm w-full">
                        <thead>
                            <tr className="text-base-content/50">
                                <th>Nombre Completo / CI</th>
                                <th>Tipo</th>
                                <th className="text-right">Acordado</th>
                                <th className="text-right">Pagado</th>
                                <th className="text-right font-bold">Pendiente</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reservation.clients.map((client) => (
                                <tr key={client.clientId}>
                                    <td>
                                        <div className="font-bold text-xs">{client.fullName}</div>
                                        <div className="text-[10px] opacity-60">{client.identityCard}</div>
                                    </td>
                                    <td>
                                        <span className="badge badge-ghost badge-xs">{client.clientTypeName}</span>
                                    </td>
                                    <td className="text-right font-mono text-xs">Bs. {client.agreedPrice.toFixed(2)}</td>
                                    <td className="text-right font-mono text-xs text-success">Bs. {client.totalPaid.toFixed(2)}</td>
                                    <td className="text-right font-mono text-xs text-error font-bold">
                                        Bs. {client.pendingAmount.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {reservation.expirationDate ? (
                    <div className="alert bg-warning/10 border-warning/20 text-xs py-3 flex items-start gap-3">
                        <AlertCircle size={16} className="text-warning shrink-0 mt-0.5"/>
                        <div className="flex flex-col">
                            <span className="font-bold text-warning-content">Plazo de Vencimiento:</span>
                            <span>La reserva expira automáticamente el: <strong>{new Date(reservation.expirationDate).toLocaleString()}</strong></span>
                        </div>
                    </div>
                ) : (
                    <div className="alert bg-info/10 border-info/20 text-xs py-3 flex items-start gap-3">
                        <Info size={16} className="text-info shrink-0 mt-0.5"/>
                        <div className="flex flex-col">
                            <span className="font-bold text-info-content">Reserva Pagada:</span>
                            <span>Esta reservación está vigente.</span>
                        </div>
                    </div>
                )}
            </div>
        </TravesiaModal>
    );
};