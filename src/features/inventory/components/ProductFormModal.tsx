import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, MapPin, Box, Store, Tag } from "lucide-react"; 

// Hooks y Servicios
import { createProduct, updateProduct } from "../services/productService";
import { useProviders } from "../hooks/useProviders";
import { useLocations } from "../hooks/useLocations";
import { useParameters } from "../../../hooks/useParameters";
import { PARAM_CATEGORIES } from "../../../config/constants";
import { useToast } from "../../../context/ToastContext";

// UI Components
import { TravesiaInput } from "../../../components/ui/TravesiaInput";
import { RichSelect } from "../../../components/ui/RichSelect";
// import { TravesiaSwitch } from "../../../components/ui/TravesiaSwitch"; // <--- YA NO SE USA AQUÍ
import { BtnSave, BtnCancel } from "../../../components/ui/CrudButtons";

// Types
import { CreateProductRequest, Product } from "../types";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    productToEdit?: Product | null;
}

export const ProductFormModal = ({ isOpen, onClose, productToEdit }: Props) => {
    const { success, error: toastError } = useToast();
    const queryClient = useQueryClient();
    
    const [isCreatingLocation, setIsCreatingLocation] = useState(false);

    const { data: providers = [], isLoading: loadingProviders } = useProviders();
    const { data: locations = [], isLoading: loadingLocations } = useLocations();
    const { parameters: categories, isLoading: loadingCategories } = useParameters(PARAM_CATEGORIES.PRODUCT_CATEGORY);

    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<CreateProductRequest>({
        defaultValues: {
            // status: true, <--- ELIMINADO
            physicalStock: 0,
            peopleCapacity: 0,
            providerCost: 0
        }
    });

    useEffect(() => {
        if (isOpen) {
            if (productToEdit) {
                // MODO EDICIÓN
                setValue("name", productToEdit.name);
                setValue("description", productToEdit.description);
                setValue("categoryType", productToEdit.categoryCode);
                setValue("physicalStock", productToEdit.physicalStock);
                setValue("peopleCapacity", productToEdit.peopleCapacity);
                setValue("providerCost", productToEdit.providerCost);
                // setValue("status", productToEdit.status); <--- ELIMINADO
                
                if (productToEdit.providerId) setValue("providerId", productToEdit.providerId);

                if (productToEdit.locationId) {
                    setIsCreatingLocation(false);
                    setValue("locationId", productToEdit.locationId);
                } else {
                    setIsCreatingLocation(false);
                }

            } else {
                // MODO CREAR
                reset({ physicalStock: 0, peopleCapacity: 0, providerCost: 0 }); // Sin status
                setIsCreatingLocation(false);
            }
        }
    }, [isOpen, productToEdit, reset, setValue]);

    const mutation = useMutation({
        mutationFn: (data: CreateProductRequest) => {
            const payload = { ...data };
            
            if (isCreatingLocation) {
                payload.locationId = null; 
            } else {
                payload.newLocation = null; 
            }
            
            return productToEdit 
                ? updateProduct(productToEdit.id, payload) 
                : createProduct(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            if (isCreatingLocation) {
                queryClient.invalidateQueries({ queryKey: ["locations"] });
            }
            success(productToEdit ? "Producto actualizado." : "Producto creado exitosamente.");
            onClose();
        },
        onError: () => toastError("Error al guardar el producto.")
    });

    const onSubmit = (data: CreateProductRequest) => {
        mutation.mutate(data);
    };

    if (!isOpen) return null;

    return (
        <dialog className="modal modal-open bg-black/50 backdrop-blur-sm z-50">
            <div className="modal-box w-11/12 max-w-4xl p-0 overflow-hidden rounded-2xl bg-base-100 shadow-2xl">
                
                {/* HEADER */}
                <div className="px-6 py-4 border-b border-base-200 flex justify-between items-center bg-base-100 sticky top-0 z-10">
                    <div>
                        <h3 className="font-bold text-xl text-primary flex items-center gap-2">
                            <Box size={20}/>
                            {productToEdit ? "Editar Producto" : "Nuevo Producto"}
                        </h3>
                        <p className="text-xs text-base-content/60">
                            {productToEdit ? `Editando ID: ${productToEdit.id}` : "Complete la información del inventario"}
                        </p>
                    </div>
                    <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost text-base-content/50 hover:text-error">
                        <X size={20}/>
                    </button>
                </div>

                {/* BODY */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto max-h-[75vh] custom-scrollbar">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        
                        {/* COLUMNA 1 */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/40 mb-2">Información Básica</h4>

                            <TravesiaInput
                                label="Nombre del Producto"
                                placeholder="Ej: Habitación Doble Deluxe"
                                {...register("name", { required: "Nombre requerido", maxLength: 150 })}
                                error={errors.name?.message}
                            />

                            <div className="form-control">
                                <label className="label"><span className="label-text font-medium">Descripción</span></label>
                                <textarea 
                                    className="textarea textarea-bordered h-24 focus:border-primary focus:ring-1 focus:ring-primary/20 bg-base-100"
                                    placeholder="Detalles, características..."
                                    {...register("description")}
                                ></textarea>
                            </div>

                            <RichSelect
                                label="Categoría"
                                icon={<Tag size={14}/>}
                                placeholder="Seleccione Categoría"
                                isLoading={loadingCategories}
                                options={categories.map(c => ({ 
                                    value: c.numericCode, 
                                    label: c.name,
                                    subtitle: c.description
                                }))}
                                value={watch("categoryType")}
                                onChange={(val) => setValue("categoryType", Number(val))}
                                error={errors.categoryType ? "Requerido" : undefined}
                            />
                             <input type="hidden" {...register("categoryType", { required: true })} />
                        </div>

                        {/* COLUMNA 2 */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/40 mb-2">Logística y Costos</h4>

                            <RichSelect
                                label="Proveedor"
                                icon={<Store size={14}/>}
                                placeholder="Buscar Proveedor..."
                                isLoading={loadingProviders}
                                options={providers.map(p => ({
                                    value: p.id,
                                    label: p.name,
                                    subtitle: p.cityName 
                                }))}
                                value={watch("providerId")}
                                onChange={(val) => setValue("providerId", Number(val))}
                                error={errors.providerId ? "Requerido" : undefined}
                            />
                            <input type="hidden" {...register("providerId", { required: true })} />

                            <div className="grid grid-cols-2 gap-4">
                                <TravesiaInput
                                    label="Costo (Bs)"
                                    type="number"
                                    step="0.01"
                                    {...register("providerCost", { required: "Requerido", min: 0 })}
                                    error={errors.providerCost?.message}
                                />
                                
                                {/* ELIMINAMOS EL INPUT DE STOCK FÍSICO Y CAPACIDAD AQUI PARA REORGANIZAR */}
                                <TravesiaInput
                                    label="Stock Físico"
                                    type="number"
                                    {...register("physicalStock", { required: "Requerido", min: 0 })}
                                />
                            </div>

                            <div className="grid grid-cols-1">
                                <TravesiaInput
                                    label="Capacidad (Pers.)"
                                    type="number"
                                    {...register("peopleCapacity", { required: "Requerido", min: 0 })}
                                />
                            </div>
                            
                            {/* --- AQUÍ ESTABA EL SWITCH DE ESTADO, SE HA ELIMINADO --- */}
                        </div>
                    </div>

                    {/* SECCIÓN UBICACIÓN (Igual que antes) */}
                    <div className="mt-8 bg-base-200/40 p-5 rounded-xl border border-base-200">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60 flex items-center gap-2">
                                <MapPin size={16} className="text-primary"/> Ubicación de Almacenamiento
                            </h4>
                            
                            <div className="tabs tabs-boxed bg-base-100 border border-base-300 p-1 scale-90 origin-right">
                                <a 
                                    className={`tab h-8 min-h-0 text-xs font-bold rounded-md ${!isCreatingLocation ? 'tab-active bg-primary text-primary-content' : ''}`}
                                    onClick={() => setIsCreatingLocation(false)}
                                >
                                    Seleccionar Existente
                                </a>
                                <a 
                                    className={`tab h-8 min-h-0 text-xs font-bold rounded-md ${isCreatingLocation ? 'tab-active bg-primary text-primary-content' : ''}`}
                                    onClick={() => setIsCreatingLocation(true)}
                                >
                                    Crear Nueva
                                </a>
                            </div>
                        </div>

                        {isCreatingLocation ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                                <div className="md:col-span-1">
                                    <TravesiaInput
                                        label="Nombre Ubicación"
                                        placeholder="Ej: Almacén Central"
                                        {...register("newLocation.name", { required: isCreatingLocation ? "Nombre requerido" : false })}
                                        error={errors.newLocation?.name?.message}
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <TravesiaInput
                                        label="Dirección"
                                        placeholder="Calle, #, Zona"
                                        {...register("newLocation.address")}
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <TravesiaInput
                                        label="URL Mapa"
                                        placeholder="https://maps.google..."
                                        {...register("newLocation.mapUrl")}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="animate-fade-in">
                                <RichSelect
                                    label="Buscar Ubicación"
                                    placeholder="Seleccione dónde se encuentra..."
                                    isLoading={loadingLocations}
                                    icon={<MapPin size={14}/>}
                                    options={locations.map(l => ({
                                        value: l.id,
                                        label: l.name,
                                        subtitle: l.address,
                                        icon: <MapPin size={16}/>
                                    }))}
                                    value={watch("locationId")}
                                    onChange={(val) => setValue("locationId", Number(val))}
                                    error={errors.locationId && !isCreatingLocation ? "Debe seleccionar una ubicación" : undefined}
                                />
                                {!isCreatingLocation && (
                                    <input type="hidden" {...register("locationId", { required: true })} />
                                )}
                            </div>
                        )}
                    </div>

                </form>

                <div className="p-5 border-t border-base-200 bg-base-100 flex justify-end gap-3">
                    <BtnCancel onClick={onClose} />
                    <BtnSave 
                        onClick={handleSubmit(onSubmit)} 
                        isLoading={mutation.isPending} 
                    />
                </div>
            </div>
        </dialog>
    );
};