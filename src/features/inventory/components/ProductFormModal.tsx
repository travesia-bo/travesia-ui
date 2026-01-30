import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Box, Store, Tag } from "lucide-react"; 

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
import { BtnSave, BtnCancel } from "../../../components/ui/CrudButtons";
import { TravesiaModal } from "../../../components/ui/TravesiaModal"; // ✅ Importamos el Modal Base

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
                
                if (productToEdit.providerId) setValue("providerId", productToEdit.providerId);

                if (productToEdit.locationId) {
                    setIsCreatingLocation(false);
                    setValue("locationId", productToEdit.locationId);
                } else {
                    setIsCreatingLocation(false);
                }

            } else {
                // MODO CREAR
                reset({ physicalStock: 0, peopleCapacity: 0, providerCost: 0 });
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

    // ✅ TÍTULO DINÁMICO (Con Icono opcional)
    const modalTitle = (
        <div className="flex flex-col">
            <span className="flex items-center gap-2">
                <Box size={20} className="text-primary"/>
                {productToEdit ? "Editar Producto" : "Nuevo Producto"}
            </span>
            {productToEdit && (
                <span className="text-xs font-normal text-base-content/60 ml-7">
                    Editando ID: {productToEdit.id}
                </span>
            )}
        </div>
    );

    // ✅ BOTONES DE ACCIÓN (Footer)
    const modalActions = (
        <>
            <BtnCancel onClick={onClose} />
            <BtnSave 
                onClick={handleSubmit(onSubmit)} 
                isLoading={mutation.isPending} 
            />
        </>
    );

    return (
        <TravesiaModal
            isOpen={isOpen}
            onClose={onClose}
            title={modalTitle}     // Pasamos el título al componente base
            actions={modalActions} // Pasamos los botones al componente base
            size="lg"              // Usamos tamaño grande
        >
            {/* SOLO EL FORMULARIO (Sin headers ni footers extra) */}
            <form className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                
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
                </div>

                {/* SECCIÓN UBICACIÓN (Ancho completo) */}
                <div className="md:col-span-2 mt-4 bg-base-200/40 p-5 rounded-xl border border-base-200">
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
        </TravesiaModal>
    );
};