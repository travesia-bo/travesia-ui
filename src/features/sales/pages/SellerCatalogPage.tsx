import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
    Eye, ShoppingCart, Users, Package as BoxIcon, 
    TrendingUp, AlertCircle, CheckCircle2, 
    ImageIcon,
    QrCode,
    Boxes
} from "lucide-react";

// Servicios y Tipos
import { getSellerCatalog } from "../services/packageService";
import { SellerPackage } from "../types";

// UI Components
import { TravesiaTable, Column } from "../../../components/ui/TravesiaTable";
import { TravesiaInput } from "../../../components/ui/TravesiaInput";
import { CatalogFilters } from "../components/CatalogFilters";
import { TravesiaButton } from "../../../components/ui/TravesiaButton";
import { useToast } from "../../../context/ToastContext";
import { PackageDetailsModal } from "../../commercial/components/PackageDetailsModal";
import { TravesiaImageViewer } from "../../../components/ui/TravesiaImageViewer";

export const SellerCatalogPage = () => {
    const { success } = useToast();
    
    // 1. Data Fetching
    const { data: packages = [], isLoading } = useQuery({
        queryKey: ["seller-catalog"],
        queryFn: getSellerCatalog
    });

    // 2. Estados de Filtros
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    
    // Estado para ver detalles
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<any>(null); // Tipar con Package si son compatibles o castear

    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerData, setViewerData] = useState<{ url: string | null; title: string }>({ url: null, title: "" });

    // Helper para abrir el visor
    const handleViewImage = (url: string | undefined, title: string) => {
        if (!url) return; // Opcional: mostrar toast de "No hay imagen"
        setViewerData({ url, title });
        setViewerOpen(true);
    };

    // 3. Lógica de Filtrado "Smart"
    const filteredPackages = useMemo(() => {
        return packages.filter(pkg => {
            // A. Filtro por Texto
            const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase());
            
            // B. Filtro por Botones (Categoría)
            let matchesCategory = true;
            if (categoryFilter !== "ALL") {
                // Reconstruimos el ID del paquete para ver si coincide con el filtro seleccionado
                const codes = Array.from(new Set(pkg.details.map(d => d.categoryCode))).sort().join("-");
                matchesCategory = codes === categoryFilter;
            }

            return matchesSearch && matchesCategory;
        });
    }, [packages, searchTerm, categoryFilter]);

    // 4. Definición de Columnas (Estilo Senior)
    const columns: Column<SellerPackage>[] = [
        {
            header: "Paquete / Combo",
            accessorKey: "name",
            render: (row) => (
                <div className="flex items-center gap-3 py-1">
                    {/* ✅ OPTIMIZACIÓN: Quitamos la imagen cargada y dejamos un icono estático */}
                    
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                        <Boxes size={20} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm text-base-content">{row.name}</span>
                        <span className="text-[10px] text-base-content/60 truncate max-w-[180px]">
                            {row.details.length} productos incluidos
                        </span>
                    </div>
                </div>
            )
        },
        {
            header: "Recursos", // ✅ NUEVA COLUMNA O INTEGRADA
            className: "text-center w-24",
            render: (row) => (
                <div className="flex justify-center gap-1">
                    {/* Botón Foto Portada */}
                    <button 
                        className={`btn btn-circle btn-xs ${row.imageUrl ? 'btn-ghost text-info' : 'btn-disabled opacity-20'}`}
                        onClick={() => handleViewImage(row.imageUrl, `Portada: ${row.name}`)}
                        title="Ver Foto Referencial"
                        disabled={!row.imageUrl}
                    >
                        <ImageIcon size={16} />
                    </button>

                    {/* Botón QR */}
                    <button 
                        className={`btn btn-circle btn-xs ${row.imageQrUrl ? 'btn-ghost text-secondary' : 'btn-disabled opacity-20'}`}
                        onClick={() => handleViewImage(row.imageQrUrl, `Código QR de Pago: ${row.name}`)}
                        title="Ver QR de Cobro"
                        disabled={!row.imageQrUrl}
                    >
                        <QrCode size={16} />
                    </button>
                </div>
            )
        },
        {
            header: "Personas",
            className: "text-center w-24",
            render: (row) => (
                <div className="flex justify-center">
                    <div className="badge badge-ghost gap-1 font-bold text-xs">
                        <Users size={12} /> {row.peopleCount}
                    </div>
                </div>
            )
        },
        {
            header: "Precio Venta",
            render: (row) => (
                <div className="flex flex-col">
                    <span className="font-mono font-bold text-base text-base-content">Bs. {row.totalPrice}</span>
                    {row.peopleCount > 1 && (
                        <span className="text-[10px] opacity-60">Bs. {row.pricePerPerson} p/p</span>
                    )}
                </div>
            )
        },
        {
            // 🔥 COLUMNA IMPORTANTE PARA EL VENDEDOR
            header: <span className="flex items-center gap-1 text-primary"><TrendingUp size={14}/> Tu Comisión</span>,
            render: (row) => (
                <div className="font-mono font-black text-primary bg-primary/10 px-2 py-1 rounded-lg w-fit">
                    Bs. {row.commission}
                </div>
            )
        },
        {
            header: "Disponible",
            className: "text-center w-28",
            render: (row) => {
                const isLowStock = row.availableStock < 5;
                const isNoStock = row.availableStock === 0;
                
                return (
                    <div className={`
                        flex items-center justify-center gap-1 font-bold text-xs px-2 py-1 rounded-full border
                        ${isNoStock 
                            ? "bg-error/10 text-error border-error/20" 
                            : isLowStock 
                                ? "bg-warning/10 text-warning border-warning/20" 
                                : "bg-success/10 text-success border-success/20"
                        }
                    `}>
                        {isNoStock ? (
                            <>Agotado</>
                        ) : (
                            <>{row.availableStock} Cupos</>
                        )}
                    </div>
                );
            }
        },
        {
            header: "Acciones",
            className: "text-right",
            render: (row) => (
                <div className="flex justify-end items-center gap-2">
                    {/* Botón Ver Detalles (Ghost) */}
                    <button 
                        className="btn btn-square btn-sm btn-ghost text-base-content/70 hover:bg-base-200"
                        onClick={() => {
                            // Adaptamos el SellerPackage al formato Package que espera el modal
                            // (Esto asume que el modal es flexible o los tipos coinciden lo suficiente)
                            setSelectedPackage(row); 
                            setDetailsModalOpen(true);
                        }}
                        title="Ver contenido del paquete"
                    >
                        <Eye size={18} />
                    </button>

                    {/* Botón Reservar (Principal) */}
                    <TravesiaButton
                        variant="primary"
                        label="Reservar"
                        className="h-8 min-h-0 text-xs px-3 shadow-none"
                        responsive={false} // Queremos que siempre diga "Reservar" si cabe
                        disabled={row.availableStock === 0}
                        icon={<ShoppingCart size={14} />}
                        onClick={() => success(`Iniciando reserva para: ${row.name}`)}
                    />
                </div>
            )
        }
    ];

    return (
        <div className="p-6 space-y-6 animate-fade-in bg-base-50 min-h-screen">
            
            {/* 1. Header & Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-base-content flex items-center gap-2">
                        <BoxIcon className="text-primary"/> Catálogo de Ventas
                    </h1>
                    <p className="text-sm text-base-content/60">Selecciona un paquete para iniciar una venta.</p>
                </div>
                <div className="w-full md:w-72">
                    <TravesiaInput 
                        label="" 
                        placeholder="Buscar por nombre..." 
                        icon="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-base-100"
                    />
                </div>
            </div>

            {/* 2. Filtros Dinámicos (Botones flotantes) */}
            <div className="py-2">
                <CatalogFilters 
                    packages={packages} 
                    activeFilter={categoryFilter}
                    onFilterChange={setCategoryFilter}
                />
            </div>

            {/* 3. Tabla de Resultados */}
            <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 overflow-hidden">
                <TravesiaTable 
                    data={filteredPackages} 
                    columns={columns} 
                    isLoading={isLoading} 
                />
            </div>

            {/* Modal de Detalles (Reutilizado) */}
            <PackageDetailsModal 
                isOpen={detailsModalOpen} 
                onClose={() => setDetailsModalOpen(false)}
                pkg={selectedPackage}
            />

            {/* ✅ NUEVO: VISOR DE IMÁGENES REUTILIZABLE */}
            <TravesiaImageViewer
                isOpen={viewerOpen}
                onClose={() => setViewerOpen(false)}
                imageUrl={viewerData.url}
                title={viewerData.title}
            />
        </div>
    );
};