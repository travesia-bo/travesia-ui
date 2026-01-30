import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { TravesiaModal } from "../../../components/ui/TravesiaModal";
import { TravesiaInput } from "../../../components/ui/TravesiaInput";
import { TravesiaSelect } from "../../../components/ui/TravesiaSelect";
import { TravesiaButton } from "../../../components/ui/TravesiaButton";
import { useCities } from "../../../hooks/useCities";
import { useParameters } from "../../../hooks/useParameters";
import { PARAM_CATEGORIES } from "../../../config/constants";
import { Provider } from "../types";
import { IconRenderer } from "../../../components/ui/IconRenderer";
import { useMutation, useQueryClient } from "@tanstack/react-query"; // 1. IMPORTAR ESTO
import { createProvider, updateProvider } from "../services/providerService"; // 2. IMPORTAR SERVICIOS
import { toast } from "sonner"; // Opcional: Para notificaciones bonitas (o usa alert)
import { BtnSave, BtnCancel, BtnBack, BtnNext } from "../../../components/ui/CrudButtons";

// 1. ESQUEMA DE VALIDACIÓN (DTO Backend)
const providerSchema = z.object({
    // --- PASO 1: PERSONA (Contacto) ---
    contactFirstName: z.string().min(1, "El nombre es obligatorio").max(100),
    contactPaternalSurname: z.string().max(45).optional(),
    contactMaternalSurname: z.string().max(45).optional(),
    contactIdentityCard: z.string().max(45).optional(),
    contactPhoneNumber: z.coerce.number({ invalid_type_error: "Debe ser un número" }).min(60000000, "Número inválido (mín 8 dígitos)"), 
    contactEmail: z.string().email("Correo inválido").optional().or(z.literal("")), // Permite vacío o email válido
    imageUrl: z.string().optional(),

    // --- PASO 2: PROVEEDOR (Empresa) ---
    name: z.string().min(1, "El nombre de la empresa es obligatorio").max(45),
    address: z.string().min(5, "Dirección muy corta (mín 5 letras)").max(200),
    cityId: z.coerce.string().min(1, "Debe seleccionar una ciudad"), // Validamos como string en el form
    statusType: z.coerce.string().min(1, "Debe seleccionar un estado"),
});

type ProviderFormData = z.infer<typeof providerSchema>;

interface Props {
    isOpen: boolean;
    onClose: () => void;
    providerToEdit?: Provider | null;
}

