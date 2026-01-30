import { Package } from "../types";
import { TravesiaModal } from "../../../components/ui/TravesiaModal";
import { Package as BoxIcon, MapPin, Tag } from "lucide-react";
import { TravesiaBadge } from "../../../components/ui/TravesiaBadge";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    pkg: Package | null;
}

export const PackageDetailsModal = ({ isOpen, onClose, pkg }: Props) => {
    if (!pkg) return null;

    return (
        <TravesiaModal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <BoxIcon className="text-primary" size={24} />
                    <span className="text-xl">Contenido del Paquete</span>
                </div>
            }
            size="lg"
            actions={
                <button className="btn btn-primary" onClick={onClose}>Cerrar</button>
            }
        >
            <div className="space-y-6">
                {/* Resumen Superior */}
                <div className="bg-base-200/50 p-4 rounded-xl flex flex-wrap gap-4 justify-between items-center border border-base-200">
                    <div>
                        <h4 className="font-bold text-lg">{pkg.name}</h4>
                        <p className="text-sm opacity-70">{pkg.description}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-mono font-bold text-primary">Bs. {pkg.totalPrice}</div>
                        <div className="text-xs opacity-60">Precio Total</div>
                    </div>
                </div>

                {/* Lista de Productos */}
                <div>
                    <h5 className="text-sm font-bold uppercase tracking-wider opacity-50 mb-3">Productos Incluidos</h5>
                    <div className="grid grid-cols-1 gap-3">
                        {pkg.details.map((item, index) => (
                            <div key={index} className="flex flex-col sm:flex-row gap-4 p-4 bg-base-100 border border-base-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                {/* Cantidad */}
                                <div className="flex items-center justify-center bg-primary/10 text-primary font-bold w-12 h-12 rounded-full shrink-0">
                                    {item.quantity}x
                                </div>

                                {/* Info Principal */}
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h6 className="font-bold text-base">{item.productName}</h6>
                                        <TravesiaBadge 
                                            label={item.categoryName} 
                                            code={item.categoryCode} 
                                            type="PRODUCT_CATEGORY" 
                                        />
                                    </div>
                                    <p className="text-xs opacity-70 mt-1">{item.productDescription}</p>
                                    
                                    {/* Ubicación */}
                                    <div className="flex items-center gap-1 mt-2 text-xs text-base-content/60 bg-base-200/50 w-fit px-2 py-1 rounded-lg">
                                        <MapPin size={12} />
                                        <span className="font-semibold">{item.nameLocation}:</span>
                                        <span>{item.addressLocation}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </TravesiaModal>
    );
};