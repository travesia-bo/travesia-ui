import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search, MapPin, User } from "lucide-react";

export interface RichOption {
    value: number | string;
    label: string;      // Título principal (ej: Nombre Proveedor)
    subtitle?: string;  // Info extra (ej: Ciudad, Dirección)
    icon?: React.ReactNode;
}

interface Props {
    label: string;
    placeholder?: string;
    options: RichOption[];
    value?: number | string | null;
    onChange: (value: number | string) => void;
    error?: string;
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export const RichSelect = ({ label, placeholder, options, value, onChange, error, isLoading, icon }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Encontrar la opción seleccionada
    const selectedOption = options.find(opt => opt.value === value);

    // Filtrar opciones
    const filteredOptions = options.filter(opt => 
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
        opt.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Cerrar al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="form-control w-full" ref={wrapperRef}>
            <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                    {icon} {label}
                </span>
            </label>

            <div className="relative">
                {/* BOTÓN PRINCIPAL (Trigger) */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`
                        w-full text-left bg-base-100 border rounded-xl px-4 py-3 flex items-center justify-between transition-all
                        ${error ? 'border-error ring-1 ring-error' : 'border-base-300 hover:border-primary focus:ring-2 focus:ring-primary/20'}
                        ${isOpen ? 'ring-2 ring-primary/20 border-primary' : ''}
                    `}
                >
                    {selectedOption ? (
                        <div className="flex flex-col">
                            <span className="font-bold text-base-content">{selectedOption.label}</span>
                            {selectedOption.subtitle && (
                                <span className="text-xs text-base-content/60 truncate">{selectedOption.subtitle}</span>
                            )}
                        </div>
                    ) : (
                        <span className="text-base-content/40">{isLoading ? "Cargando..." : (placeholder || "Seleccionar...")}</span>
                    )}
                    <ChevronDown size={18} className={`transition-transform duration-200 opacity-50 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* MENÚ DESPLEGABLE */}
                {isOpen && !isLoading && (
                    <div className="absolute z-50 w-full mt-2 bg-base-100 border border-base-200 rounded-xl shadow-xl max-h-64 overflow-hidden flex flex-col animate-fade-in-up">
                        {/* Buscador interno */}
                        <div className="p-2 border-b border-base-200 sticky top-0 bg-base-100 z-10">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50"/>
                                <input 
                                    type="text" 
                                    className="input input-sm input-ghost w-full pl-9 bg-base-200/50 focus:bg-base-100"
                                    placeholder="Buscar..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Lista de Opciones */}
                        <div className="overflow-y-auto custom-scrollbar p-1">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                            onChange(opt.value);
                                            setIsOpen(false);
                                            setSearchTerm("");
                                        }}
                                        className={`
                                            w-full text-left px-3 py-2 rounded-lg flex items-center justify-between group transition-colors
                                            ${value === opt.value ? 'bg-primary/10 text-primary' : 'hover:bg-base-200'}
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            {opt.icon && <span className="opacity-70">{opt.icon}</span>}
                                            <div>
                                                <div className={`font-semibold ${value === opt.value ? 'font-bold' : ''}`}>
                                                    {opt.label}
                                                </div>
                                                {opt.subtitle && (
                                                    <div className="text-xs opacity-60 group-hover:opacity-80">
                                                        {opt.subtitle}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {value === opt.value && <Check size={16} />}
                                    </button>
                                ))
                            ) : (
                                <div className="p-4 text-center text-sm opacity-50">No hay resultados</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <label className="label">
                    <span className="label-text-alt text-error">{error}</span>
                </label>
            )}
        </div>
    );
};