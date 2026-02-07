// src/features/sales/components/ReservationFormModal.tsx
import { useState, useEffect } from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShoppingCart, AlertCircle } from "lucide-react";

// Servicios y Tipos
import { createReservation } from "../services/reservationService";
import type { SellerPackage } from "../types";
import { useToast } from "../../../context/ToastContext";

// UI Components
import { TravesiaModal } from "../../../components/ui/TravesiaModal";
import { TravesiaTextarea } from "../../../components/ui/TravesiaTextarea";
import { TravesiaDateTimePicker } from "../../../components/ui/TravesiaDateTimePicker";
import { BtnSave, BtnCancel, BtnNext, BtnBack } from "../../../components/ui/CrudButtons";
import { ClientSlot } from "./Reservation/ClientSlot";
import { TravesiaStepper } from "../../../components/ui/TravesiaStepper";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    pkg: SellerPackage | null;
}

// === ESQUEMA DE VALIDACIÓN ZOD ===
// Este es el truco para validar que o tiene ID o tiene DATOS
const clientSchema = z.object({
    agreedPrice: z.coerce.number().min(0, "Precio inválido"),
    clientId: z.number().nullable().optional(),
    newClientData: z.object({
        firstName: z.string().min(2, "Mínimo 2 letras"),
        paternalSurname: z.string().min(2, "Requerido"),
        maternalSurname: z.string().optional().nullable(),
        phoneNumber: z.coerce.number().min(60000000, "Celular inválido"),
        email: z.string().email().optional().nullable().or(z.literal("")),
        identityCard: z.string().min(4, "CI requerido"),
        cityId: z.coerce.number().min(1, "Ciudad requerida"),
        birthDate: z.string().optional().nullable(),
        // ✅ Asegurar que estos sean tratados como números en el esquema
        clientType: z.coerce.number().min(1, "Tipo de cliente es requerido"),
        genderType: z.coerce.number().min(1, "Género es requerido"),
        careerId: z.coerce.number().min(1, "Carrera es requerida"),
    }).nullable().optional()
}).superRefine((data, ctx) => {
    // Validación Senior: O tiene ID, o tiene Datos Nuevos. No ambos nulos.
    if (!data.clientId && !data.newClientData) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Selecciona un cliente o llena los datos del nuevo",
            path: ["clientId"] // Mostramos el error en el select
        });
    }
});

const reservationSchema = z.object({
    observations: z.string().optional(),
    expirationDate: z.string().optional().nullable(),
    clients: z.array(clientSchema)
});

export const ReservationFormModal = ({ isOpen, onClose, pkg }: Props) => {
    const { success, error: toastError } = useToast();
    const queryClient = useQueryClient();
    const [currentStep, setCurrentStep] = useState(1);
    
    // Control de qué slot está abierto (Acordeón)
    const [expandedSlot, setExpandedSlot] = useState<number | null>(0); // El primero abierto por defecto

    const methods = useForm({
        resolver: zodResolver(reservationSchema),
        defaultValues: {
            observations: "",
            expirationDate: null,
            clients: [] as any[]
        }
    });

    const { control, handleSubmit, setValue, formState: { isSubmitting, errors } } = methods;
    const { fields, replace } = useFieldArray({ control, name: "clients" });

    // Cargar defaults cuando abre el modal
    useEffect(() => {
        if (isOpen && pkg) {
            setCurrentStep(1);
            // setValue("observations", pkg.description); // Sugerencia: Obs del paquete
            
            // Generar X slots vacíos según peopleCount
            const initialClients = Array(pkg.peopleCount).fill(null).map(() => ({
                clientId: null,
                agreedPrice: pkg.pricePerPerson, // Default: Precio del paquete
                newClientData: null
            }));
            
            replace(initialClients);
            setExpandedSlot(0); // Abrir el primero para empezar a llenar
        }
    }, [isOpen, pkg, setValue, replace]);

    // Mutación
    const mutation = useMutation({
        mutationFn: (data: any) => createReservation({
            packageId: pkg!.id,
            ...data
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["reservations"] }); // Si tienes lista de reservas
            success("¡Reserva registrada con éxito!");
            onClose();
        },
        onError: (err: any) => {
            console.error("Respuesta Backend:", err.response?.data);
            toastError("Error al registrar la reserva. Revisa los datos.");
        }
    });

    const onSubmit = (data: any) => {
        mutation.mutate(data);
    };
