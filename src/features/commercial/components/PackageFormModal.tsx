import { useEffect, useState, useMemo, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { 
    Box, ShoppingCart, Trash2, 
    Calculator, QrCode, DollarSign, Percent, 
    Users
} from "lucide-react"; 

// Servicios y Hooks
import { createPackage, updatePackage } from "../services/packageService";
import { useProducts } from "../../inventory/hooks/useProducts";
import { useParameters } from "../../../hooks/useParameters"; // Hook Params
import { PARAM_CATEGORIES, COMMISSION_CODES } from "../../../config/constants"; // Constantes
import { useToast } from "../../../context/ToastContext";
import { STORAGE_FOLDERS } from "../../../config/storage";
import { uploadFile } from "../../shared/services/storageService";

// UI Components
import { TravesiaModal } from "../../../components/ui/TravesiaModal";
import { TravesiaInput } from "../../../components/ui/TravesiaInput";
import { TravesiaTextarea } from "../../../components/ui/TravesiaTextarea";
import { TravesiaStepper } from "../../../components/ui/TravesiaStepper";
import { RichSelect } from "../../../components/ui/RichSelect";
import { BtnSave, BtnCancel, BtnNext, BtnBack } from "../../../components/ui/CrudButtons";
import { TravesiaBadge } from "../../../components/ui/TravesiaBadge";
import { TravesiaSingleImageUploader } from "../../../components/ui/TravesiaSingleImageUploader"; // Uploader

// Types
import type { CreatePackageRequest, Package, PackageDetailResponse } from "../types";
import type { Product } from "../../inventory/types";
import { TravesiaFinancialInput } from "../../../components/ui/TravesiaFinancialInput";
import { 
    getPackageDetails, addPackageDetail, 
    updatePackageDetail, deletePackageDetail 
} from "../services/packageService";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    packageToEdit?: Package | null;
}

interface SelectedProductItem {
    product: Product;
    quantity: number;
    detailId?: number; // Si existe, es un item que YA estaba en la base de datos
}

const FORM_STEPS = ["Datos Generales", "Productos", "Finanzas y Comisiones"];

