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
import { TravesiaTextarea } from "../../../components/ui/TravesiaTextarea"; // ✅ Tu componente nuevo
import { TravesiaStepper } from "../../../components/ui/TravesiaStepper";   // ✅ El componente Stepper
import { RichSelect } from "../../../components/ui/RichSelect";
import { BtnSave, BtnCancel, BtnNext, BtnBack } from "../../../components/ui/CrudButtons";
import { TravesiaBadge } from "../../../components/ui/TravesiaBadge";

// Types
import { CreatePackageRequest, Package } from "../types";
import { Product } from "../../inventory/types";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    packageToEdit?: Package | null;
}

interface SelectedProductItem {
    product: Product;
    quantity: number;
}

// ✅ DEFINIMOS LOS PASOS AQUÍ (Configurable: Si quieres 3, agregas uno más al array)
const FORM_STEPS = ["Información General", "Composición y Precios"];

export const PackageFormModal = ({ isOpen, onClose, packageToEdit }: Props) => {
    const { success, error: toastError } = useToast();
    const queryClient = useQueryClient();
    
    const { data: availableProducts = [], isLoading: loadingProducts } = useProducts();

    // Estados Locales
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedItems, setSelectedItems] = useState<SelectedProductItem[]>([]);
    const [manualShake, setManualShake] = useState(0); 

    // Formulario
    const { 
        register, 
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
            pricePerPerson: 0
        }
    });

    const watchedPeopleCount = watch("peopleCount");
    const watchedTotalPrice = watch("totalPrice");

    // --- CÁLCULOS ---
    const baseCost = useMemo(() => {
        return selectedItems.reduce((acc, item) => acc + (item.product.providerCost * item.quantity), 0);
    }, [selectedItems]);

    useEffect(() => {
        setValue("totalPrice", Number(baseCost.toFixed(2)));
        const count = Number(watchedPeopleCount) || 1;
        const perPerson = baseCost / count;
        setValue("pricePerPerson", Number(perPerson.toFixed(2)));
    }, [baseCost, watchedPeopleCount, setValue]);

    // --- CARGA DE DATOS ---
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(1);
            setManualShake(0);
            
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
                    if (foundProd) reconstructedItems.push({ product: foundProd, quantity: detail.quantity });
                });
                setSelectedItems(reconstructedItems);
            } else {
                reset({ peopleCount: 1, totalPrice: 0, pricePerPerson: 0 });
                setSelectedItems([]);
            }
        }
    }, [isOpen, packageToEdit, reset, setValue, availableProducts]);

    // --- HANDLERS PRODUCTOS ---
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

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) setValue("imageUrl", e.target.files[0].name);
    };

    // --- NAVEGACIÓN WIZARD ---
    const handleNext = async () => {
        const validStep1 = await trigger(["name", "peopleCount", "description"]);
        if (validStep1) {
            setCurrentStep(2);
            setManualShake(0);
        } else {
            setManualShake(prev => prev + 1);
        }
    };

    const mutation = useMutation({
        mutationFn: (data: CreatePackageRequest) => {
            if (selectedItems.length === 0) throw new Error("Debes agregar al menos un producto.");
            if (Number(data.totalPrice) < baseCost) throw new Error(`El precio total no puede ser menor al costo base.`);

            const payload: CreatePackageRequest = {
                ...data,
                packageDetails: selectedItems.map(item => ({
                    productId: item.product.id,
                    quantity: item.quantity
                }))
            };

            return packageToEdit ? updatePackage(packageToEdit.id, payload) : createPackage(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["packages"] });
            success(packageToEdit ? "Paquete actualizado." : "Paquete creado exitosamente.");
            onClose();
        },
        onError: (err: any) => {
            toastError(err.message || "Error al guardar.");
            setManualShake(prev => prev + 1);
        }
    });

    // --- RENDERIZADO ---
    const modalTitle = (
        <div className="flex flex-col">
            <span className="flex items-center gap-2">
                <Box size={20} className="text-primary"/>
                {packageToEdit ? "Editar Paquete" : "Diseñar Nuevo Paquete"}
            </span>
            {/* Subtítulo eliminado, ahora lo maneja el Stepper visualmente */}
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
                        onClick={handleSubmit((data) => mutation.mutate(data))} 
                        isLoading={mutation.isPending} 
                        label={packageToEdit ? "Guardar Cambios" : "Crear Paquete"}
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
            {/* ✅ AQUI ESTÁ EL COMPONENTE REUTILIZABLE */}
            <TravesiaStepper 
                steps={FORM_STEPS} 
                currentStep={currentStep} 
            />

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
                                shakeKey={submitCount + manualShake}
                            />
                            
                            {/* Componente Textarea Reutilizable */}
                            <TravesiaTextarea 
                                label="Descripción"
                                placeholder="Describe qué incluye este paquete..."
                                {...register("description")}
                            />

                            <TravesiaInput
                                label="Cantidad de Personas"
                                type="number"
                                icon="users"
                                placeholder="1"
                                {...register("peopleCount", { required: "Requerido", min: 1 })}
                                error={errors.peopleCount?.message}
                                shakeKey={submitCount + manualShake}
                            />
                        </div>

                        {/* Imagen */}
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
                    
                    {/* Selector */}
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
                            value={null} 
                            onChange={(val) => handleAddProduct(val)}
                            isLoading={loadingProducts}
                        />
                    </div>

                    {/* Tabla (Igual que antes...) */}
                    {/* 2. LISTA DE PRODUCTOS (RESPONSIVE) */}
                    <div className="border border-base-300 rounded-xl overflow-hidden bg-base-100">
                        
                        {/* --- A. VISTA DE TABLA (SOLO PC - md:block) --- */}
                        <div className="hidden md:block">
                            <table className="table table-sm w-full">
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
                            </table>
                        </div>

                        {/* --- B. VISTA DE TARJETAS (SOLO MÓVIL - md:hidden) --- */}
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
                                                    <TravesiaBadge 
                                                        label={item.product.categoryName} 
                                                        code={item.product.categoryCode} 
                                                        type="PRODUCT_CATEGORY"
                                                        className="scale-75 origin-left" // Badge un poco más pequeño en móvil
                                                    />
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
                                            
                                            {/* Control de Cantidad (Más grande para dedos) */}
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

                        {/* Footer Común (Costo Base Total) */}
                        {selectedItems.length > 0 && (
                            <div className="bg-base-200/80 p-3 flex justify-between items-center border-t border-base-300">
                                <span className="text-xs font-bold uppercase opacity-60">Costo Base Total:</span>
                                <span className="font-mono font-bold text-base-content">Bs. {baseCost.toFixed(2)}</span>
                            </div>
                        )}
                    </div>

                    {/* Calculadora (Igual que antes...) */}
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
                            {/* <p className="text-xs opacity-60">Precio final para el cliente</p> */}
                        </div>

                        <div className="bg-base-200 p-4 rounded-xl flex flex-col justify-center items-end text-right border border-base-300">
                            <span className="text-xs font-bold uppercase opacity-50 flex items-center gap-1">
                                <Calculator size={12}/> Precio por Persona
                            </span>
                            <span className="text-3xl font-mono font-black text-primary">
                                Bs. {watch("pricePerPerson")?.toFixed(2) || "0.00"}
                            </span>
                        </div>
                    </div>
                </div>
            </form>
        </TravesiaModal>
    );
};