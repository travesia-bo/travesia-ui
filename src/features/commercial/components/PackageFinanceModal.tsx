import { TravesiaModal } from "../../../components/ui/TravesiaModal";
import { type Package } from "../types";
import { TrendingUp, Calculator, Package as BoxIcon } from "lucide-react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    pkg: Package | null;
}

export const PackageFinanceModal = ({ isOpen, onClose, pkg }: Props) => {
    if (!pkg) return null;

    // Cálculos de Proyección Global (basado en el stock)
    const stock = pkg.availableStock;
    const projectedRevenue = pkg.totalPrice * stock;
    const projectedCost = pkg.minPrice * stock;
    const projectedGrossMargin = pkg.grossMargin * stock;
    const projectedCommission = pkg.estimatedCommission * stock;
    const projectedNetMargin = pkg.netMargin * stock;

    return (
        <TravesiaModal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex flex-col">
                    <span className="flex items-center gap-2">
                        <TrendingUp className="text-success" size={20} />
                        Análisis Financiero
                    </span>
                    <span className="text-xs font-normal opacity-70 truncate">
                        Paquete: {pkg.name}
                    </span>
                </div>
            }
            size="lg"
        >
            <div className="space-y-6 animate-fade-in pb-4">
                
                {/* SECCIÓN 1: UNITARIO (Por 1 Paquete) */}
                <div>
                    <h3 className="text-sm font-bold uppercase opacity-50 mb-3 flex items-center gap-2">
                        <Calculator size={14}/> Por Unidad (1 Paquete)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <StatCard label="Costo Proveedor" value={pkg.minPrice} />
                        <StatCard label="Precio Venta" value={pkg.totalPrice} highlight />
                        <StatCard label="Ganancia Bruta" value={pkg.grossMargin} color="text-success" />
                        <StatCard label="Comisión Vendedor" value={pkg.estimatedCommission} color="text-warning" />
                    </div>
                    
                    <div className="mt-3 bg-success/10 border border-success/20 p-4 rounded-xl flex justify-between items-center">
                        <span className="font-bold text-success text-sm">Margen Neto Real (Ganancia limpia):</span>
                        <span className="font-mono font-black text-xl text-success">Bs. {pkg.netMargin.toFixed(2)}</span>
                    </div>
                </div>

                <div className="divider my-1"></div>

                {/* SECCIÓN 2: PROYECCIÓN GLOBAL (Por Todo el Stock) */}
                <div>
                    <h3 className="text-sm font-bold uppercase opacity-50 mb-3 flex items-center gap-2">
                        <BoxIcon size={14}/> Proyección Global (Stock: {stock})
                    </h3>
                    
                    {stock === 0 ? (
                        <div className="alert bg-base-200 border-none text-sm">
                            Este paquete no tiene stock disponible para proyectar ganancias.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <StatCard label="Costo Total" value={projectedCost} />
                                <StatCard label="Ingreso Total Estimado" value={projectedRevenue} />
                                <StatCard label="Ganancia Bruta" value={projectedGrossMargin} color="text-success" />
                                <StatCard label="Pago Comisiones" value={projectedCommission} color="text-warning" />
                            </div>

                            <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex justify-between items-center shadow-sm">
                                <div className="flex flex-col">
                                    <span className="font-bold text-primary text-sm">Ganancia Neta Proyectada</span>
                                    <span className="text-[10px] opacity-60">Si se venden los {stock} paquetes</span>
                                </div>
                                <span className="font-mono font-black text-2xl text-primary flex items-center gap-1">
                                    Bs. {projectedNetMargin.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </TravesiaModal>
    );
};

// Sub-componente interno para las tarjetitas
const StatCard = ({ label, value, highlight = false, color = "text-base-content" }: { label: string, value: number, highlight?: boolean, color?: string }) => (
    <div className={`p-3 rounded-xl border ${highlight ? 'bg-base-200 border-base-300' : 'bg-base-100 border-base-200 shadow-sm'} flex flex-col justify-center`}>
        <span className="text-[10px] uppercase font-bold opacity-60 mb-1 leading-tight">{label}</span>
        <span className={`font-mono font-bold text-lg ${color}`}>
            {value.toFixed(2)}
        </span>
    </div>
);