import { useMemo } from "react";
import { Bed, Bus, Ticket, Layers, Briefcase } from "lucide-react";
import { SellerPackage } from "../types";

interface Props {
    packages: SellerPackage[];
    activeFilter: string;
    onFilterChange: (filterId: string) => void;
}

const CATEGORY_MAP: Record<number, { label: string; icon: any }> = {
    601: { label: "Congreso", icon: Ticket },
    602: { label: "Hospedaje", icon: Bed },
    603: { label: "Bus", icon: Bus },
};

export const CatalogFilters = ({ packages, activeFilter, onFilterChange }: Props) => {

    const filters = useMemo(() => {
        const uniqueCombinations = new Map<string, { label: string; icon: any; count: number }>();
        uniqueCombinations.set("ALL", { label: "Todos", icon: Layers, count: packages.length });

        packages.forEach(pkg => {
            const codes = Array.from(new Set(pkg.details.map(d => d.categoryCode))).sort();
            const comboId = codes.join("-");
            
            if (!uniqueCombinations.has(comboId)) {
                const labels = codes.map(c => CATEGORY_MAP[c]?.label || "Otro");
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
        // ✅ LAYOUT HÍBRIDO:
        // Móvil: flex-nowrap + overflow-x-auto (Scroll horizontal, tipo Instagram Stories)
        // Desktop (md): flex-wrap + justify-center (Grilla centrada)
        <div className="flex flex-nowrap overflow-x-auto md:flex-wrap md:justify-center gap-3 pb-2 scrollbar-hide snap-x px-1">
            {filters.map((filter) => {
                const Icon = filter.icon;
                const isActive = activeFilter === filter.id;

                return (
                    <button
                        key={filter.id}
                        onClick={() => onFilterChange(filter.id)}
                        // ✅ ESTILOS HÍBRIDOS:
                        // Móvil: Padding pequeño, texto pequeño (Compacto)
                        // Desktop: Padding grande, texto grande (Prominente)
                        className={`
                            flex items-center gap-2 md:gap-3 
                            px-4 py-2 md:px-4 md:py-4 
                            rounded-full md:rounded-2xl 
                            border transition-all whitespace-nowrap snap-start shrink-0
                            ${isActive 
                                ? "bg-primary text-primary-content border-primary shadow-md scale-[1.02]" 
                                : "bg-base-100 text-base-content/70 border-base-200 shadow-sm"
                            }
                        `}
                    >
                        {/* Icono adaptable */}
                        <Icon className="w-4 h-4 md:w-6 md:h-6" strokeWidth={isActive ? 2.5 : 2} />
                        
                        {/* Texto adaptable */}
                        <span className="font-bold text-sm md:text-lg">{filter.label}</span>
                        
                        {/* Contador adaptable */}
                        <span className={`
                            text-xs md:text-sm font-bold ml-1 px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-full 
                            ${isActive ? 'bg-white/20' : 'bg-base-200'}
                        `}>
                            {filter.count}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};