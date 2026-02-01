import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query"; 
import { toast } from "sonner"; 

// Hooks y Contextos
import { useCities } from "../../../hooks/useCities";
import { useParameters } from "../../../hooks/useParameters";
import { PARAM_CATEGORIES } from "../../../config/constants";
import { useToast } from "../../../context/ToastContext";

// Servicios y Tipos
import { createProvider, updateProvider } from "../services/providerService"; 
import { Provider } from "../types";

// UI Components
import { TravesiaModal } from "../../../components/ui/TravesiaModal";
import { TravesiaInput } from "../../../components/ui/TravesiaInput";
import { TravesiaSelect } from "../../../components/ui/TravesiaSelect";
import { TravesiaStepper } from "../../../components/ui/TravesiaStepper"; // ✅ 1. IMPORTAR STEPPER
import { BtnSave, BtnCancel, BtnBack, BtnNext } from "../../../components/ui/CrudButtons";

// 2. DEFINICIÓN DE LOS PASOS
const PROVIDER_STEPS = ["Datos del Contacto", "Datos de la Empresa"];

// ESQUEMA DE VALIDACIÓN
const providerSchema = z.object({
    // --- PASO 1: PERSONA (Contacto) ---
    contactFirstName: z.string().min(1, "El nombre es obligatorio").max(100),
    contactPaternalSurname: z.string().max(45).optional(),
    contactMaternalSurname: z.string().max(45).optional(),
    contactIdentityCard: z.string().max(45).optional(),
    contactPhoneNumber: z.coerce.number({ invalid_type_error: "Debe ser un número" }).min(60000000, "Número inválido (mín 8 dígitos)"), 
    contactEmail: z.string().email("Correo inválido").optional().or(z.literal("")), 
    imageUrl: z.string().optional(),

    // --- PASO 2: PROVEEDOR (Empresa) ---
    name: z.string().min(1, "El nombre de la empresa es obligatorio").max(45),
    address: z.string().min(5, "Dirección muy corta (mín 5 letras)").max(200),
    cityId: z.coerce.string().min(1, "Debe seleccionar una ciudad"), 
    statusType: z.coerce.string().min(1, "Debe seleccionar un estado"),
});

type ProviderFormData = z.infer<typeof providerSchema>;

interface Props {
    isOpen: boolean;
    onClose: () => void;
    providerToEdit?: Provider | null;
}

