import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom"; // 👈 IMPORTANTE
import { ChevronDown, Check, Search } from "lucide-react";

export interface RichOption {
    value: number | string;
    label: string;
    subtitle?: string;
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
    
    // Referencia al botón para calcular dónde dibujarnos
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0, width: 0 });

    // Encontrar la opción seleccionada
    const selectedOption = options.find(opt => opt.value === value);

    // Filtrar opciones
    const filteredOptions = options.filter(opt => 
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
        opt.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- LÓGICA DE POSICIONAMIENTO ---
    const updatePosition = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            // Calculamos la posición fija en la pantalla
            setMenuCoords({
                top: rect.bottom + window.scrollY + 6, // 6px abajo del botón
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    const handleOpen = () => {
        if (!isOpen && !isLoading) {
            updatePosition();
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    };

    // Cerrar al hacer scroll o resize (para que el menú no se quede flotando solo)
    useEffect(() => {
        if (!isOpen) return;

        const handleScrollOrResize = () => {
            // Opción A: Recalcular posición (el menú sigue al botón)
            updatePosition(); 
            // Opción B (Más segura): Cerrar el menú si scrollean mucho
            // setIsOpen(false); 
        };

        window.addEventListener("scroll", handleScrollOrResize, true); // true = capture phase (detecta scroll de modales)
        window.addEventListener("resize", handleScrollOrResize);
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            window.removeEventListener("scroll", handleScrollOrResize, true);
            window.removeEventListener("resize", handleScrollOrResize);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    // Cerrar click fuera (Detecta clicks en el portal y en el botón)
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    const handleClickOutside = (event: MouseEvent) => {
        // Si el click NO fue en el botón Y NO fue en el dropdown flotante
        if (
            buttonRef.current && 
            !buttonRef.current.contains(event.target as Node) &&
            dropdownRef.current && 
            !dropdownRef.current.contains(event.target as Node)
        ) {
            setIsOpen(false);
        }
    };

    // --- RENDERIZADO DEL CONTENIDO DEL MENÚ ---
    // Esto es lo que se enviará al Portal
    const menuContent = (
        <div 
            ref={dropdownRef}
            className="fixed z-[9999] bg-base-100 border border-base-200 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-fade-in-up"
            style={{
                top: menuCoords.top,
                left: menuCoords.left,
                width: menuCoords.width,
                maxHeight: '300px' // Altura máxima para que no se salga de pantalla
            }}
        >
            {/* Buscador interno */}
            <div className="p-2 border-b border-base-200 bg-base-100 z-10">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50"/>
                    <input 
                        type="text" 
                        className="input input-sm input-ghost w-full pl-9 bg-base-200/50 focus:bg-base-100 text-sm"
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
                                    <div className={`font-semibold text-sm ${value === opt.value ? 'font-bold' : ''}`}>
                                        {opt.label}
                                    </div>
                                    {opt.subtitle && (
                                        <div className="text-[10px] opacity-60 group-hover:opacity-80 leading-tight">
                                            {opt.subtitle}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {value === opt.value && <Check size={16} />}
                        </button>
                    ))
                ) : (
                    <div className="p-4 text-center text-xs opacity-50">No hay resultados</div>
                )}
            </div>
        </div>
    );

    return (
        <div className="form-control w-full">
            <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                    {icon} {label}
                </span>
            </label>

            <div className="relative">
                {/* BOTÓN PRINCIPAL (Trigger) */}
                <button
                    ref={buttonRef} // 👈 Referencia clave
                    type="button"
                    onClick={handleOpen}
                    disabled={isLoading}
                    className={`
                        w-full text-left bg-base-100 border rounded-xl px-4 py-3 flex items-center justify-between transition-all
                        ${error ? 'border-error ring-1 ring-error' : 'border-base-300 hover:border-primary focus:ring-2 focus:ring-primary/20'}
                        ${isOpen ? 'ring-2 ring-primary/20 border-primary' : ''}
                        ${isLoading ? 'opacity-60 cursor-wait' : ''}
                    `}
                >
                    {selectedOption ? (
                        <div className="flex flex-col min-w-0">
                            <span className="font-bold text-base-content truncate">{selectedOption.label}</span>
                            {selectedOption.subtitle && (
                                <span className="text-xs text-base-content/60 truncate">{selectedOption.subtitle}</span>
                            )}
                        </div>
                    ) : (
                        <span className="text-base-content/40 text-sm">
                            {isLoading ? "Cargando..." : (placeholder || "Seleccionar...")}
                        </span>
                    )}
                    <ChevronDown size={18} className={`transition-transform duration-200 opacity-50 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* 🔥 LA MAGIA: Renderizamos el menú FUERA del modal, directo en el body */}
                {isOpen && createPortal(menuContent, document.body)}
            </div>

            {error && (
                <label className="label">
                    <span className="label-text-alt text-error">{error}</span>
                </label>
            )}
        </div>
    );
};