if (!pkg) return null;

    return (
        <TravesiaModal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex flex-col min-w-0 w-full">
                    <span className="flex items-center gap-2">
                        <ShoppingCart className="text-primary" size={20}/>
                        Nueva Reserva
                    </span>
                    {/* ✅ truncate evita que el título empuje el modal fuera de la pantalla */}
                    <span className="text-xs font-normal opacity-70 truncate max-w-[250px] md:max-w-full">
                        Paquete: {pkg.name}
                    </span>
                </div>
            }
            size="lg"
            actions={
                <div className="flex justify-between w-full">
                     <div>{currentStep > 1 && <BtnBack onClick={() => setCurrentStep(prev => prev - 1)} />}</div>
                     <div className="flex gap-2">
                        <BtnCancel onClick={onClose} disabled={isSubmitting} />
                        {currentStep === 1 ? (
                            <BtnNext onClick={() => setCurrentStep(2)} />
                        ) : (
                            <BtnSave 
                                onClick={handleSubmit(onSubmit)} 
                                isLoading={isSubmitting || mutation.isPending} 
                            />
                        )}
                    </div>
                </div>
            }
        >
            {/* 🟢 CONTENEDOR PRINCIPAL: Altura controlada para evitar que el Stepper huya */}
            <div className="flex flex-col h-full max-h-[70vh] min-h-[400px]">
                
                {/* 1. STEPPER FIJO: shrink-0 asegura que siempre esté visible */}
                <div className="flex-shrink-0 mb-6 w-full">
                    <TravesiaStepper 
                        steps={["Datos Generales", `Pasajeros (${pkg.peopleCount})`]} 
                        currentStep={currentStep} 
                    />
                </div>

                {/* 2. AREA DE FORMULARIO: Scroll interno */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-1 pb-6 custom-scrollbar">
                    <FormProvider {...methods}>
                        <form className="space-y-6">
                            
                            {/* === PASO 1: DATOS GENERALES === */}
                            {currentStep === 1 && (
                                <div className="space-y-5 animate-fade-in">
                                    {/* ✅ FIX TEXTO PERDIDO: Usamos whitespace-normal y flex-wrap */}
                                    <div className="alert bg-base-200 border-none text-sm flex flex-row items-start gap-3 w-full whitespace-normal break-words">
                                        <AlertCircle size={18} className="text-info shrink-0 mt-0.5"/>
                                        <div className="flex-1">
                                            <span>
                                                Estás creando una reserva para <strong>{pkg.peopleCount} personas</strong>. 
                                                En el siguiente paso deberás registrar a cada una.
                                            </span>
                                        </div>
                                    </div>

                                    <div className="w-full overflow-hidden">
                                        <TravesiaDateTimePicker
                                            label="Fecha de Expiración (Opcional)"
                                            name="expirationDate"
                                            control={control}
                                            // ✅ Helper text con wrap forzado
                                            helperText={
                                            <span className="block whitespace-normal break-words leading-tight">Si lo dejas vacío, la reserva tiene al menos 24hrs para realizar al menos un pago.</span>}
                                        />
                                    </div>

                                    <TravesiaTextarea 
                                        label="Observaciones / Notas"
                                        placeholder="Ej: Terminarán el pago en el bus."
                                        rows={3}
                                        {...methods.register("observations")}
                                    />
                                </div>
                            )}

                            {/* === PASO 2: CLIENTES === */}
                            {currentStep === 2 && (
                                <div className="space-y-4 animate-fade-in pb-4">
                                    {fields.map((field, index) => (
                                        <ClientSlot 
                                            key={field.id} 
                                            index={index}
                                            isExpanded={expandedSlot === index}
                                            onToggle={() => setExpandedSlot(expandedSlot === index ? null : index)}
                                        />
                                    ))}
                                    
                                    {/* Mensaje de error fijo al final del scroll para mayor visibilidad */}
                                    {Object.keys(errors).length > 0 && (
                                        <div className="alert alert-error text-white text-xs font-bold shadow-lg mt-4">
                                            <AlertCircle size={16}/>
                                            <span>Faltan datos obligatorios en los pasajeros.</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </form>
                    </FormProvider>
                </div>
            </div>
        </TravesiaModal>
    );
};