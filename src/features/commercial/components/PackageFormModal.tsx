import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
    Box, FileImage, Users, DollarSign, ShoppingCart, 
    Trash2, AlertTriangle, Calculator 
} from "lucide-react"; 

// Servicios y Hooks
import { createPackage, updatePackage } from "../services/packageService";
import { useProducts } from "../../inventory/hooks/useProducts";
import { useToast } from "../../../context/ToastContext";

// UI Components
import { TravesiaModal } from "../../../components/ui/TravesiaModal";
import { TravesiaInput } from "../../../components/ui/TravesiaInput";
import { RichSelect } from "../../../components/ui/RichSelect";
import { BtnSave, BtnCancel, BtnNext, BtnBack } from "../../../components/ui/CrudButtons";
import { TravesiaBadge } from "../../../components/ui/TravesiaBadge";

// Types
import { CreatePackageRequest, Package } from "../types";
import { Product } from "../../inventory/types";
import { TravesiaTextarea } from "../../../components/ui/TravesiaTextarea";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    packageToEdit?: Package | null;
}

interface SelectedProductItem {
    product: Product;
    quantity: number;
}

export const PackageFormModal = ({ isOpen, onClose, packageToEdit }: Props) => {
    const { success, error: toastError } = useToast();
    const queryClient = useQueryClient();
    
    const { data: availableProducts = [], isLoading: loadingProducts } = useProducts();

    // Estados Locales
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedItems, setSelectedItems] = useState<SelectedProductItem[]>([]);
    
    // ✅ CORRECCIÓN SHAKE: Estado para forzar la animación
    const [manualShake, setManualShake] = useState(0); 

    // Formulario
    const { 
        register, 
        handleSubmit, 
        setValue, 
        watch, 
        reset, 
        trigger, 
        formState: { errors, submitCount } // ✅ Importamos submitCount
    } = useForm<CreatePackageRequest>({
        defaultValues: {
            peopleCount: 1,
            totalPrice: 0,
            pricePerPerson: 0
        }
    });

    const watchedPeopleCount = watch("peopleCount");
    const watchedTotalPrice = watch("totalPrice");

    // --- CÁLCULOS AUTOMÁTICOS ---

    // 1. Costo Base (Suma dinámica)
    const baseCost = useMemo(() => {
        return selectedItems.reduce((acc, item) => {
            return acc + (item.product.providerCost * item.quantity);
        }, 0);
    }, [selectedItems]);

    // 2. Sincronización de Precios (CORREGIDO)
    // Cada vez que cambia el Costo Base (por agregar, quitar o editar items), 
    // actualizamos el Precio Total automáticamente para que coincida.
    useEffect(() => {
        // Asignamos el costo base al precio total
        setValue("totalPrice", Number(baseCost.toFixed(2)));
        
        // Recalculamos precio por persona
        const count = Number(watchedPeopleCount) || 1;
        const perPerson = baseCost / count;
        setValue("pricePerPerson", Number(perPerson.toFixed(2)));

    }, [baseCost, watchedPeopleCount, setValue]); 
    // Nota: Al quitar 'watchedTotalPrice' de las dependencias, evitamos bucles si el usuario edita manual,
    // pero si cambia los items, se reseteará al costo base (que es el comportamiento seguro deseado).

    // --- CARGA DE DATOS (EDICIÓN) ---
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(1);
            setManualShake(0); // Reset shake
            
            if (packageToEdit) {
                setValue("name", packageToEdit.name);
                setValue("description", packageToEdit.description);
                setValue("imageUrl", packageToEdit.imageUrl || "");
                setValue("peopleCount", packageToEdit.peopleCount);
                setValue("totalPrice", packageToEdit.totalPrice);
                setValue("pricePerPerson", packageToEdit.pricePerPerson);

                const reconstructedItems: SelectedProductItem[] = [];
                packageToEdit.details.forEach(detail => {
                    const foundProd = availableProducts.find(p => p.id === detail.productId);
                    if (foundProd) {
                        reconstructedItems.push({
                            product: foundProd,
                            quantity: detail.quantity
                        });
                    }
                });
                setSelectedItems(reconstructedItems);

            } else {
                reset({ peopleCount: 1, totalPrice: 0, pricePerPerson: 0 });
                setSelectedItems([]);
            }
        }
    }, [isOpen, packageToEdit, reset, setValue, availableProducts]);

    // --- MANEJO DE PRODUCTOS (SELECCIÓN AUTOMÁTICA) ---

    // ✅ AHORA RECIBE EL ID Y AGREGA DIRECTAMENTE
    const handleAddProduct = (productIdStr: string | number) => {
        const productId = Number(productIdStr);
        const product = availableProducts.find(p => p.id === productId);
        
        if (!product) return;

        // Verificar si ya existe
        const exists = selectedItems.find(item => item.product.id === product.id);
        
        if (exists) {
            // Si existe, aumentamos cantidad +1 automáticamente
            handleUpdateQuantity(product.id, exists.quantity + 1);
            success(`Se agregó +1 a ${product.name}`);
        } else {
            // Si no, agregamos nuevo a la lista
            setSelectedItems(prev => [...prev, { product, quantity: 1 }]);
        }
    };

    const handleRemoveProduct = (productId: number) => {
        setSelectedItems(prev => prev.filter(item => item.product.id !== productId));
    };

    const handleUpdateQuantity = (productId: number, newQty: number) => {
        if (newQty < 1) return; // No permitir 0 o negativos
        setSelectedItems(prev => prev.map(item => 
            item.product.id === productId ? { ...item, quantity: newQty } : item
        ));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setValue("imageUrl", e.target.files[0].name);
        }
    };

    // --- LOGICA WIZARD CON SHAKE ---
    const handleNext = async () => {
        const validStep1 = await trigger(["name", "peopleCount", "description"]);
        if (validStep1) {
            setCurrentStep(2);
            setManualShake(0); // Reset al cambiar de paso
        } else {
            // ✅ CORRECCIÓN: Si falla, aumentamos el contador para forzar re-render de animación
            setManualShake(prev => prev + 1);
        }
    };

    const mutation = useMutation({
        mutationFn: (data: CreatePackageRequest) => {
            if (selectedItems.length === 0) throw new Error("Debes agregar al menos un producto.");
            if (Number(data.totalPrice) < baseCost) throw new Error(`El precio total no puede ser menor al costo base (Bs. ${baseCost})`);

            const payload: CreatePackageRequest = {
                ...data,
                packageDetails: selectedItems.map(item => ({
                    productId: item.product.id,
                    quantity: item.quantity
                }))
            };

            return packageToEdit 
                ? updatePackage(packageToEdit.id, payload) 
                : createPackage(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["packages"] });
            success(packageToEdit ? "Paquete actualizado." : "Paquete creado exitosamente.");
            onClose();
        },
        onError: (err: any) => {
            toastError(err.message || "Error al guardar el paquete.");
            setManualShake(prev => prev + 1); // Shake si hay error de lógica
        }
    });

    const onSubmit = (data: CreatePackageRequest) => {
        mutation.mutate(data);
    };

    // --- RENDERIZADO ---
    const modalTitle = (
        <div className="flex flex-col">
            <span className="flex items-center gap-2">
                <Box size={20} className="text-primary"/>
                {packageToEdit ? "Editar Paquete" : "Diseñar Nuevo Paquete"}
            </span>
            <span className="text-xs font-normal text-base-content/60 ml-7">
                {currentStep === 1 ? "Paso 1: Información General" : "Paso 2: Composición y Precios"}
            </span>
        </div>
    );

    const modalActions = (
        <div className="flex justify-between w-full">
            <div>
                {currentStep === 2 && <BtnBack onClick={() => setCurrentStep(1)} />}
            </div>
            <div className="flex gap-2">
                <BtnCancel onClick={onClose} />
                {currentStep === 1 ? (
                    <BtnNext onClick={handleNext} />
                ) : (
                    <BtnSave 
                        onClick={handleSubmit(onSubmit)} 
                        isLoading={mutation.isPending} 
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
            size="xl"
        >
            <form className="min-h-[400px]">
                
                {/* --- PASO 1 --- */}
                <div className={currentStep === 1 ? "block space-y-5 animate-fade-in" : "hidden"}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <TravesiaInput
                                label="Nombre del Paquete"
                                placeholder="Ej: Paquete Fin de Semana Premium"
                                {...register("name", { required: "Nombre requerido", maxLength: 200 })}
                                error={errors.name?.message}
                                // ✅ PASAMOS EL KEY COMBINADO PARA EL SHAKE
                                shakeKey={submitCount + manualShake}
                            />
                            
                            {/* ✅ AQUI EL CAMBIO: Usamos el componente reutilizable */}
                            <TravesiaTextarea
                                label="Descripción"
                                placeholder="Describe qué incluye este paquete..."
                                {...register("description")}
                                // Si quieres validación, la agregas aquí:
                                // error={errors.description?.message} 
                                // shakeKey={submitCount + manualShake}
                            />

                            <TravesiaInput
                                label="Cantidad de Personas"
                                type="number"
                                icon="users"
                                placeholder="1"
                                {...register("peopleCount", { required: "Requerido", min: { value: 1, message: "Mínimo 1" } })}
                                error={errors.peopleCount?.message}
                                shakeKey={submitCount + manualShake}
                            />
                        </div>

                        {/* Imagen (Mantenido igual) */}
                        <div className="space-y-4">
                             <div className="form-control">
                                <label className="label"><span className="label-text font-medium flex gap-2"><FileImage size={16}/> Imagen de Portada</span></label>
                                <div className="border-2 border-dashed border-base-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-base-200/50 transition-colors cursor-pointer relative">
                                    <input 
                                        type="file" 
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleImageChange}
                                        accept="image/*"
                                    />
                                    {watch("imageUrl") ? (
                                        <div className="flex flex-col items-center text-success">
                                            <FileImage size={48} />
                                            <span className="mt-2 font-bold text-sm break-all">{watch("imageUrl")}</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-base-content/40">
                                            <FileImage size={48} />
                                            <span className="mt-2 font-medium">Click para subir imagen</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- PASO 2 --- */}
                <div className={currentStep === 2 ? "block space-y-6 animate-fade-in" : "hidden"}>
                    
                    {/* 1. SELECTOR AUTOMÁTICO (Sin botón +) */}
                    <div className="bg-base-200/50 p-4 rounded-xl border border-base-200">
                        <label className="label font-bold text-sm text-base-content/70">Agregar Productos al Paquete</label>
                        <RichSelect 
                            label=""
                            placeholder="Buscar y click para agregar..."
                            options={availableProducts.map(p => ({
                                value: p.id,
                                label: p.name,
                                subtitle: `Stock: ${p.physicalStock} | Costo: Bs. ${p.providerCost}`,
                                icon: <ShoppingCart size={16}/>
                            }))}
                            // ✅ MODIFICADO: No value (para resetear visualmente) y onChange dispara la adición directa
                            value={null} 
                            onChange={(val) => handleAddProduct(val)}
                            isLoading={loadingProducts}
                        />
                    </div>

                    {/* 2. TABLA INTERACTIVA */}
                    <div className="overflow-hidden border border-base-300 rounded-xl">
                        <table className="table table-sm w-full bg-base-100">
                            <thead className="bg-base-200 text-base-content/70">
                                <tr>
                                    <th>Producto</th>
                                    <th>Categoría</th>
                                    <th className="text-center">Costo Unit.</th>
                                    <th className="text-center w-32">Cantidad</th>
                                    <th className="text-right">Subtotal</th>
                                    <th className="w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-base-content/40">
                                            <div className="flex flex-col items-center gap-2">
                                                <ShoppingCart size={32} />
                                                <span>Selecciona productos arriba para empezar.</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    selectedItems.map((item) => (
                                        <tr key={item.product.id} className="hover">
                                            <td>
                                                <div className="font-bold">{item.product.name}</div>
                                                <div className="text-xs opacity-60 truncate max-w-[150px]">{item.product.description}</div>
                                            </td>
                                            <td>
                                                <TravesiaBadge 
                                                    label={item.product.categoryName} 
                                                    code={item.product.categoryCode} 
                                                    type="PRODUCT_CATEGORY"
                                                />
                                            </td>
                                            <td className="text-center font-mono text-xs">Bs. {item.product.providerCost}</td>
                                            <td>
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        type="button" 
                                                        className="btn btn-xs btn-circle btn-ghost border border-base-300 hover:bg-error/10 hover:text-error"
                                                        onClick={() => {
                                                            if(item.quantity === 1) handleRemoveProduct(item.product.id);
                                                            else handleUpdateQuantity(item.product.id, item.quantity - 1);
                                                        }}
                                                    >-</button>
                                                    <span className="font-bold w-6 text-center">{item.quantity}</span>
                                                    <button 
                                                        type="button" 
                                                        className="btn btn-xs btn-circle btn-ghost border border-base-300 hover:bg-primary/10 hover:text-primary"
                                                        onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                                                    >+</button>
                                                </div>
                                            </td>
                                            <td className="text-right font-mono font-bold">
                                                Bs. {(item.product.providerCost * item.quantity).toFixed(2)}
                                            </td>
                                            <td className="text-center">
                                                <button 
                                                    type="button" 
                                                    className="btn btn-ghost btn-xs text-error"
                                                    onClick={() => handleRemoveProduct(item.product.id)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {selectedItems.length > 0 && (
                                <tfoot className="bg-base-200/50 font-bold">
                                    <tr>
                                        <td colSpan={4} className="text-right text-xs uppercase opacity-60">Costo Base (Proveedor):</td>
                                        <td className="text-right text-base-content">Bs. {baseCost.toFixed(2)}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>

                    {/* 3. CALCULADORA */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-base-200">
                        <div className="space-y-2">
                            <label className="flex items-center justify-between text-sm font-bold">
                                <span className="flex items-center gap-2">
                                    <DollarSign size={16} className="text-success"/> Precio Total de Venta
                                </span>
                                {watchedTotalPrice < baseCost && (
                                    <span className="text-xs text-error flex items-center gap-1 animate-pulse">
                                        <AlertTriangle size={12}/> Menor al costo base!
                                    </span>
                                )}
                            </label>
                            <input 
                                type="number"
                                step="0.01"
                                className={`input input-bordered w-full font-mono text-lg font-bold ${watchedTotalPrice < baseCost ? 'input-error text-error' : 'input-success'}`}
                                placeholder="0.00"
                                {...register("totalPrice", { 
                                    required: "Define el precio", 
                                    min: { value: baseCost, message: "No puedes perder dinero" } 
                                })}
                            />
                            <p className="text-xs opacity-60">Precio final para el cliente (debe ser mayor a Bs. {baseCost.toFixed(2)})</p>
                        </div>

                        <div className="bg-base-200 p-4 rounded-xl flex flex-col justify-center items-end text-right border border-base-300">
                            <span className="text-xs font-bold uppercase opacity-50 flex items-center gap-1">
                                <Calculator size={12}/> Precio por Persona
                            </span>
                            <span className="text-3xl font-mono font-black text-primary">
                                Bs. {watch("pricePerPerson")?.toFixed(2) || "0.00"}
                            </span>
                            <span className="text-xs opacity-60 mt-1">
                                (Bs. {watchedTotalPrice || 0} ÷ {watchedPeopleCount || 1} personas)
                            </span>
                        </div>
                    </div>
                </div>
            </form>
        </TravesiaModal>
    );
};