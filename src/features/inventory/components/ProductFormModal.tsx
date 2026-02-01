import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Box, Store, Tag, DollarSign } from "lucide-react"; 

// Hooks y Servicios
import { createProduct, updateProduct } from "../services/productService";
import { useProviders } from "../hooks/useProviders";
import { useLocations } from "../hooks/useLocations";
import { useParameters } from "../../../hooks/useParameters";
import { PARAM_CATEGORIES } from "../../../config/constants";
import { useToast } from "../../../context/ToastContext";

// UI Components
import { TravesiaInput } from "../../../components/ui/TravesiaInput";
import { TravesiaTextarea } from "../../../components/ui/TravesiaTextarea";
import { RichSelect } from "../../../components/ui/RichSelect";
import { BtnSave, BtnCancel, BtnNext, BtnBack } from "../../../components/ui/CrudButtons";
import { TravesiaModal } from "../../../components/ui/TravesiaModal";
import { TravesiaStepper } from "../../../components/ui/TravesiaStepper";
import { TravesiaImageUploader, ImageItem } from "../../../components/ui/TravesiaImageUploader";

// Types
import { CreateProductRequest, Product } from "../types";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    productToEdit?: Product | null;
}

const PRODUCT_STEPS = ["Información", "Precios y Stock", "Ubicación", "Imágenes"];

// Regex para validar máximo 2 decimales y números positivos
const PRICE_REGEX = /^\d+(\.\d{1,2})?$/;