export const ProviderFormModal = ({ isOpen, onClose, providerToEdit }: Props) => {
    const { success, error: toastError } = useToast();
    const queryClient = useQueryClient();

    // Hooks de datos
    const { data: cities = [], isLoading: loadingCities } = useCities();
    const { parameters: statuses, isLoading: loadingStatuses } = useParameters(PARAM_CATEGORIES.PROVIDER_STATUS);

    // Estado del Wizard
    const [currentStep, setCurrentStep] = useState(1);
    const [manualShake, setManualShake] = useState(0);

    // Formulario
    const { register, handleSubmit, reset, trigger, formState: { errors, submitCount } } = useForm<ProviderFormData>({
        resolver: zodResolver(providerSchema),
        defaultValues: {
            contactFirstName: "", contactPaternalSurname: "", contactMaternalSurname: "", 
            contactPhoneNumber: undefined, contactEmail: "", 
            name: "", address: "", cityId: "", statusType: ""
        }
    });

    // Resetear al abrir/cerrar y Cargar Datos
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(1);
            setManualShake(0);

            if (providerToEdit) {
                // MODO EDICIÓN
                reset({
                    contactFirstName: providerToEdit.contactFirstName,
                    contactPaternalSurname: providerToEdit.contactPaternalSurname || "", 
                    contactMaternalSurname: providerToEdit.contactMaternalSurname || "", 
                    contactIdentityCard: providerToEdit.contactIdentityCard || "", 
                    contactPhoneNumber: providerToEdit.contactPhoneNumber,
                    contactEmail: providerToEdit.contactEmail || "",
                    
                    name: providerToEdit.name,
                    address: providerToEdit.address,
                    
                    cityId: providerToEdit.cityId.toString(), 
                    statusType: providerToEdit.statusCode.toString(), 
                });
            } else {
                // MODO CREAR
                reset({
                    contactFirstName: "", contactPaternalSurname: "", contactMaternalSurname: "", 
                    contactIdentityCard: "", contactPhoneNumber: undefined, contactEmail: "", 
                    name: "", address: "", cityId: "", statusType: ""
                });
            }
        }
    }, [isOpen, providerToEdit, reset]);

    // --- LÓGICA DE NAVEGACIÓN ---
    const handleNextStep = async () => {
        const isValidStep1 = await trigger([
            "contactFirstName", "contactPhoneNumber", "contactEmail",
            "contactPaternalSurname", "contactMaternalSurname"
        ]);
        
        if (isValidStep1) {
            setCurrentStep(2);
            setManualShake(0); // Resetear shake al cambiar de paso
        } else {
            setManualShake(prev => prev + 1);
        }
    };

    const handlePrevStep = () => setCurrentStep(1);

    // --- MUTATION ---
    const mutation = useMutation({
        mutationFn: (data: any) => {
            if (providerToEdit) return updateProvider(providerToEdit.id, data);
            return createProvider(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['providers'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            const action = providerToEdit ? "actualizado" : "creado";
            success(`Proveedor ${action} correctamente.`);
            onClose();
        },
        onError: (error: any) => {
            console.error("Error al guardar:", error);
            toastError("No se pudo guardar el proveedor.");
        }
    });

    const onSubmit = async (data: ProviderFormData) => {
        const payload = {
            ...data,
            cityId: Number(data.cityId),
            statusType: Number(data.statusType),
            contactPhoneNumber: Number(data.contactPhoneNumber),
            contactEmail: data.contactEmail || null, 
            imageUrl: null 
        };
        mutation.mutate(payload); 
    };

    return (
        <TravesiaModal
            isOpen={isOpen}
            onClose={onClose}
            title={providerToEdit ? "Editar Proveedor" : "Nuevo Proveedor"}
            actions={
                <div className="flex justify-between w-full">
                    <div>
                        {currentStep === 2 && (
                            <BtnBack onClick={handlePrevStep} />
                        )}
                    </div>
                    
                    <div className="flex gap-2">
                        <BtnCancel onClick={onClose} disabled={mutation.isPending} />
                        
                        {currentStep === 1 ? (
                            <BtnNext onClick={handleNextStep} />
                        ) : (
                            <BtnSave 
                                label={mutation.isPending ? "Guardando..." : "Guardar"} 
                                isLoading={mutation.isPending}
                                onClick={handleSubmit(onSubmit)} 
                            />
                        )}
                    </div>
                </div>
            }
        >
            {/* ✅ 3. REEMPLAZO: USAMOS EL COMPONENTE REUTILIZABLE */}
            <TravesiaStepper 
                steps={PROVIDER_STEPS} 
                currentStep={currentStep} 
                className="mb-6"
            />

            <form className="min-h-[300px]">
                
                {/* --- PASO 1: DATOS DE PERSONA --- */}
                <div className={currentStep === 1 ? "block space-y-4 animate-fade-in" : "hidden"}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TravesiaInput 
                            label="Nombres" 
                            placeholder="Ej: Juan Daniel"
                            error={errors.contactFirstName?.message}
                            shakeKey={submitCount + manualShake}
                            isRequired
                            {...register("contactFirstName")}
                        />
                        <TravesiaInput 
                            label="Apellido Paterno" 
                            placeholder="Ej: Gutierritos"
                            error={errors.contactPaternalSurname?.message}
                            {...register("contactPaternalSurname")}
                        />
                        <TravesiaInput 
                            label="Apellido Materno" 
                            placeholder="Ej: Ceballos"
                            error={errors.contactMaternalSurname?.message}
                            {...register("contactMaternalSurname")}
                        />
                        <TravesiaInput 
                            label="Cédula de Identidad" 
                            placeholder="Ej: 849302 LP"
                            error={errors.contactIdentityCard?.message}
                            {...register("contactIdentityCard")}
                        />
                    </div>
                    
                    <div className="divider text-xs text-base-content/50">Medios de Contacto</div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TravesiaInput 
                            label="Teléfono / Celular" 
                            type="number"
                            placeholder="70012345"
                            icon="phone"
                            isRequired
                            error={errors.contactPhoneNumber?.message}
                            shakeKey={submitCount + manualShake}
                            {...register("contactPhoneNumber")}
                        />
                        <TravesiaInput 
                            label="Correo Electrónico" 
                            placeholder="juan@email.com"
                            icon="mail"
                            error={errors.contactEmail?.message}
                            {...register("contactEmail")}
                        />
                    </div>
                </div>

                {/* --- PASO 2: DATOS DEL PROVEEDOR --- */}
                <div className={currentStep === 2 ? "block space-y-4 animate-fade-in" : "hidden"}>
                    
                    <TravesiaInput 
                        label="Nombre Comercial / Empresa" 
                        placeholder="Ej: Hotel Los Ceibos"
                        shakeKey={submitCount + manualShake}
                        isRequired
                        error={errors.name?.message}
                        {...register("name")}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TravesiaSelect 
                            label="Ciudad"
                            options={cities.map(c => ({ value: c.id, label: c.name }))}
                            isLoading={loadingCities}
                            shakeKey={submitCount + manualShake}
                            isRequired
                            error={errors.cityId?.message}
                            {...register("cityId")}
                        />
                        
                        <TravesiaSelect 
                            label="Estado Inicial"
                            options={statuses.map(s => ({ value: s.numericCode, label: s.name }))}
                            isLoading={loadingStatuses}
                            shakeKey={submitCount + manualShake}
                            isRequired
                            error={errors.statusType?.message}
                            {...register("statusType")}
                        />
                    </div>

                    <TravesiaInput 
                        label="Dirección Física" 
                        placeholder="Av. Principal #123, Zona Sur"
                        icon="map-pin"
                        shakeKey={submitCount + manualShake}
                        isRequired
                        error={errors.address?.message}
                        {...register("address")}
                    />
                </div>

            </form>
        </TravesiaModal>
    );
};