export const PackageFormModal = ({ isOpen, onClose, packageToEdit }: Props) => {
    const { success, error: toastError } = useToast();
    const queryClient = useQueryClient();
    
    // Data Fetching
    const { data: availableProducts = [], isLoading: loadingProducts } = useProducts();
    const { parameters: commissionTypes, isLoading: loadingCommissions } = useParameters(PARAM_CATEGORIES.COMMISSION_TYPE);

    // Estados Locales
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedItems, setSelectedItems] = useState<SelectedProductItem[]>([]);
    const [originalDetails, setOriginalDetails] = useState<PackageDetailResponse[]>([]);
    const [manualShake, setManualShake] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    // Imágenes
    const [coverImage, setCoverImage] = useState<{ file?: File; preview: string } | null>(null);
    const [qrImage, setQrImage] = useState<{ file?: File; preview: string } | null>(null);
    const isEditInitialLoad = useRef(true);
    
    // Formulario
    const { 
        register, 
        control,
        handleSubmit, 
        setValue, 
        watch, 
        reset, 
        trigger, 
        formState: { errors, submitCount } 
    } = useForm<CreatePackageRequest>({
        defaultValues: {
            peopleCount: 1,
            totalPrice: 0,
            pricePerPerson: 0,
            minPrice: 0,
            commissionType: COMMISSION_CODES.PERCENTAGE, 
            commissionValue: 30
        }
    });

    const watchedPeopleCount = watch("peopleCount");
    const watchedTotalPrice = watch("totalPrice");
    const watchedCommissionType = watch("commissionType");

    // --- CÁLCULOS ---
    const calculatedMinPrice = useMemo(() => {
        return selectedItems.reduce((acc, item) => acc + (item.product.providerCost * item.quantity), 0);
    }, [selectedItems]);

    const calculatedReferenceTotal = useMemo(() => {
        return selectedItems.reduce((acc, item) => acc + (item.product.referencePrice * item.quantity), 0);
    }, [selectedItems]);

    // EFECTOS DE PRECIOS
    useEffect(() => {
        setValue("minPrice", Number(calculatedMinPrice.toFixed(2)));

        // Lógica Inteligente de Total Price
        if (selectedItems.length > 0) {
            const newRefPrice = Number(calculatedReferenceTotal.toFixed(2));

            if (packageToEdit) {
                // MODO EDICIÓN:
                // Si es la "Carga Inicial" (el useEffect se disparó porque cargamos los datos al abrir),
                // NO hacemos nada para respetar el precio que trajiste de la BD.
                if (isEditInitialLoad.current) {
                    isEditInitialLoad.current = false; // Bajamos la bandera para la próxima
                    return; 
                }
                
                // Si la bandera ya estaba baja (significa que el usuario agregó/borró items),
                // entonces SÍ forzamos la actualización del precio.
                setValue("totalPrice", newRefPrice);
                
            } else {
                // MODO CREACIÓN: Siempre actualizamos automáticamente
                setValue("totalPrice", newRefPrice);
            }

        } else {
            // Si no hay productos, el precio es 0
            setValue("totalPrice", 0);
        }
    }, [calculatedMinPrice, calculatedReferenceTotal, selectedItems.length, setValue, packageToEdit]);

    useEffect(() => {
        const count = Number(watchedPeopleCount) || 1;
        const total = Number(watchedTotalPrice) || 0;
        setValue("pricePerPerson", Number((total / count).toFixed(2)));
    }, [watchedTotalPrice, watchedPeopleCount, setValue]);

    // --- CARGA DE DATOS ---
    useEffect(() => {
        if (isOpen) {
            isEditInitialLoad.current = true;
            setCurrentStep(1);
            setManualShake(0);
            setIsUploading(false);
            
            if (packageToEdit) {
                setValue("name", packageToEdit.name);
                setValue("description", packageToEdit.description);
                setValue("peopleCount", packageToEdit.peopleCount);
                setValue("totalPrice", packageToEdit.totalPrice);
                setValue("minPrice", packageToEdit.minPrice);
                setValue("commissionType", packageToEdit.commissionTypeCode);
                setValue("commissionValue", packageToEdit.commissionValue);
                
                setCoverImage(packageToEdit.imageUrl ? { preview: packageToEdit.imageUrl } : null);
                setQrImage(packageToEdit.imageQrUrl ? { preview: packageToEdit.imageQrUrl } : null);

                // ✅ LOGICA DE CARGA DE DETALLES CON EL ENDPOINT ESPECÍFICO
                const loadDetails = async () => {
                    try {
                        // 1. Llamamos al endpoint específico
                        const details = await getPackageDetails(packageToEdit.id);
                        setOriginalDetails(details); // Guardamos snapshot original

                        // 2. Mapeamos a la estructura visual (SelectedProductItem)
                        const mappedItems: SelectedProductItem[] = details.map(d => {
                            // Buscamos el producto completo en 'availableProducts' para tener precios, nombre, etc.
                            // Nota: availableProducts debe estar cargado. Si es mucha data, 
                            // quizás debas usar el objeto 'd' para reconstruir un objeto Product parcial.
                            const productInfo = availableProducts.find(p => p.id === d.productId);
                            
                            // Fallback si no encontramos el producto en la lista general (raro pero posible)
                            if (!productInfo) return null; 

                            return {
                                product: productInfo,
                                quantity: d.quantity,
                                detailId: d.id // Importante: Guardamos el ID de la relación
                            };
                        }).filter(Boolean) as SelectedProductItem[];

                        setSelectedItems(mappedItems);
                    } catch (err) {
                        console.error("Error cargando detalles", err);
                        toastError("Error al cargar los productos del paquete.");
                    }
                };
                
                if (availableProducts.length > 0) {
                    loadDetails();
                }
            } else {
                reset({ peopleCount: 1, 
                        totalPrice: 0, 
                        minPrice: 0, 
                        commissionType: COMMISSION_CODES.PERCENTAGE, 
                        commissionValue: 30
                });
                setSelectedItems([]);
                setOriginalDetails([]);
                setCoverImage(null);
                setQrImage(null);
            }
        }
    }, [isOpen, packageToEdit, reset, setValue, availableProducts]);

    // --- HANDLERS ---
    const handleAddProduct = (productIdStr: string | number) => {
        const productId = Number(productIdStr);
        const product = availableProducts.find(p => p.id === productId);
        if (!product) return;

        const exists = selectedItems.find(item => item.product.id === product.id);
        if (exists) {
            handleUpdateQuantity(product.id, exists.quantity + 1);
            success(`Se agregó +1 a ${product.name}`);
        } else {
            setSelectedItems(prev => [...prev, { product, quantity: 1 }]);
        }
    };

    const handleRemoveProduct = (productId: number) => {
        setSelectedItems(prev => prev.filter(item => item.product.id !== productId));
    };

    const handleUpdateQuantity = (productId: number, newQty: number) => {
        if (newQty < 1) return;
        setSelectedItems(prev => prev.map(item => 
            item.product.id === productId ? { ...item, quantity: newQty } : item
        ));
    };

    // --- NAVEGACIÓN ---
    const handleNext = async () => {
        let fields: any[] = [];
        if (currentStep === 1) fields = ["name", "peopleCount", "description"];
        if (currentStep === 2) {
            if (selectedItems.length === 0) {
                toastError("Agrega al menos un producto.");
                setManualShake(prev => prev + 1);
                return;
            }
        }
        
        const isValid = await trigger(fields);
        if (isValid) {
            setCurrentStep(prev => prev + 1);
            setManualShake(0);
        } else {
            setManualShake(prev => prev + 1);
        }
    };

    // --- MUTATION & SUBMIT ---
    // const mutation = useMutation({
    //     mutationFn: (data: CreatePackageRequest) => {
    //         return packageToEdit ? updatePackage(packageToEdit.id, data) : createPackage(data);
    //     },
    //     onSuccess: () => {
    //         queryClient.invalidateQueries({ queryKey: ["packages"] });
    //         success(packageToEdit ? "Paquete actualizado." : "Paquete creado exitosamente.");
    //         onClose();
    //     },
    //     onError: (err: any) => {
    //         toastError(err.message || "Error al guardar.");
    //         setIsUploading(false);
    //     }
    // });

    const finishSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ["packages"] });
        success(packageToEdit ? "Paquete actualizado correctamente." : "Paquete creado exitosamente.");
        onClose();
        setIsUploading(false);
    };

    const onSubmit = async (data: CreatePackageRequest) => {
        setIsUploading(true);
        try {
            if (Number(data.totalPrice) < calculatedMinPrice) {
                throw new Error("El precio de venta no puede ser menor al costo base (minPrice).");
            }

            let finalCoverUrl = "";
            let finalQrUrl = "";

            if (coverImage) {
                if (coverImage.file) {
                    finalCoverUrl = await uploadFile(coverImage.file, STORAGE_FOLDERS.PACKAGES, `pkg-cover-${Date.now()}`);
                } else {
                    finalCoverUrl = coverImage.preview;
                }
            }

            if (qrImage) {
                if (qrImage.file) {
                    finalQrUrl = await uploadFile(qrImage.file, STORAGE_FOLDERS.QRS, `pkg-qr-${Date.now()}`);
                } else {
                    finalQrUrl = qrImage.preview;
                }
            }


            // 1. GUARDAR/ACTUALIZAR EL PAQUETE PADRE
            let currentPackageId = packageToEdit?.id;

            if (packageToEdit) {
                // MODO EDICIÓN: PUT /packages/{id} (Ignora detalles)
                // Enviamos data general (imágenes, nombre, precios)
                const payloadGeneral = { ...data, imageUrl: finalCoverUrl, imageQrUrl: finalQrUrl };
                await updatePackage(packageToEdit.id, payloadGeneral);
            } else {
                // MODO CREACIÓN: POST /packages (Crea todo junto)
                // Aquí SÍ mandamos packageDetails porque es creación
                const payloadNew = {
                    ...data,
                    imageUrl: finalCoverUrl,
                    imageQrUrl: finalQrUrl,
                    minPrice: calculatedMinPrice,
                    packageDetails: selectedItems.map(i => ({ 
                        productId: i.product.id, 
                        quantity: i.quantity 
                    }))
                };
                await createPackage(payloadNew);
                
                // Si es creación, terminamos aquí. El backend crea todo de una.
                finishSuccess();
                return; 
            }

            // ============================================================
            // 2. SINCRONIZACIÓN DE DETALLES (SOLO MODO EDICIÓN)
            // ============================================================
            if (packageToEdit && currentPackageId) {
                const promises: Promise<void>[] = [];

                // A. DETECTAR ELIMINADOS
                // Estaban en 'original' pero NO en 'selected'
                const toDelete = originalDetails.filter(original => 
                    !selectedItems.some(current => current.detailId === original.id)
                );
                toDelete.forEach(d => {
                    promises.push(deletePackageDetail(d.id));
                });

                // B. DETECTAR NUEVOS Y ACTUALIZACIONES
                selectedItems.forEach(current => {
                    if (!current.detailId) {
                        // --- NUEVO (No tiene detailId) ---
                        promises.push(addPackageDetail({
                            packageId: currentPackageId!,
                            productId: current.product.id,
                            quantity: current.quantity
                        }));
                    } else {
                        // --- EXISTENTE (Tiene detailId) ---
                        // Verificamos si la cantidad cambió para no hacer llamadas innecesarias
                        const original = originalDetails.find(od => od.id === current.detailId);
                        if (original && original.quantity !== current.quantity) {
                            // Actualizar
                            promises.push(updatePackageDetail(current.detailId, {
                                packageId: currentPackageId!,
                                productId: current.product.id,
                                quantity: current.quantity
                            }));
                        }
                    }
                });

                // C. EJECUTAR TODO EN PARALELO
                await Promise.all(promises);
            }

            finishSuccess();

            
            // mutation.mutate(payload);

        } catch (error: any) {
            console.error(error);
            toastError(error.message || "Error procesando datos");
            setIsUploading(false);
        }
    };

    const getCommissionHint = () => {
        const type = commissionTypes.find(c => c.numericCode === watchedCommissionType);
        if (!type) return "Seleccione tipo";
        return type.numericCode === COMMISSION_CODES.PERCENTAGE 
            ? "Porcentaje de ganancia por venta (Ej: 10 para 10%)" 
            : "Monto fijo de ganancia por venta (Ej: 50 Bs)";
    };

    return (
        <TravesiaModal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex flex-col">
                    <span className="flex items-center gap-2">
                        <Box size={20} className="text-primary"/>
                        {packageToEdit ? "Editar Paquete" : "Diseñar Nuevo Paquete"}
                    </span>
                </div>
            }
            actions={
                <div className="flex justify-between w-full">
                    <div>{currentStep > 1 && <BtnBack onClick={() => setCurrentStep(prev => prev - 1)} />}</div>
                    <div className="flex gap-2">
                        <BtnCancel onClick={onClose} disabled={isUploading} />
                        {currentStep < 3 ? (
                            <BtnNext onClick={handleNext} />
                        ) : (
                            <BtnSave 
                                onClick={handleSubmit(onSubmit)} 
                                isLoading={isUploading} 
                                label={isUploading ? "Subiendo..." : "Guardar"}
                            />
                        )}
                    </div>
                </div>
            }
            size="xl"
        >
            <TravesiaStepper steps={FORM_STEPS} currentStep={currentStep} className="mb-6"/>

            <form className="min-h-[400px]">
                
                {/* === PASO 1: GENERAL === */}
                <div className={currentStep === 1 ? "block space-y-5 animate-fade-in" : "hidden"}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <TravesiaInput
                                label="Nombre del Paquete"
                                {...register("name", { required: "Nombre requerido", maxLength: 200 })}
                                error={errors.name?.message}
                                shakeKey={submitCount + manualShake}
                            />
                            <TravesiaTextarea label="Descripción" {...register("description")} />
                            <TravesiaInput
                                label="Cantidad de Personas"
                                type="number"
                                icon="users"
                                {...register("peopleCount", { required: "Requerido", min: 1 })}
                                error={errors.peopleCount?.message}
                                shakeKey={submitCount + manualShake}
                            />
                        </div>
                        <div className="space-y-4">
                            <div className="bg-base-200/30 p-4 rounded-xl border border-base-200">
                                <span className="text-xs font-bold uppercase opacity-60 mb-2 block">Imagen de Portada</span>
                                <TravesiaSingleImageUploader value={coverImage} onChange={setCoverImage} />
                            </div>
                            <div className="bg-base-200/30 p-4 rounded-xl border border-base-200">
                                <span className="text-xs font-bold uppercase opacity-60 mb-2 items-center gap-1">
                                    <QrCode size={14}/> Código QR (Cobros)
                                </span>
                                <TravesiaSingleImageUploader value={qrImage} onChange={setQrImage} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* === PASO 2: PRODUCTOS === */}
                <div className={currentStep === 2 ? "block space-y-6 animate-fade-in" : "hidden"}>
                    <div className="bg-base-200/50 p-4 rounded-xl border border-base-200">
                        <label className="label font-bold text-sm text-base-content/70">Agregar Productos al Paquete</label>
                        <RichSelect 
                            label=""
                            placeholder="Buscar producto..."
                            options={availableProducts.map(p => ({
                                value: p.id,
                                label: p.name,
                                subtitle: `Ref. Venta: Bs. ${p.referencePrice} | Stock: ${p.physicalStock}`,
                                icon: <ShoppingCart size={16}/>
                            }))}
                            value={null} 
                            onChange={(val) => handleAddProduct(val)}
                            isLoading={loadingProducts}
                            shakeKey={submitCount + manualShake}
                            error={manualShake > 0 && selectedItems.length === 0 ? "Debes agregar al menos un producto" : undefined}
                        />
                    </div>

                    {/* ✅ VISTA HÍBRIDA (Responsiva) */}
                    <div className="border border-base-300 rounded-xl overflow-hidden bg-base-100">
                        
                        {/* 🖥️ VISTA TABLA (SOLO ESCRITORIO - hidden md:block) */}
                        <div className="hidden md:block">
                            <table className="table table-sm w-full">
                                <thead className="bg-base-200">
                                    <tr>
                                        <th>Producto</th>
                                        {/* ✅ NUEVA COLUMNA HEADER */}
                                        <th className="text-center w-16">Cap.</th> 
                                        <th className="text-center w-20">Stock</th>
                                        <th className="text-center">Costo Prov.</th>
                                        <th className="text-center">Ref. Venta</th>
                                        <th className="text-center w-32">Cant.</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedItems.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-8 opacity-50">Sin productos seleccionados</td></tr>
                                    ) : (
                                        selectedItems.map(item => (
                                            <tr key={item.product.id}>
                                                <td>
                                                    <div className="font-bold">{item.product.name}</div>
                                                    <div className="text-xs opacity-60">{item.product.categoryName}</div>
                                                </td>
                                                {/* ✅ NUEVA COLUMNA BODY */}
                                                <td className="text-center">
                                                    <div className="badge badge-sm border-pink-200 bg-pink-50 text-pink-600 gap-1 text-xs font-bold" title="Capacidad de Personas">
                                                        <Users size={12} /> {item.product.peopleCapacity}
                                                    </div>
                                                </td>
                                                {/* ✅ CELDA STOCK */}
                                                <td className="text-center">
                                                    <div className="badge badge-sm border-purple-200 bg-purple-50 text-purple-600 gap-1 text-xs font-bold" title="Stock Físico Disponible">
                                                        <Box size={12} /> {item.product.physicalStock}
                                                    </div>
                                                </td>
                                                <td className="text-center text-xs">Bs. {item.product.providerCost}</td>
                                                <td className="text-center text-xs font-bold text-primary">Bs. {item.product.referencePrice}</td>
                                                <td className="text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button type="button" className="btn btn-xs btn-circle" onClick={() => item.quantity > 1 && handleUpdateQuantity(item.product.id, item.quantity - 1)}>-</button>
                                                        <span className="font-bold w-6 text-center">{item.quantity}</span>
                                                        <button type="button" className="btn btn-xs btn-circle" onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}>+</button>
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => handleRemoveProduct(item.product.id)}><Trash2 size={16}/></button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* 📱 VISTA TARJETAS (SOLO MÓVIL - md:hidden) */}
                        <div className="md:hidden p-3 space-y-3 bg-base-200/30">
                            {selectedItems.length === 0 ? (
                                <div className="text-center py-8 text-base-content/40 bg-base-100 rounded-xl border border-dashed border-base-300">
                                    <div className="flex flex-col items-center gap-2">
                                        <ShoppingCart size={32} />
                                        <span>Selecciona productos arriba.</span>
                                    </div>
                                </div>
                            ) : (
                                selectedItems.map((item) => (
                                    <div key={item.product.id} className="bg-base-100 p-4 rounded-xl shadow-sm border border-base-200 relative">
                                        
                                        {/* Header Tarjeta: Nombre y Botón Borrar */}
                                        <div className="flex justify-between items-start gap-3 mb-3">
                                            <div>
                                                <h4 className="font-bold text-sm text-base-content">{item.product.name}</h4>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {/* Usamos tu TravesiaBadge */}
                                                    <TravesiaBadge 
                                                        label={item.product.categoryName} 
                                                        code={item.product.categoryCode} 
                                                        type="PRODUCT_CATEGORY"
                                                        className="scale-75 origin-left" 
                                                    />
                                                    
                                                    {/* ✅ NUEVO INDICADOR MÓVIL (Al lado de la categoría) */}
                                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-pink-200 bg-pink-50 text-pink-600">
                                                        <Users size={12} /> {item.product.peopleCapacity}
                                                    </div>
                                                    {/* ✅ NUEVO INDICADOR STOCK MÓVIL */}
                                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-purple-200 bg-purple-50 text-purple-600">
                                                        <Box size={12} /> {item.product.physicalStock}
                                                    </div>
                                                </div>
                                            </div>
                                            <button 
                                                type="button" 
                                                className="btn btn-sm btn-ghost btn-square text-error -mr-2 -mt-2"
                                                onClick={() => handleRemoveProduct(item.product.id)}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        {/* Body Tarjeta: Controles y Precios */}
                                        <div className="flex items-center justify-between bg-base-200/50 p-3 rounded-lg">
                                            
                                            {/* Control de Cantidad Grande */}
                                            <div className="flex items-center gap-3">
                                                <button 
                                                    type="button" 
                                                    className="btn btn-sm btn-circle bg-base-100 shadow-sm border-base-300"
                                                    onClick={() => {
                                                        if(item.quantity === 1) handleRemoveProduct(item.product.id);
                                                        else handleUpdateQuantity(item.product.id, item.quantity - 1);
                                                    }}
                                                >-</button>
                                                <span className="font-bold w-4 text-center">{item.quantity}</span>
                                                <button 
                                                    type="button" 
                                                    className="btn btn-sm btn-circle btn-primary shadow-sm"
                                                    onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                                                >+</button>
                                            </div>

                                            {/* Subtotal */}
                                            <div className="text-right">
                                                <div className="text-[10px] opacity-60">Unit: {item.product.providerCost}</div>
                                                <div className="font-mono font-bold text-primary">
                                                    Bs. {(item.product.providerCost * item.quantity).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        {/* Footer común (Totales) */}
                        <div className="bg-base-200/80 p-3 flex justify-between items-center border-t border-base-300 text-xs">
                            <span className="font-bold uppercase opacity-60">Costo Base Interno (MinPrice):</span>
                            <span className="font-mono font-bold">Bs. {calculatedMinPrice.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* === PASO 3: FINANZAS === */}
                <div className={currentStep === 3 ? "block space-y-6 animate-fade-in" : "hidden"}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div className="space-y-4">
                            <h4 className="font-bold text-sm flex items-center gap-2"><DollarSign size={16}/> Precios del Paquete</h4>
                            
                    {/* ✅ USO DEL COMPONENTE REUTILIZABLE: PRECIO TOTAL */}
                            <Controller
                                control={control}
                                name="totalPrice"
                                rules={{ 
                                    required: "Requerido", 
                                    min: { value: calculatedMinPrice, message: `Mínimo Bs. ${calculatedMinPrice}` } 
                                }}
                                render={({ field: { onChange, value, ref } }) => (
                                    <TravesiaFinancialInput
                                        ref={ref}
                                        label="Precio Total Venta"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        disabled={selectedItems.length > 1}
                                        // Pasamos clases específicas para estilo financiero grande
                                        className={`font-mono text-lg font-bold ${Number(watchedTotalPrice) < calculatedMinPrice ? 'text-error' : 'text-success'}`}
                                        value={value} 
                                        onValueChange={onChange}
                                        // El badge condicional se pasa como prop
                                        badge={selectedItems.length > 1 && (
                                            <span className="badge badge-ghost badge-xs">Auto-calculado</span>
                                        )}
                                        // React Hook Form props
                                        // {...register("totalPrice", { 
                                        //     required: "Requerido", 
                                        //     min: { value: calculatedMinPrice, message: `Mínimo Bs. ${calculatedMinPrice}` } 
                                        // })}
                                        error={errors.totalPrice?.message}
                                    />
                                )}
                            />
                                
                            <div className="flex justify-between items-center bg-base-200 p-3 rounded-lg">
                                <span className="text-xs">Precio por Persona:</span>
                                <span className="font-mono font-bold text-primary">Bs. {watch("pricePerPerson")?.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="space-y-4 bg-base-200/30 p-4 rounded-xl border border-base-200">
                            <h4 className="font-bold text-sm flex items-center gap-2"><Percent size={16}/> Comisión Vendedor</h4>
                            
                            <RichSelect
                                label="Tipo de Comisión"
                                placeholder="Seleccione Tipo"
                                options={commissionTypes.map(c => ({
                                    value: c.numericCode,
                                    label: c.name,
                                    subtitle: c.description
                                }))}
                                value={watch("commissionType")}
                                onChange={(val) => setValue("commissionType", Number(val))}
                                error={errors.commissionType ? "Requerido" : undefined}
                                isLoading={loadingCommissions}
                            />
                            <input type="hidden" {...register("commissionType", { required: true })} />
                            <Controller
                                    control={control}
                                    name="commissionValue"
                                    rules={{ required: "Requerido", min: 1 }}
                                    render={({ field: { onChange, value, ref } }) => (
                                    <TravesiaFinancialInput
                                        ref={ref}
                                        label="Valor de la Comisión"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        // El botón derecho es simplemente un string que pasamos como suffix
                                        suffix={watchedCommissionType === COMMISSION_CODES.PERCENTAGE ? "%" : "Bs"}
                                        // El texto de ayuda inferior
                                        helperText={getCommissionHint()}
                                        value={value}
                                        onValueChange={onChange}
                                        // React Hook Form
                                        // {...register("commissionValue", { required: "Requerido", min: 1 })}
                                        error={errors.commissionValue?.message}
                                    />
                                )}
                            />
                        </div>
                    </div>

                    <div className="alert bg-info/10 border-info/20 text-xs mt-4">
                        <Calculator size={16} className="text-info"/>
                        <div className="flex flex-col">
                            <span className="font-bold">Estimación de Margen Bruto:</span>
                            <span>Precio Venta (Bs. {watchedTotalPrice}) - Costo Prov. (Bs. {calculatedMinPrice.toFixed(2)}) = 
                                <strong className="ml-1 text-success">Bs. {(Number(watchedTotalPrice) - calculatedMinPrice).toFixed(2)}</strong>
                            </span>
                        </div>
                    </div>
                </div>

            </form>
        </TravesiaModal>
    );
};