export const ProductFormModal = ({ isOpen, onClose, productToEdit }: Props) => {
    const { success, error: toastError } = useToast();
    const queryClient = useQueryClient();
    
    // Hooks de datos
    const { data: providers = [], isLoading: loadingProviders } = useProviders();
    const { data: locations = [], isLoading: loadingLocations } = useLocations();
    const { parameters: categories, isLoading: loadingCategories } = useParameters(PARAM_CATEGORIES.PRODUCT_CATEGORY);

    // Estados Locales
    const [currentStep, setCurrentStep] = useState(1);
    const [manualShake, setManualShake] = useState(0);
    const [isCreatingLocation, setIsCreatingLocation] = useState(false);
    
    // Estado para Imágenes
    const [localImages, setLocalImages] = useState<ImageItem[]>([]);

    // Formulario
    const { 
        register, 
        handleSubmit, 
        setValue, 
        watch, 
        reset, 
        trigger,
        formState: { errors, submitCount } 
    } = useForm<CreateProductRequest>({
        defaultValues: {
            physicalStock: 0,
            peopleCapacity: 0,
            providerCost: 0,
            referencePrice: 0,
        }
    });

    const watchedCost = watch("providerCost");
    const watchedStock = watch("physicalStock");

    const totalProviderDebt = useMemo(() => {
        return (Number(watchedCost) || 0) * (Number(watchedStock) || 0);
    }, [watchedCost, watchedStock]);

    // --- EFECTOS ---
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(1);
            setManualShake(0);
            
            if (productToEdit) {
                // MODO EDICIÓN
                setValue("name", productToEdit.name);
                setValue("description", productToEdit.description);
                setValue("categoryType", productToEdit.categoryCode);
                
                setValue("physicalStock", productToEdit.physicalStock);
                setValue("peopleCapacity", productToEdit.peopleCapacity);
                
                setValue("providerCost", productToEdit.providerCost);
                setValue("referencePrice", (productToEdit as any).referencePrice || 0); 
                
                if (productToEdit.providerId) setValue("providerId", productToEdit.providerId);

                // Ubicación
                if (productToEdit.locationId) {
                    setIsCreatingLocation(false);
                    setValue("locationId", productToEdit.locationId);
                } else {
                    setIsCreatingLocation(false);
                }
                setLocalImages([]); 

            } else {
                // MODO CREAR
                reset({ 
                    physicalStock: 0, 
                    peopleCapacity: 0, 
                    providerCost: 0, 
                    referencePrice: 0 
                });
                setLocalImages([]);
                setIsCreatingLocation(false);
            }
        }
    }, [isOpen, productToEdit, reset, setValue]);

    // --- LÓGICA DE NAVEGACIÓN ---
    const handleNext = async () => {
        let fieldsToValidate: any[] = [];

        switch (currentStep) {
            case 1:
                fieldsToValidate = ["name", "description", "categoryType"];
                break;
            case 2:
                fieldsToValidate = ["providerId", "providerCost", "physicalStock", "peopleCapacity", "referencePrice"];
                break;
            case 3:
                if (isCreatingLocation) fieldsToValidate = ["newLocation.name"];
                else fieldsToValidate = ["locationId"];
                break;
            case 4:
                if (localImages.length === 0) {
                    setManualShake(prev => prev + 1);
                    return;
                }
                break;
        }

        const isValid = await trigger(fieldsToValidate);
        
        if (isValid) {
            if (currentStep < 4) {
                setCurrentStep(prev => prev + 1);
                setManualShake(0);
            }
        } else {
            setManualShake(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1);
    };

    const mutation = useMutation({
        mutationFn: (data: CreateProductRequest) => {
            const payload = { ...data };
            if (isCreatingLocation) payload.locationId = null; 
            else payload.newLocation = null;

            payload.images = localImages.map((img, index) => ({
                imageUrl: img.file.name,
                isCover: img.isCover,
                sortOrder: index + 1
            }));

            return productToEdit 
                ? updateProduct(productToEdit.id, payload) 
                : createProduct(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            if (isCreatingLocation) queryClient.invalidateQueries({ queryKey: ["locations"] });
            success(productToEdit ? "Producto actualizado." : "Producto creado exitosamente.");
            onClose();
        },
        onError: () => toastError("Error al guardar el producto.")
    });

    const onSubmit = (data: CreateProductRequest) => {
        mutation.mutate(data);
    };

    const modalTitle = (
        <div className="flex flex-col">
            <span className="flex items-center gap-2">
                <Box size={20} className="text-primary"/>
                {productToEdit ? "Editar Producto" : "Nuevo Producto"}
            </span>
        </div>
    );

    const modalActions = (
        <div className="flex justify-between w-full">
            <div>
                {currentStep > 1 && <BtnBack onClick={handleBack} />}
            </div>
            <div className="flex gap-2">
                <BtnCancel onClick={onClose} />
                {currentStep < 4 ? (
                    <BtnNext onClick={handleNext} />
                ) : (
                    <BtnSave 
                        onClick={handleSubmit(onSubmit)} 
                        isLoading={mutation.isPending} 
                        label={productToEdit ? "Guardar Cambios" : "Crear Producto"}
                    />
                )}
            </div>
        </div>
    );

    return (
        <TravesiaModal
            isOpen={isOpen}
            onClose={onClose}
            title={modalTitle}
            actions={modalActions}
            size="lg"
        >
            <TravesiaStepper 
                steps={PRODUCT_STEPS} 
                currentStep={currentStep} 
                className="mb-6"
            />

            <form className="min-h-[350px]">
                
                {/* --- PASO 1: INFORMACIÓN GENERAL --- */}
                <div className={currentStep === 1 ? "block space-y-4 animate-fade-in" : "hidden"}>
                    <TravesiaInput
                        label="Nombre del Producto"
                        placeholder="Ej: Habitación Doble Deluxe"
                        {...register("name", { required: "Nombre requerido", maxLength: 150 })}
                        error={errors.name?.message}
                        shakeKey={submitCount + manualShake}
                    />

                    <TravesiaTextarea 
                        label="Descripción"
                        placeholder="Detalles, características..."
                        {...register("description")}
                    />

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
                        // ✅ AGREGAMOS EL SHAKE
                        shakeKey={submitCount + manualShake}
                    />
                    <input type="hidden" {...register("categoryType", { required: true })} />
                </div>

                {/* --- PASO 2: PRECIOS Y STOCK --- */}
                <div className={currentStep === 2 ? "block space-y-6 animate-fade-in" : "hidden"}>
                    
                    <div className="bg-base-200/50 p-4 rounded-xl border border-base-200 space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/50 flex items-center gap-2">
                            <Store size={14}/> Datos de Compra (Proveedor)
                        </h4>
                        
<RichSelect
                            label="Proveedor"
                            placeholder="Buscar Proveedor..."
                            isLoading={loadingProviders}
                            shakeKey={submitCount + manualShake}
                            // FILTRO Y MAPEO
                            options={providers
                                // 1. Filtramos: Solo Confirmada (Activo) o Pendiente
                                .filter(p => 
                                    p.statusName.toLowerCase().includes('confirm') || 
                                    p.statusName.toLowerCase().includes('pendient')
                                )
                                // 2. Mapeamos agregando el Badge visual
                                .map(p => {
                                    // Determinamos color del badge
                                    const isConfirmed = p.statusName.toLowerCase().includes('confirm');
                                    const badgeClass = isConfirmed 
                                        ? "badge-success text-white" 
                                        : "badge-warning text-white";

                                    return {
                                        value: p.id,
                                        label: p.name,
                                        subtitle: p.cityName,
                                        // 3. Pasamos el componente visual a la derecha
                                        rightContent: (
                                            <span className={`badge ${badgeClass} text-[10px] font-bold border-0 h-5 px-2`}>
                                                {isConfirmed ? "ACTIVO" : "PENDIENTE"}
                                            </span>
                                        )
                                    };
                                })
                            }
                            value={watch("providerId")}
                            onChange={(val) => setValue("providerId", Number(val))}
                            error={errors.providerId ? "Requerido" : undefined}
                        />
                        <input type="hidden" {...register("providerId", { required: true })} />

                        <div className="grid grid-cols-2 gap-4">
                            <TravesiaInput
                                label="Costo Unitario (Bs)"
                                type="number"
                                step="0.01"
                                // ✅ VALIDACIÓN MEJORADA: Positivo y Regex Decimales
                                {...register("providerCost", { 
                                    required: "Requerido", 
                                    min: { value: 0.01, message: "Mayor a 0" },
                                    pattern: { value: PRICE_REGEX, message: "Máx. 2 decimales" }
                                })}
                                error={errors.providerCost?.message}
                                shakeKey={submitCount + manualShake}
                            />
                            <TravesiaInput
                                label="Stock Físico"
                                type="number"
                                // ✅ VALIDACIÓN MEJORADA: Entero Positivo (mínimo 1)
                                {...register("physicalStock", { 
                                    required: "Requerido", 
                                    min: { value: 1, message: "Mínimo 1" } 
                                })}
                                error={errors.physicalStock?.message}
                                shakeKey={submitCount + manualShake}
                            />
                        </div>

                        {(watchedCost > 0 && watchedStock > 0) && (
                            <div className="flex justify-between items-center bg-base-100 p-3 rounded-lg border border-base-300">
                                <span className="text-xs font-bold text-base-content/60">Inversión Total (Deuda):</span>
                                <span className="font-mono font-bold text-error">Bs. {totalProviderDebt.toFixed(2)}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/50 flex items-center gap-2">
                            <DollarSign size={14}/> Datos de Venta
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <TravesiaInput
                                label="Precio de Venta (Bs)"
                                type="number"
                                step="0.01"
                                className="input-success font-bold"
                                // ✅ VALIDACIÓN MEJORADA
                                {...register("referencePrice", { 
                                    required: "Requerido", 
                                    min: { value: 0.01, message: "Mayor a 0" },
                                    pattern: { value: PRICE_REGEX, message: "Máx. 2 decimales" }
                                })}
                                error={errors.referencePrice?.message}
                                shakeKey={submitCount + manualShake}
                            />
                            <TravesiaInput
                                label="Capacidad (Pers.)"
                                type="number"
                                // ✅ VALIDACIÓN MEJORADA
                                {...register("peopleCapacity", { 
                                    required: "Requerido", 
                                    min: { value: 1, message: "Mínimo 1" } 
                                })}
                                error={errors.peopleCapacity?.message}
                                shakeKey={submitCount + manualShake}
                            />
                        </div>
                    </div>
                </div>

                {/* --- PASO 3: UBICACIÓN --- */}
                <div className={currentStep === 3 ? "block space-y-4 animate-fade-in" : "hidden"}>
                    <div className="bg-base-200/40 p-5 rounded-xl border border-base-200 min-h-[200px]">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60 flex items-center gap-2">
                                <MapPin size={16} className="text-primary"/> Almacenamiento
                            </h4>
                            
                            <div className="tabs tabs-boxed bg-base-100 border border-base-300 p-1 scale-90 origin-right">
                                <a 
                                    className={`tab h-8 min-h-0 text-xs font-bold rounded-md ${!isCreatingLocation ? 'tab-active bg-primary text-primary-content' : ''}`}
                                    onClick={() => setIsCreatingLocation(false)}
                                >
                                    Existente
                                </a>
                                <a 
                                    className={`tab h-8 min-h-0 text-xs font-bold rounded-md ${isCreatingLocation ? 'tab-active bg-primary text-primary-content' : ''}`}
                                    onClick={() => setIsCreatingLocation(true)}
                                >
                                    Nueva
                                </a>
                            </div>
                        </div>

                        {isCreatingLocation ? (
                            <div className="space-y-4 animate-fade-in">
                                <TravesiaInput
                                    label="Nombre Ubicación"
                                    placeholder="Ej: Almacén Central"
                                    {...register("newLocation.name", { required: isCreatingLocation ? "Nombre requerido" : false })}
                                    error={errors.newLocation?.name?.message}
                                    shakeKey={submitCount + manualShake}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <TravesiaInput
                                        label="Dirección"
                                        placeholder="Calle, #..."
                                        {...register("newLocation.address")}
                                    />
                                    <TravesiaInput
                                        label="URL Mapa"
                                        placeholder="https://maps..."
                                        {...register("newLocation.mapUrl")}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="animate-fade-in pt-4">
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
                                    error={errors.locationId && !isCreatingLocation ? "Requerido" : undefined}
                                    // ✅ AGREGAMOS EL SHAKE
                                    shakeKey={submitCount + manualShake}
                                />
                                {!isCreatingLocation && (
                                    <input type="hidden" {...register("locationId", { required: true })} />
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- PASO 4: IMÁGENES --- */}
                <div className={currentStep === 4 ? "block space-y-4 animate-fade-in" : "hidden"}>
                    <TravesiaImageUploader 
                        images={localImages}
                        onChange={setLocalImages}
                        error={submitCount > 0 && localImages.length === 0 ? "Debes subir al menos una imagen" : undefined}
                        shakeKey={submitCount + manualShake}
                    />
                </div>

            </form>
        </TravesiaModal>
    );
};