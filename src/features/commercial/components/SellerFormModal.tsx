import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, UserCog, Target, CheckCircle2 } from "lucide-react";

// Servicios y Tipos
import { createSeller, updateSeller } from "../services/sellerService";
import type { SellerResponse } from "../types/index";
import { useToast } from "../../../context/ToastContext";
import { useParameters } from "../../../hooks/useParameters";

// UI Components
import { TravesiaModal } from "../../../components/ui/TravesiaModal";
import { TravesiaInput } from "../../../components/ui/TravesiaInput";
import { TravesiaSelect } from "../../../components/ui/TravesiaSelect";
import { TravesiaSwitch } from "../../../components/ui/TravesiaSwitch";
import { TravesiaStepper } from "../../../components/ui/TravesiaStepper";
import { BtnSave, BtnCancel, BtnNext, BtnBack } from "../../../components/ui/CrudButtons";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    sellerToEdit?: SellerResponse | null;
}

// === ESQUEMAS DE VALIDACIÓN ZOD ===

// Esquema Base (Compartido por Create y Update)
// Esquema Base (Compartido por Create y Update)
const baseSellerSchema = z.object({
    firstName: z.string().min(2, "Mínimo 2 letras"),
    paternalSurname: z.string().optional().nullable(),
    maternalSurname: z.string().optional().nullable(),
    
    // ✅ SOLUCIÓN ANTI-NaN: Transformamos manual y validamos el NaN nosotros mismos
    phoneNumber: z.any()
        .transform(Number)
        .refine((n) => !isNaN(n) && n >= 60000000, "Celular inválido"),
    
    email: z.string().email("Email inválido").optional().nullable().or(z.literal("")),
    identityCard: z.string().optional().nullable(),
    
    // Perfil Vendedor (También protegidos contra NaN)
    targetType: z.any()
        .transform(Number)
        .refine((n) => !isNaN(n) && n > 0, "Seleccione un tipo de meta"),
        
    targetValue: z.any()
        .transform(Number)
        .refine((n) => !isNaN(n) && n >= 0, "Meta no válida"),
        
    isCommissionExempt: z.boolean(),
});

// Esquema para CREAR (Añade Password)
const createSchema = baseSellerSchema.extend({
    rawPassword: z.string().min(6, "Mínimo 6 caracteres"),
});

type SellerFormData = z.infer<typeof baseSellerSchema> & {
    rawPassword?: string;
};

