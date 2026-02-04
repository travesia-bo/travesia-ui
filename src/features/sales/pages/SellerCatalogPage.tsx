import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
    Eye, ShoppingCart, Users, Package as BoxIcon, 
    TrendingUp, AlertCircle, CheckCircle2, 
    ImageIcon, QrCode, Boxes, MapPin
} from "lucide-react";

// Servicios y Tipos
import { getSellerCatalog } from "../services/reservationService";
import { SellerPackage } from "../types";

// UI Components
import { TravesiaTable, Column } from "../../../components/ui/TravesiaTable";
import { TravesiaInput } from "../../../components/ui/TravesiaInput";
import { CatalogFilters } from "../components/CatalogFilters";
import { TravesiaButton } from "../../../components/ui/TravesiaButton";
import { useToast } from "../../../context/ToastContext";
import { PackageDetailsModal } from "../../commercial/components/PackageDetailsModal";
import { TravesiaImageViewer } from "../../../components/ui/TravesiaImageViewer";
import { ReservationFormModal } from "../components/ReservationFormModal";

export const SellerCatalogPage = () => {
    const { success } = useToast();
    
    // 1. Data Fetching
    const { data: packages = [], isLoading } = useQuery({
        queryKey: ["seller-catalog"],
        queryFn: getSellerCatalog
    });

    // 2. Estados
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<any>(null);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerData, setViewerData] = useState<{ url: string | null; title: string }>({ url: null, title: "" });

    // Helper para abrir el visor
    const handleViewImage = (url: string | undefined, title: string) => {
        if (!url) return; 
        setViewerData({ url, title });
        setViewerOpen(true);
    };

    // Helper para abrir detalles
    const handleOpenDetails = (pkg: SellerPackage) => {
        setSelectedPackage(pkg);
        setDetailsModalOpen(true);
    };

    // ✅ NUEVOS ESTADOS PARA LA RESERVA
    const [reservationModalOpen, setReservationModalOpen] = useState(false);
    const [packageToReserve, setPackageToReserve] = useState<SellerPackage | null>(null);

    // ✅ HELPER PARA ABRIR LA RESERVA
    const handleReserve = (pkg: SellerPackage) => {
        setPackageToReserve(pkg);
        setReservationModalOpen(true);
    };

    // 3. Lógica de Filtrado
    const filteredPackages = useMemo(() => {
        return packages.filter(pkg => {
            const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase());
            let matchesCategory = true;
            if (categoryFilter !== "ALL") {
                const codes = Array.from(new Set(pkg.details.map(d => d.categoryCode))).sort().join("-");
                matchesCategory = codes === categoryFilter;
            }
            return matchesSearch && matchesCategory;
        });
    }, [packages, searchTerm, categoryFilter]);

    // 4. Definición de Columnas (SOLO ESCRITORIO)
    const columns: Column<SellerPackage>[] = [
        {
            header: "Paquete / Combo",
            accessorKey: "name",
            render: (row) => (
                <div className="flex items-center gap-3 py-1">
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
        // ... (Resto de columnas idénticas a tu código anterior) ...
        {
            header: "Recursos",
            className: "text-center w-24",
            render: (row) => (
                <div className="flex justify-center gap-1">
                    <button 
                        className={`btn btn-circle btn-xs ${row.imageUrl ? 'btn-ghost text-info' : 'btn-disabled opacity-20'}`}
                        onClick={() => handleViewImage(row.imageUrl, `Portada: ${row.name}`)}
                        disabled={!row.imageUrl}
                    >
                        <ImageIcon size={16} />
                    </button>
                    <button 
                        className={`btn btn-circle btn-xs ${row.imageQrUrl ? 'btn-ghost text-secondary' : 'btn-disabled opacity-20'}`}
                        onClick={() => handleViewImage(row.imageQrUrl, `QR: ${row.name}`)}
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
                const isNoStock = row.availableStock === 0;
                return (
                    <div className={`badge ${isNoStock ? 'badge-error' : 'badge-success'} badge-outline font-bold text-xs`}>
                        {isNoStock ? 'Agotado' : `${row.availableStock} Cupos`}
                    </div>
                );
            }
        },
        {
            header: "Acciones",
            className: "text-right",
            render: (row) => (
                <div className="flex justify-end items-center gap-2">
                    <button 
                        className="btn btn-square btn-sm btn-ghost"
                        onClick={() => handleOpenDetails(row)}
                    >
                        <Eye size={18} />
                    </button>
                    <TravesiaButton
                        variant="primary"
                        label="Reservar"
                        className="h-8 min-h-0 text-xs px-3 shadow-none"
                        responsive={false}
                        disabled={row.availableStock === 0}
                        icon={<ShoppingCart size={14} />}
                        onClick={() => handleReserve(row)}
                        // onClick={() => success(`Iniciando reserva: ${row.name}`)}
                    />
                </div>
            )
        }
    ];

    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 animate-fade-in bg-base-50 min-h-screen pb-20">
            
            {/* 1. Header & Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-base-content flex items-center gap-2">
                        <BoxIcon className="text-primary"/> Catálogo de Ventas
                    </h1>
                    <p className="text-xs md:text-sm text-base-content/60">Selecciona un paquete para iniciar una venta.</p>
                </div>
                <div className="w-full md:w-72">
                    <TravesiaInput 
                        label="" 
                        placeholder="Buscar paquete..." 
                        icon="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-base-100"
                    />
                </div>
            </div>

            {/* 2. Filtros Dinámicos (Responsive) */}
            <div className="-mx-4 px-4 md:mx-0 md:px-0">
                <CatalogFilters 
                    packages={packages} 
                    activeFilter={categoryFilter}
                    onFilterChange={setCategoryFilter}
                />
            </div>

            {/* 3A. TABLA DE RESULTADOS (SOLO PC) */}
            <div className="hidden md:block bg-base-100 rounded-2xl shadow-sm border border-base-200 overflow-hidden">
                <TravesiaTable 
                    data={filteredPackages} 
                    columns={columns} 
                    isLoading={isLoading} 
                />
            </div>

            {/* 3B. LISTA DE TARJETAS (SOLO MÓVIL) - DISEÑO OPTIMIZADO PARA VENTAS */}
            <div className="md:hidden space-y-4">
                {isLoading ? (
                    <div className="text-center py-10 opacity-50">Cargando catálogo...</div>
                ) : filteredPackages.length === 0 ? (
                    <div className="text-center py-10 opacity-50">No hay paquetes disponibles.</div>
                ) : (
                    filteredPackages.map((pkg) => {
                        const isNoStock = pkg.availableStock === 0;
                        const isLowStock = pkg.availableStock < 5 && !isNoStock;

                        return (
                            <div key={pkg.id} className="bg-base-100 rounded-2xl shadow-sm border border-base-200 overflow-hidden relative">
                                {/* Badge de Disponibilidad (Esquina) */}
                                <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider
                                    ${isNoStock ? 'bg-error text-error-content' : isLowStock ? 'bg-warning text-warning-content' : 'bg-success text-success-content'}
                                `}>
                                    {isNoStock ? 'Agotado' : `${pkg.availableStock} Disp.`}
                                </div>

                                <div className="p-4 space-y-3">
                                    {/* Cabecera: Nombre e Icono */}
                                    <div className="flex items-start gap-3 pr-16">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            <Boxes size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-base leading-tight">{pkg.name}</h3>
                                            <p className="text-xs text-base-content/60 mt-0.5">{pkg.details.length} productos</p>
                                        </div>
                                    </div>

                                    {/* Cuerpo: Datos Clave Grid */}
                                    <div className="grid grid-cols-2 gap-3 bg-base-200/30 p-3 rounded-xl">
                                        {/* Precio */}
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-base-content/50 block">Precio Venta</span>
                                            <span className="font-mono font-bold text-lg">Bs. {pkg.totalPrice}</span>
                                        </div>
                                        {/* Ganancia (Resaltado) */}
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-primary/70 flex items-center gap-1">
                                                <TrendingUp size={10}/> Tu Ganancia
                                            </span>
                                            <span className="font-mono font-black text-lg text-primary">Bs. {pkg.commission}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Detalles Extras */}
                                    <div className="flex items-center gap-2 text-xs text-base-content/70">
                                        <div className="flex items-center gap-1 bg-base-200 px-2 py-1 rounded-md">
                                            <Users size={12}/> {pkg.peopleCount} Pers.
                                        </div>
                                        {pkg.peopleCount > 1 && (
                                            <span className="opacity-60">({pkg.pricePerPerson} c/u)</span>
                                        )}
                                    </div>

                                    {/* Acciones e Imágenes */}
                                    <div className="flex items-center justify-between pt-2 border-t border-base-100">
                                        {/* Iconos a la izquierda */}
                                        <div className="flex gap-1">
                                            <button 
                                                className={`btn btn-circle btn-sm ${pkg.imageUrl ? 'btn-ghost text-info' : 'btn-disabled opacity-20'}`}
                                                onClick={() => handleViewImage(pkg.imageUrl, `Portada`)}
                                                disabled={!pkg.imageUrl}
                                            >
                                                <ImageIcon size={18} />
                                            </button>
                                            <button 
                                                className={`btn btn-circle btn-sm ${pkg.imageQrUrl ? 'btn-ghost text-secondary' : 'btn-disabled opacity-20'}`}
                                                onClick={() => handleViewImage(pkg.imageQrUrl, `QR`)}
                                                disabled={!pkg.imageQrUrl}
                                            >
                                                <QrCode size={18} />
                                            </button>
                                            <button 
                                                className="btn btn-circle btn-sm btn-ghost text-base-content/70"
                                                onClick={() => handleOpenDetails(pkg)}
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </div>

                                        {/* Botón Principal Grande */}
                                        <button 
                                            className="btn btn-primary btn-sm px-6 shadow-md"
                                            disabled={isNoStock}
                                            onClick={() => handleReserve(pkg)}
                                            // onClick={() => success(`Reservando: ${pkg.name}`)
                                        >
                                            <ShoppingCart size={16} />
                                            Reservar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modales (Reutilizados) */}
            <PackageDetailsModal 
                isOpen={detailsModalOpen} 
                onClose={() => setDetailsModalOpen(false)}
                pkg={selectedPackage}
            />
            <TravesiaImageViewer
                isOpen={viewerOpen}
                onClose={() => setViewerOpen(false)}
                imageUrl={viewerData.url}
                title={viewerData.title}
            />

            {/* ✅ NUEVO: MODAL DE RESERVA */}
            {reservationModalOpen && (
                <ReservationFormModal 
                    isOpen={reservationModalOpen}
                    onClose={() => {
                        setReservationModalOpen(false);
                        setPackageToReserve(null);
                    }}
                    pkg={packageToReserve}
                />
            )}
        </div>
    );
};