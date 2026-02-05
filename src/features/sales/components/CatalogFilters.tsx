import { useMemo } from "react";
import { Bed, Bus, Ticket, Layers, Briefcase } from "lucide-react";
import { SellerPackage } from "../types";

interface Props {
    packages: SellerPackage[];
    activeFilter: string;
    onFilterChange: (filterId: string) => void;
}

// ✅ Mapa de colores para los iconos
const CATEGORY_MAP: Record<number, { label: string; icon: any; color: string }> = {
    601: { label: "Congreso", icon: Ticket, color: "text-blue-500" }, 
    602: { label: "Hospedaje", icon: Bed, color: "text-pink-500" }, 
    603: { label: "Bus", icon: Bus, color: "text-green-500" },
};

export const CatalogFilters = ({ packages, activeFilter, onFilterChange }: Props) => {

    const filters = useMemo(() => {
        // Guardamos una lista de categorías completas (label, icon, color) en lugar de un string
        const uniqueCombinations = new Map<string, { categories: { label: string; icon: any; color: string }[]; count: number }>();
        
        // Caso "Todos"
        uniqueCombinations.set("ALL", { 
            categories: [{ label: "Todos", icon: Layers, color: "text-primary" }], 
            count: packages.length 
        });

        packages.forEach(pkg => {
            const codes = Array.from(new Set(pkg.details.map(d => d.categoryCode))).sort();
            const comboId = codes.join("-");
            
            if (!uniqueCombinations.has(comboId)) {
                // ✅ Mapeamos cada código a su objeto completo (Icono + Label + Color)
                const categoriesList = codes.map(c => ({
                    label: CATEGORY_MAP[c]?.label || "Otro",
                    icon: CATEGORY_MAP[c]?.icon || Briefcase,
                    color: CATEGORY_MAP[c]?.color || "text-slate-400"
                }));

                uniqueCombinations.set(comboId, {
                    categories: categoriesList,
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
                const isActive = activeFilter === filter.id;

                return (
                    <button
                        key={filter.id}
                        onClick={() => onFilterChange(filter.id)}
                        className={`
                            flex items-center gap-3 
                            px-4 py-2 md:px-6 md:py-4 
                            rounded-full md:rounded-2xl 
                            border-4 border-primary transition-all duration-300 whitespace-nowrap snap-start shrink-0
                            ${isActive 
                                ? "bg-primary text-primary-content shadow-lg scale-[1.02]" 
                                : "bg-base-100 text-base-content/70 hover:border-primary/40 shadow-sm"
                            }
                        `}
                    >
                        {/* ✅ RENDERIZADO ITERATIVO: ICONO + LABEL (Uno al lado del otro sin separadores) */}
                        <div className="flex items-center gap-3">
                            {filter.categories.map((cat, index) => {
                                const Icon = cat.icon;
                                return (
                                    <div key={index} className="flex items-center gap-1.5">
                                        <Icon 
                                            className={`w-4 h-4 md:w-6 md:h-6 transition-colors ${isActive ? 'text-white' : cat.color}`} 
                                            strokeWidth={isActive ? 3 : 2.5} 
                                        />
                                        <span className={`font-black text-sm md:text-lg transition-colors ${isActive ? 'text-white' : 'text-base-content'}`}>
                                            {cat.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Contador */}
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