export const ProviderFormModal = ({ isOpen, onClose, providerToEdit }: Props) => {
    // Hooks de datos
    const { data: cities = [], isLoading: loadingCities } = useCities();
    const { parameters: statuses, isLoading: loadingStatuses } = useParameters(PARAM_CATEGORIES.PROVIDER_STATUS);

    // Estado del Wizard
    const [currentStep, setCurrentStep] = useState(1);

    // Formulario
    const { register, handleSubmit, reset, trigger, formState: { errors, isSubmitting, submitCount } } = useForm<ProviderFormData>({
        resolver: zodResolver(providerSchema),
        defaultValues: {
            // Inicializar para evitar warnings de uncontrolled/controlled
            contactFirstName: "", contactPaternalSurname: "", contactMaternalSurname: "", 
            contactPhoneNumber: undefined, contactEmail: "", 
            name: "", address: "", cityId: "", statusType: ""
        }
    });

    // Resetear al abrir/cerrar
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(1); // Siempre empezar en el paso 1
            if (providerToEdit) {
                // Aquí haríamos el mapeo inverso (Provider -> Form)
                // OJO: Tu Provider trae "contactFullName", pero el form pide "FirstName/Surname". 
                // Si el backend no devuelve los apellidos separados al listar, tendremos un problema al Editar.
                // Por ahora, asumiremos modo CREACIÓN para este ejemplo.
            } else {
                reset();
            }
        }
    }, [isOpen, providerToEdit, reset]);

    // --- LÓGICA DE NAVEGACIÓN ---
    const handleNextStep = async () => {
        // Validamos SOLO los campos del paso 1
        const isValidStep1 = await trigger([
            "contactFirstName", 
            "contactPhoneNumber", 
            "contactEmail",
            "contactPaternalSurname",
            "contactMaternalSurname"
        ]);
        
        if (isValidStep1) {
            setCurrentStep(2);
        } else {
            // ¡AQUÍ ESTÁ LA MAGIA!
            // Si falla, aumentamos el contador para que cambie la 'key' y tiemble
            setManualShake(prev => prev + 1);
        }
        // Si no es válido, el 'trigger' automáticamente muestra los errores y activa el shake
    };

    const handlePrevStep = () => setCurrentStep(1);

    // const onSubmit = async (data: ProviderFormData) => {
    //     // Transformación final de datos para enviar al backend (String -> Integer)
    //     const payload = {
    //         ...data,
    //         cityId: Number(data.cityId),
    //         statusType: Number(data.statusType),
    //         contactPhoneNumber: Number(data.contactPhoneNumber)
    //     };

    //     console.log("🚀 Payload listo para enviar:", payload);
    //     // await createProviderMutation(payload);
    //     onClose();
    // };

    // 3. HOOK PARA INVALIDAR CACHÉ (Refrescar tabla)
    const queryClient = useQueryClient();

    // 4. CONFIGURAR LA MUTATION (La magia de React Query)
    const mutation = useMutation({
        mutationFn: (data: any) => {
            // Decide si crear o editar según si existe providerToEdit
            if (providerToEdit) {
                return updateProvider(providerToEdit.id, data);
            }
            return createProvider(data);
        },
        onSuccess: () => {
            // A) Refrescar la lista de proveedores automáticamente
            queryClient.invalidateQueries({ queryKey: ['providers'] });
            
            // B) Cerrar modal y notificar
            // toast.success("Proveedor guardado correctamente");
            console.log("✅ Guardado con éxito");
            onClose();
        },
        onError: (error: any) => {
            console.error("Error al guardar:", error);
            // toast.error("Error al guardar proveedor");
            alert("Error al guardar: " + (error.response?.data?.message || "Error desconocido"));
        }
    });// ... (useForm hook igual) ...

    // NUEVO ESTADO: Para forzar el shake manualmente en el paso 1
    const [manualShake, setManualShake] = useState(0);
    // 3. EFECTO DE PRE-CARGA DE DATOS (Actualizado)
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(1);
            setManualShake(0);

            if (providerToEdit) {
                // === MODO EDICIÓN: Mapeo Directo y Seguro ===
                // Ya no necesitamos adivinar con .split(), el backend nos da todo
                
                reset({
                    // Datos Persona (Manejo de nulls con || "")
                    contactFirstName: providerToEdit.contactFirstName,
                    contactPaternalSurname: providerToEdit.contactPaternalSurname || "", 
                    contactMaternalSurname: providerToEdit.contactMaternalSurname || "", 
                    contactIdentityCard: providerToEdit.contactIdentityCard || "", 
                    contactPhoneNumber: providerToEdit.contactPhoneNumber,
                    contactEmail: providerToEdit.contactEmail || "",
                    
                    // Datos Empresa
                    name: providerToEdit.name,
                    address: providerToEdit.address,
                    
                    // Selects: Aseguramos que sean string para que el <select> lo detecte
                    cityId: providerToEdit.cityId.toString(), 
                    statusType: providerToEdit.statusCode.toString(), 
                });
            } else {
                // === MODO CREAR (Limpiar todo) ===
                reset({
                    contactFirstName: "", 
                    contactPaternalSurname: "", 
                    contactMaternalSurname: "", 
                    contactIdentityCard: "",
                    contactPhoneNumber: undefined, 
                    contactEmail: "", 
                    
                    name: "", 
                    address: "", 
                    cityId: "", 
                    statusType: ""
                });
            }
        }
    }, [isOpen, providerToEdit, reset]);

    // ... (handleNextStep, handlePrevStep igual) ...

    const onSubmit = async (data: ProviderFormData) => {
        // Transformación de datos (String -> Number)
        const payload = {
            ...data,
            cityId: Number(data.cityId),
            statusType: Number(data.statusType),
            contactPhoneNumber: Number(data.contactPhoneNumber),
            // Aseguramos que campos opcionales vayan como null si están vacíos
            contactEmail: data.contactEmail || null, 
            imageUrl: null // Por ahora null, luego veremos subida de imágenes
        };

        console.log("🚀 Enviando Payload:", payload);
        
        // 5. EJECUTAR LA MUTATION
        mutation.mutate(payload); 
    };

    return (
        <TravesiaModal
            isOpen={isOpen}
            onClose={onClose}
            title={providerToEdit ? "Editar Proveedor" : "Nuevo Proveedor"}
            // Footer Personalizado según el paso
            actions={
                <div className="flex justify-between w-full">
                    {/* Botón Atrás (Solo visible en paso 2) */}
                    <div>
                        {currentStep === 2 && (
                            <BtnBack onClick={handlePrevStep} />
                        )}
                    </div>
                    
                    <div className="flex gap-2">
                        <BtnCancel 
                            onClick={onClose} 
                            disabled={mutation.isPending} 
                        />
                        
                        {currentStep === 1 ? (
                            /* Botón Siguiente Reutilizable */
                            <BtnNext onClick={handleNextStep} />
                        ) : (
                            /* Botón Guardar Reutilizable */
                            <BtnSave 
                                // Sobreescribimos el label por defecto "Guardar" para dar feedback
                                label={mutation.isPending ? "Guardando..." : "Guardar"} 
                                isLoading={mutation.isPending}
                                onClick={handleSubmit(onSubmit)} 
                            />
                        )}
                    </div>
                </div>
            }
        >
{/* INDICADOR DE PASOS */}
            <div className="w-full mb-8 px-4">
                <ul className="steps steps-horizontal w-full">
                    {/* PASO 1 */}
                    <li 
                        /* IMPORTANTE: Este atributo es el que lee el CSS */
                        data-content={currentStep > 1 ? "✓" : "1"} 
                        className={`step ${currentStep >= 1 ? 'step-primary' : ''}`}
                    >
                        Datos del Contacto
                    </li>
                    
                    {/* PASO 2 */}
                    <li 
                        data-content="2" 
                        className={`step ${currentStep >= 2 ? 'step-primary' : ''}`}
                    >
                        Datos de la Empresa
                    </li>
                </ul>
            </div>

            <form className="min-h-[300px]">
                
                {/* --- PASO 1: DATOS DE PERSONA --- */}
                <div className={currentStep === 1 ? "block space-y-4 animate-fade-in" : "hidden"}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TravesiaInput 
                            label="Nombres" 
                            placeholder="Ej: Juan Daniel"
                            error={errors.contactFirstName?.message}
                            shakeKey={submitCount + manualShake} // <--- NUEVO
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
                            shakeKey={submitCount + manualShake} // <--- NUEVO
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
                    {/* <div className="alert alert-info text-sm shadow-sm">
                        <IconRenderer iconName="info" size={18} />
                        <span>Estás vinculando a: <b>{currentStep === 2 ? register("contactFirstName").name : ""}</b></span> 
                    </div> */}

                    <TravesiaInput 
                        label="Nombre Comercial / Empresa" 
                        placeholder="Ej: Hotel Los Ceibos"
                        shakeKey={submitCount + manualShake} // <--- NUEVO
                        isRequired
                        error={errors.name?.message}
                        {...register("name")}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TravesiaSelect 
                            label="Ciudad"
                            options={cities.map(c => ({ value: c.id, label: c.name }))}
                            isLoading={loadingCities}
                            shakeKey={submitCount + manualShake} // <--- NUEVO
                            isRequired
                            // enableDefaultOption={false} -> Por defecto es false en selectores obligatorios
                            error={errors.cityId?.message}
                            {...register("cityId")}
                        />
                        
                        <TravesiaSelect 
                            label="Estado Inicial"
                            options={statuses.map(s => ({ value: s.numericCode, label: s.name }))}
                            isLoading={loadingStatuses}
                            shakeKey={submitCount + manualShake} // <--- NUEVO
                            isRequired
                            error={errors.statusType?.message}
                            {...register("statusType")}
                        />
                    </div>

                    <TravesiaInput 
                        label="Dirección Física" 
                        placeholder="Av. Principal #123, Zona Sur"
                        icon="map-pin"
                        shakeKey={submitCount + manualShake} // <--- NUEVO
                        isRequired
                        error={errors.address?.message}
                        {...register("address")}
                    />
                </div>

            </form>
        </TravesiaModal>
    );
};