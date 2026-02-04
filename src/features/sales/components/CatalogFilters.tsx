import { useMemo } from "react";
import { Bus, Ticket, Layers, Briefcase, Hotel } from "lucide-react";
import { SellerPackage } from "../types";

interface Props {
    packages: SellerPackage[];
    activeFilter: string;
    onFilterChange: (filterId: string) => void;
}

// Mapeo de Códigos a Iconos/Nombres (Configurable)
const CATEGORY_MAP: Record<number, { label: string; icon: any }> = {
    601: { label: "Congreso", icon: Ticket },
    602: { label: "Hospedaje", icon: Hotel },
    603: { label: "Bus", icon: Bus },
};

export const CatalogFilters = ({ packages, activeFilter, onFilterChange }: Props) => {

    const filters = useMemo(() => {
        const uniqueCombinations = new Map<string, { label: string; icon: any; count: number }>();

        // 1. Contador Global
        uniqueCombinations.set("ALL", { label: "Todos", icon: Layers, count: packages.length });

        packages.forEach(pkg => {
            const codes = Array.from(new Set(pkg.details.map(d => d.categoryCode))).sort();
            const comboId = codes.join("-");
            
            if (!uniqueCombinations.has(comboId)) {
                const labels = codes.map(c => CATEGORY_MAP[c]?.label || "Otro");
                
                // Lógica de Iconos: Si es mixto usa Briefcase, si es simple usa su icono
                let icon = Briefcase; 
                if (codes.length === 1) icon = CATEGORY_MAP[codes[0]]?.icon || Layers;

                uniqueCombinations.set(comboId, {
                    label: labels.join(" + "),
                    icon: icon,
                    count: 0
                });
            }
            const current = uniqueCombinations.get(comboId)!;
            current.count++;
        });

        return Array.from(uniqueCombinations.entries()).map(([id, data]) => ({ id, ...data }));
    }, [packages]);

    return (
        // ✅ CAMBIO 1: Contenedor Flex con Wrap y Centrado
        // - flex-wrap: Permite que los botones bajen a la siguiente línea si no caben.
        // - justify-center: Centra todo el bloque de botones.
        // - gap-4: Más espacio entre botones.
        <div className="flex flex-wrap justify-center gap-4 pb-4">
            {filters.map((filter) => {
                const Icon = filter.icon;
                const isActive = activeFilter === filter.id;

                return (
                    <button
                        key={filter.id}
                        onClick={() => onFilterChange(filter.id)}
                        // ✅ CAMBIO 2: Estilos de Botón "Grande"
                        // - px-6 py-4: Mucho más padding para que sean grandes y fáciles de tocar.
                        // - rounded-2xl: Bordes más redondeados para estética moderna.
                        // - shadow-sm/md: Sombra para dar profundidad.
                        className={`
                            flex items-center gap-3 px-3 py-2 rounded-2xl border-2 transition-all whitespace-nowrap group
                            ${isActive 
                                ? "bg-primary text-primary-content border-primary shadow-lg scale-[1.02]" 
                                : "bg-base-100 text-base-content/70 border-base-200 shadow-sm hover:border-primary/50 hover:bg-base-200 hover:shadow-md"
                            }
                        `}
                    >
                        {/* ✅ CAMBIO 3: Icono más grande (size={24}) */}
                        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className="transition-transform group-hover:scale-110" />
                        
                        {/* ✅ CAMBIO 4: Texto más grande (text-lg) */}
                        <span className="font-bold text-lg">{filter.label}</span>
                        
                        {/* ✅ CAMBIO 5: Badge contador más prominente */}
                        <span className={`
                            text-sm font-bold ml-2 px-2.5 py-1 rounded-full 
                            ${isActive ? 'bg-white/20 text-primary-content' : 'bg-base-300 text-base-content/60 group-hover:bg-base-100'}
                        `}>
                            {filter.count}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};