export const SellerFormModal = ({ isOpen, onClose, sellerToEdit }: Props) => {
    const { success, error: toastError } = useToast();
    const queryClient = useQueryClient();
    
    const [currentStep, setCurrentStep] = useState(1);
    const [manualShake, setManualShake] = useState(0);

    // Fetch Parámetros (Tipo de Meta, ej: 801, 802)
    const { parameters: targetTypes, isLoading: loadingTargetTypes } = useParameters("TARGET_TYPE");

    // Elegimos el esquema dinámicamente: Si edita NO pide password
    const schema = sellerToEdit ? baseSellerSchema : createSchema;
    
    // Configuración de Pasos Dinámicos
    const FORM_STEPS = sellerToEdit 
        ? ["Datos Personales", "Metas y Comisiones"] // 2 Pasos
        : ["Datos Personales", "Seguridad", "Metas y Comisiones"]; // 3 Pasos

    const { register, control, handleSubmit, reset, watch, trigger, formState: { errors } } = useForm<SellerFormData>({
        resolver: zodResolver(schema as any),
        defaultValues: {
            firstName: "", paternalSurname: "", maternalSurname: "",
            phoneNumber: "" as unknown as number, email: "", identityCard: "",
            rawPassword: "", // Ya no dará error
            targetType: 641, 
            targetValue: 0, isCommissionExempt: false
        }
    });

    const isExempt = watch("isCommissionExempt");

    // Cargar datos si estamos editando
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(1);
            setManualShake(0);

            if (sellerToEdit) {
                reset({
                    firstName: sellerToEdit.firstName || "",
                    paternalSurname: sellerToEdit.paternalSurname || "",
                    maternalSurname: sellerToEdit.maternalSurname || "",
                    phoneNumber: Number(sellerToEdit.phoneNumber) || undefined,
                    email: sellerToEdit.email || "",
                    identityCard: sellerToEdit.identityCard || "",
                    // Password no va
                    targetType: sellerToEdit.targetTypeCode || 641,
                    targetValue: sellerToEdit.targetValue || 0,
                    isCommissionExempt: sellerToEdit.isCommissionExempt || false
                });
            } else {
                reset({
                    firstName: "", paternalSurname: "", maternalSurname: "",
                    phoneNumber: undefined, email: "", identityCard: "",
                    rawPassword: "", 
                    targetType: 641,
                    targetValue: 0, isCommissionExempt: false
                });
            }
        }
    }, [isOpen, sellerToEdit, reset]);

    // Mutación Guardar / Editar
    const mutation = useMutation({
        mutationFn: (data: any) => {
            // Limpieza final antes de enviar
            const payload = {
                ...data,
                targetValue: data.isCommissionExempt ? 0 : data.targetValue // Si es exento, la meta es 0
            };

            if (sellerToEdit) {
                // Al editar, quitamos rawPassword por si acaso
                const { rawPassword, ...updatePayload } = payload;
                return updateSeller(sellerToEdit.id, updatePayload);
            }
            return createSeller(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sellers"] });
            success(sellerToEdit ? "Vendedor actualizado" : "Vendedor creado con éxito");
            onClose();
        },
        onError: (err: any) => {
            toastError(err.response?.data?.message || "Error al procesar el vendedor");
        }
    });

    // Navegación entre pasos
    const handleNext = async () => {
        let fieldsToValidate: string[] = [];
        
        if (currentStep === 1) {
            fieldsToValidate = ["firstName", "paternalSurname", "phoneNumber", "email", "identityCard"];
        } else if (currentStep === 2 && !sellerToEdit) {
            fieldsToValidate = ["rawPassword"];
        }

        const isValid = await trigger(fieldsToValidate as any);
        if (isValid) {
            setCurrentStep(prev => prev + 1);
            setManualShake(0);
        } else {
            setManualShake(prev => prev + 1);
        }
    };

    const onSubmit = (data: any) => {
        mutation.mutate(data);
    };

    return (
        <TravesiaModal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    {sellerToEdit ? <UserCog className="text-primary"/> : <UserPlus className="text-secondary"/>}
                    <span>{sellerToEdit ? "Editar Vendedor" : "Nuevo Vendedor"}</span>
                </div>
            }
            size="lg"
            actions={
                <div className="flex justify-between w-full">
                     <div>{currentStep > 1 && <BtnBack onClick={() => setCurrentStep(prev => prev - 1)} />}</div>
                     <div className="flex gap-2">
                        <BtnCancel onClick={onClose} disabled={mutation.isPending} />
                        {currentStep < FORM_STEPS.length ? (
                            <BtnNext onClick={handleNext} />
                        ) : (
                            <BtnSave onClick={handleSubmit(onSubmit)} isLoading={mutation.isPending} />
                        )}
                    </div>
                </div>
            }
        >
            <div className="flex flex-col h-full min-h-[350px]">
                
                <div className="flex-shrink-0 mb-6 w-full">
                    <TravesiaStepper steps={FORM_STEPS} currentStep={currentStep} />
                </div>

                <div className="flex-1 px-1">
                    <form className="space-y-6">
                        
                        {/* === PASO 1: DATOS PERSONALES === */}
                        <div className={currentStep === 1 ? "block space-y-4 animate-fade-in" : "hidden"}>
                            <TravesiaInput
                                label="Nombres"
                                placeholder="Ej: Juan Pablo"
                                uppercase
                                isRequired
                                {...register("firstName")}
                                error={errors.firstName?.message as string}
                                shakeKey={manualShake}
                            />
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <TravesiaInput
                                    label="Ap. Paterno"
                                    placeholder="Pérez"
                                    uppercase
                                    {...register("paternalSurname")}
                                />
                                <TravesiaInput
                                    label="Ap. Materno"
                                    placeholder="(Opcional)"
                                    uppercase
                                    {...register("maternalSurname")}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <TravesiaInput
                                    label="Carnet de Identidad"
                                    placeholder="1234567 LP"
                                    uppercase
                                    {...register("identityCard")}
                                />
                                <TravesiaInput
                                    label="Celular"
                                    type="number"
                                    placeholder="70000000"
                                    icon="phone"
                                    isRequired
                                    onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        if (e.target.value.length > 8) {
                                            e.target.value = e.target.value.slice(0, 8);
                                        }
                                    }}
                                    {...register("phoneNumber", { valueAsNumber: true })}
                                    error={errors.phoneNumber?.message as string}
                                />
                            </div>
                            
                            <TravesiaInput
                                label="Correo Electrónico"
                                type="email"
                                placeholder="juan@empresa.com"
                                icon="mail"
                                {...register("email")}
                                error={errors.email?.message as string}
                            />
                        </div>

                        {/* === PASO 2: SEGURIDAD (SOLO CREACIÓN) === */}
                        {!sellerToEdit && (
                            <div className={currentStep === 2 ? "block space-y-4 animate-fade-in" : "hidden"}>
                                <div className="alert bg-base-200 border-none text-sm">
                                    <CheckCircle2 size={16} className="text-success" />
                                    <span>El usuario de acceso será generado automáticamente basado en sus nombres y carnet.</span>
                                </div>
                                <TravesiaInput
                                    label="Contraseña Temporal"
                                    type="text"
                                    placeholder="Mínimo 6 caracteres..."
                                    isRequired
                                    {...register("rawPassword")}
                                    error={errors.rawPassword?.message as string}
                                    shakeKey={manualShake}
                                />
                            </div>
                        )}

                        {/* === PASO 3: METAS Y COMISIONES (Es el 2 al editar, y 3 al crear) === */}
                        <div className={currentStep === FORM_STEPS.length ? "block space-y-5 animate-fade-in" : "hidden"}>
                            <div className="bg-base-200/50 p-4 rounded-xl border border-base-200 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Target size={18} className="text-secondary" />
                                        <span className="font-bold text-sm">Configuración de Metas</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-base-100 px-3 py-1.5 rounded-lg border border-base-300 shadow-sm">
                                        <span className="text-xs font-bold opacity-70">¿Exento de Metas?</span>
                                        <Controller
                                            control={control}
                                            name="isCommissionExempt"
                                            render={({ field: { onChange, value } }) => (
                                                <TravesiaSwitch 
                                                    checked={value} 
                                                    onChange={() => onChange(!value)} 
                                                />
                                            )}
                                        />
                                    </div>
                                </div>

                                {!isExempt ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 animate-fade-in">
                                        <Controller
                                            control={control}
                                            name="targetType"
                                            render={({ field: { onChange, value } }) => (
                                                <TravesiaSelect
                                                    label="Tipo de Meta"
                                                    options={[
                                                        ...(targetTypes || []).map((p: any) => ({
                                                            value: p.numericCode, 
                                                            label: p.name
                                                        }))
                                                    ]}
                                                    isLoading={loadingTargetTypes}
                                                    value={value}
                                                    onChange={(e) => onChange(Number(e.target.value))}
                                                    error={errors.targetType?.message as string}
                                                    isRequired
                                                />
                                            )}
                                        />
                                        
                                        <TravesiaInput
                                            label="Valor de la Meta (Bs.)"
                                            type="number"
                                            step="0.01"
                                            placeholder="Ej: 10000"
                                            isRequired
                                            {...register("targetValue", { valueAsNumber: true })}
                                            error={errors.targetValue?.message as string}
                                        />
                                    </div>
                                ) : (
                                    <div className="alert bg-success/10 border-success/20 text-success text-sm py-3 mt-2 animate-fade-in">
                                        <CheckCircle2 size={16} />
                                        Este vendedor no tendrá exigencias de metas para ganar comisiones.
                                    </div>
                                )}
                            </div>
                        </div>

                    </form>
                </div>
            </div>
        </TravesiaModal>
    );
};