import { TravesiaModal } from "../../../components/ui/TravesiaModal";
import type { ReservationResponse } from "../types";
import { User, AlertCircle, CheckCircle2 } from "lucide-react";

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
            closeOnOutsideClick={true}
            title={
                <div className="flex flex-col">
                    <span>Detalle de Reserva</span>
                    <span className="text-sm font-mono text-primary opacity-80">{reservation.reservationCode}</span>
                </div>
            }
            size="lg"
        >
            <div className="space-y-6">
                
                {/* 1. Info General del Paquete (Responsive Grid) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-base-200/50 p-4 rounded-xl text-sm border border-base-200">
                    <div>
                        <span className="block opacity-60 uppercase text-[10px] font-bold tracking-wider">Paquete Turístico</span>
                        <span className="font-bold text-base-content leading-tight">{reservation.packageName}</span>
                    </div>
                    <div className="flex flex-col md:text-right">
                        <span className="block opacity-60 uppercase text-[10px] font-bold tracking-wider">Fecha de Registro</span>
                        <span className="font-mono text-xs md:text-sm">
                            {new Date(reservation.reservationDate).toLocaleString()}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wide opacity-70 border-b pb-2">
                        <User size={16} className="text-primary"/> 
                        Pasajeros ({reservation.clients.length})
                    </h3>

                    {/* ✅ VISTA DESKTOP: Tabla Clásica */}
                    <div className="hidden md:block overflow-x-auto rounded-lg border border-base-200">
                        <table className="table table-sm w-full bg-base-100">
                            <thead className="bg-base-200/50">
                                <tr className="text-base-content/60">
                                    <th>Pasajero</th>
                                    <th>Tipo</th>
                                    <th className="text-right">Acordado</th>
                                    <th className="text-right">Pagado</th>
                                    <th className="text-right font-bold">Saldo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reservation.clients.map((client) => (
                                    <tr key={client.clientId} className="hover:bg-base-200/20">
                                        <td>
                                            <div className="font-bold text-xs">{client.fullName}</div>
                                            <div className="text-[10px] opacity-60 font-mono">{client.identityCard}</div>
                                        </td>
                                        <td>
                                            <span className="badge badge-sm badge-ghost">{client.clientTypeName}</span>
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

                    {/* ✅ VISTA MÓVIL: Tarjetas de Pasajeros */}
                    <div className="md:hidden space-y-3">
                        {reservation.clients.map((client) => (
                            <div key={client.clientId} className="bg-base-100 p-3 rounded-xl border border-base-300 shadow-sm">
                                {/* Header Tarjeta */}
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-bold text-sm text-base-content">{client.fullName}</div>
                                        <div className="text-[10px] opacity-60 font-mono">{client.identityCard}</div>
                                    </div>
                                    <span className="badge badge-xs badge-ghost font-normal">{client.clientTypeName}</span>
                                </div>

                                {/* Grid Financiero */}
                                <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-base-200">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase opacity-50 font-bold">Precio</span>
                                        <span className="font-mono text-xs font-bold">Bs.{client.agreedPrice.toFixed(0)}</span>
                                    </div>
                                    <div className="flex flex-col text-center border-l border-r border-base-200">
                                        <span className="text-[9px] uppercase opacity-50 font-bold text-success">Pagado</span>
                                        <span className="font-mono text-xs font-bold text-success">Bs.{client.totalPaid.toFixed(0)}</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-[9px] uppercase opacity-50 font-bold text-error">Debe</span>
                                        <span className="font-mono text-xs font-bold text-error">Bs.{client.pendingAmount.toFixed(0)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer: Alertas de Estado */}
                {reservation.expirationDate ? (
                    <div className="alert bg-warning/10 border-warning/20 text-xs p-3 flex items-start gap-3 rounded-xl">
                        <AlertCircle size={18} className="text-warning shrink-0 mt-0.5"/>
                        <div className="flex flex-col w-full">
                            <span className="font-bold text-warning-content text-sm mb-0.5">Plazo de Vencimiento</span>
                            <span className="leading-tight opacity-90">
                                La reserva expira automáticamente el: <br className="md:hidden"/>
                                <strong className="font-mono">{new Date(reservation.expirationDate).toLocaleString()}</strong>
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="alert bg-success/10 border-success/20 text-xs p-3 flex items-start gap-3 rounded-xl">
                        <CheckCircle2 size={18} className="text-success shrink-0 mt-0.5"/>
                        <div className="flex flex-col w-full">
                            <span className="font-bold text-success-content text-sm mb-0.5">Reserva Vigente</span>
                            <span className="leading-tight opacity-90">Esta reservación no tiene fecha de expiración o ya está pagada.</span>
                        </div>
                    </div>
                )}
            </div>
        </TravesiaModal>
    );
};