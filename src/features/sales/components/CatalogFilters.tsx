import { useMemo } from "react";
import { Bed, Bus, Ticket, Layers, Briefcase } from "lucide-react";
import { SellerPackage } from "../types";

interface Props {
    packages: SellerPackage[];
    activeFilter: string;
    onFilterChange: (filterId: string) => void;
}

// ✅ Mapa de colores para los iconos (siempre visibles)
const CATEGORY_MAP: Record<number, { label: string; icon: any; color: string }> = {
    601: { label: "Congreso", icon: Ticket, color: "text-blue-500" }, 
    602: { label: "Hospedaje", icon: Bed, color: "text-pink-500" }, 
    603: { label: "Bus", icon: Bus, color: "text-green-500" },
};

export const CatalogFilters = ({ packages, activeFilter, onFilterChange }: Props) => {

    const filters = useMemo(() => {
        const uniqueCombinations = new Map<string, { label: string; icon: any; color: string; count: number }>();
        uniqueCombinations.set("ALL", { label: "Todos", icon: Layers, color: "text-primary", count: packages.length });

        packages.forEach(pkg => {
            const codes = Array.from(new Set(pkg.details.map(d => d.categoryCode))).sort();
            const comboId = codes.join("-");
            
            if (!uniqueCombinations.has(comboId)) {
                const labels = codes.map(c => CATEGORY_MAP[c]?.label || "Otro");
                let icon = Briefcase; 
                let color = "text-slate-400"; // Color para combos mixtos

                if (codes.length === 1) {
                    icon = CATEGORY_MAP[codes[0]]?.icon || Layers;
                    color = CATEGORY_MAP[codes[0]]?.color || "text-primary";
                } else {
                    // Si es combo, tomamos el color del primer elemento para no ser aburridos
                    color = CATEGORY_MAP[codes[0]]?.color || "text-slate-400";
                }

                uniqueCombinations.set(comboId, {
                    label: labels.join(" + "),
                    icon: icon,
                    color: color,
                    count: 0
                });
            }
            const current = uniqueCombinations.get(comboId)!;
            current.count++;
        });

        return Array.from(uniqueCombinations.entries()).map(([id, data]) => ({ id, ...data }));
    }, [packages]);

    return (
        <div className="flex flex-nowrap overflow-x-auto md:flex-wrap md:justify-center gap-3 pb-4 scrollbar-hide snap-x px-1">
            {filters.map((filter) => {
                const Icon = filter.icon;
                const isActive = activeFilter === filter.id;

                return (
                    <button
                        key={filter.id}
                        onClick={() => onFilterChange(filter.id)}
                        className={`
                            flex items-center gap-2 md:gap-3 
                            px-4 py-2 md:px-6 md:py-4 
                            rounded-full md:rounded-2xl 
                            border-[3px] border-primary transition-all duration-300 whitespace-nowrap snap-start shrink-0
                            ${isActive 
                                ? "bg-primary border-primary text-primary-content shadow-lg scale-[1.02]" 
                                : "bg-base-100 border-base-200 text-base-content/70 hover:border-primary/40 shadow-sm"
                            }
                        `}
                    >
                        {/* ✅ El icono tiene su color cuando NO está activo, y es BLANCO cuando SI lo está */}
                        <Icon 
                            className={`w-4 h-4 md:w-6 md:h-6 transition-colors ${isActive ? 'text-white' : filter.color}`} 
                            strokeWidth={isActive ? 3 : 2} 
                        />
                        
                        <span className={`font-black text-sm md:text-lg transition-colors ${isActive ? 'text-white' : 'text-base-content'}`}>
                            {filter.label}
                        </span>
                        
                        <span className={`
                            text-xs md:text-sm font-bold ml-1 px-2 py-0.5 rounded-full transition-colors
                            ${isActive ? 'bg-white/20 text-white' : 'bg-base-200 text-base-content/50'}
                        `}>
                            {filter.count}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};