import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserCog, BookOpen } from "lucide-react";

// Servicios y Hooks
import { updateClient } from "../services/clientService";
import { getCareers, getUniversities, getFaculties } from "../../sales/services/academicService";
import { useCities } from "../../../hooks/useCities";
import { useParameters } from "../../../hooks/useParameters";
import { useToast } from "../../../context/ToastContext";
import type { ClientResponse } from "../types/index";

// UI Components
import { TravesiaModal } from "../../../components/ui/TravesiaModal";
import { TravesiaInput } from "../../../components/ui/TravesiaInput";
import { TravesiaSelect } from "../../../components/ui/TravesiaSelect";
import { RichSelect } from "../../../components/ui/RichSelect";
import { BtnSave, BtnCancel } from "../../../components/ui/CrudButtons";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    clientToEdit: ClientResponse | null;
}

// === ESQUEMA DE VALIDACIÓN ZOD ===
const schema = z.object({
    firstName: z.string().min(2, "Mínimo 2 letras"),
    paternalSurname: z.string().min(2, "Mínimo 2 letras"),
    maternalSurname: z.string().optional().nullable(),
    phoneNumber: z.any().transform(Number).refine((n) => !isNaN(n) && n > 0, "Celular inválido"),
    email: z.string().email("Correo inválido").optional().nullable().or(z.literal("")),
    identityCard: z.string().min(4, "CI requerido"),
    
    // Parámetros
    clientType: z.any().transform(Number).refine((n) => !isNaN(n) && n > 0, "Requerido"),
    genderType: z.any().transform(Number).refine((n) => !isNaN(n) && n > 0, "Requerido"),
    
    birthDate: z.string().min(1, "Fecha requerida"),
    
    // Académico y Ubicación
    grade: z.string().min(1, "Requerido"),
    cityId: z.any().transform(Number).refine((n) => !isNaN(n) && n > 0, "Requerido"),
    careerId: z.any().transform(Number).refine((n) => !isNaN(n) && n > 0, "Requerido"),
    facultyId: z.any().transform(Number).refine((n) => !isNaN(n) && n > 0, "Requerido"),
    universityId: z.any().transform(Number).refine((n) => !isNaN(n) && n > 0, "Requerido"),
});

export const ClientFormModal = ({ isOpen, onClose, clientToEdit }: Props) => {
    const { success, error: toastError } = useToast();
    const queryClient = useQueryClient();
    
    // --- HOOKS DE DATOS ---
    const { parameters: genderOptions, isLoading: loadingGenders } = useParameters("GENDER_TYPE");
    const { parameters: clientTypeOptions, isLoading: loadingClientTypes } = useParameters("CLIENT_TYPE");
    const { data: cities = [], isLoading: loadingCities } = useCities();
    const { data: universities = [], isLoading: loadingUniversities } = useQuery({ queryKey: ['universities'], queryFn: getUniversities });
    const { data: faculties = [], isLoading: loadingFaculties } = useQuery({ queryKey: ['faculties'], queryFn: getFaculties });
    const { data: careers = [], isLoading: loadingCareers } = useQuery({ queryKey: ['careers'], queryFn: getCareers });

    const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema),
    });

    // Cargar datos al abrir
    useEffect(() => {
        if (isOpen && clientToEdit) {
            reset({
                firstName: clientToEdit.firstName,
                paternalSurname: clientToEdit.paternalSurname,
                maternalSurname: clientToEdit.maternalSurname || "",
                phoneNumber: clientToEdit.phoneNumber,
                email: clientToEdit.email || "",
                identityCard: clientToEdit.identityCard,
                clientType: clientToEdit.clientTypeCode,
                genderType: clientToEdit.genderTypeCode,
                // Extraemos solo la fecha
                birthDate: clientToEdit.birthDate ? clientToEdit.birthDate.split('T')[0] : "",
                grade: clientToEdit.grade,
                
                // ✅ AHORA USAMOS LOS IDs NATIVOS DEL BACKEND
                cityId: clientToEdit.cityId, 
                universityId: clientToEdit.universityId,
                facultyId: clientToEdit.facultyId,
                careerId: clientToEdit.careerId,
            });
        }
    }, [isOpen, clientToEdit, reset]);

    const mutation = useMutation({
        mutationFn: (data: any) => updateClient(clientToEdit!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            success("Cliente actualizado correctamente");
            onClose();
        },
        onError: () => toastError("Error al actualizar el cliente")
    });

    const onSubmit = (data: any) => {
        mutation.mutate(data);
    };

    if (!isOpen || !clientToEdit) return null;

    return (
        <TravesiaModal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <UserCog className="text-primary" />
                    <span>Editar Cliente</span>
                </div>
            }
            size="lg"
            actions={
                <div className="flex justify-end gap-2 w-full">
                    <BtnCancel onClick={onClose} disabled={isSubmitting || mutation.isPending} />
                    <BtnSave onClick={handleSubmit(onSubmit)} isLoading={isSubmitting || mutation.isPending} />
                </div>
            }
        >
            {/* ✅ ELIMINAMOS EL DIV CONTENEDOR CON OVERFLOW. Solo el Form directo */}
            <form className="space-y-6 pt-2 pb-4">
                
                {/* --- BLOQUE 1: DATOS PERSONALES --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TravesiaInput
                        label="Nombres"
                        uppercase
                        {...register("firstName")}
                        error={errors.firstName?.message as string}
                    />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <TravesiaInput
                            label="Ap. Paterno"
                            uppercase
                            {...register("paternalSurname")}
                            error={errors.paternalSurname?.message as string}
                        />
                        <TravesiaInput
                            label="Ap. Materno"
                            uppercase
                            {...register("maternalSurname")}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <TravesiaInput
                            label="CI"
                            uppercase
                            {...register("identityCard")}
                            error={errors.identityCard?.message as string}
                        />
                        <TravesiaInput
                            label="Fecha Nac."
                            type="date"
                            {...register("birthDate")}
                            error={errors.birthDate?.message as string}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <TravesiaInput
                            label="Celular"
                            type="number"
                            {...register("phoneNumber", { valueAsNumber: true })}
                            error={errors.phoneNumber?.message as string}
                        />
                        <Controller
                            control={control}
                            name="genderType"
                            render={({ field: { onChange, value } }) => (
                                <TravesiaSelect
                                    label="Género"
                                    options={(genderOptions || []).map((p: any) => ({ value: p.numericCode ?? p.id, label: p.name }))}
                                    isLoading={loadingGenders}
                                    value={value}
                                    onChange={(e) => onChange(Number(e.target.value))}
                                    error={errors.genderType?.message as string}
                                />
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <TravesiaInput
                            label="Email"
                            type="email"
                            {...register("email")}
                        />
                        <Controller
                            control={control}
                            name="cityId"
                            render={({ field: { onChange, value } }) => (
                                <TravesiaSelect
                                    label="Ciudad"
                                    options={(cities || []).map(c => ({ value: c.id, label: c.name }))}
                                    isLoading={loadingCities}
                                    value={value}
                                    onChange={(e) => onChange(Number(e.target.value))}
                                    error={errors.cityId?.message as string}
                                />
                            )}
                        />
                    </div>
                </div>

                {/* --- BLOQUE 2: DATOS ACADÉMICOS --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-base-200/50 rounded-xl border border-base-200">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary mb-1 md:col-span-2">
                        <BookOpen size={16}/> Información Académica
                    </div>

                    <Controller
                        control={control}
                        name="clientType"
                        render={({ field: { onChange, value } }) => (
                            <TravesiaSelect
                                label="Tipo de Cliente"
                                options={(clientTypeOptions || []).map((p: any) => ({ value: p.numericCode ?? p.id, label: p.name }))}
                                isLoading={loadingClientTypes}
                                value={value}
                                onChange={(e) => onChange(Number(e.target.value))}
                                error={errors.clientType?.message as string}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="universityId"
                        render={({ field: { onChange, value } }) => (
                            <RichSelect
                                label="Universidad"
                                placeholder="Buscar..."
                                options={(universities || []).map((u: any) => ({ value: u.id, label: u.name }))}
                                isLoading={loadingUniversities}
                                value={value}
                                onChange={(val) => onChange(Number(val))}
                                error={errors.universityId?.message as string}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="facultyId"
                        render={({ field: { onChange, value } }) => (
                            <RichSelect
                                label="Facultad"
                                placeholder="Buscar..."
                                options={(faculties || []).map((f: any) => ({ value: f.id, label: f.name }))}
                                isLoading={loadingFaculties}
                                value={value}
                                onChange={(val) => onChange(Number(val))}
                                error={errors.facultyId?.message as string}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="careerId"
                        render={({ field: { onChange, value } }) => (
                            <RichSelect
                                label="Carrera"
                                placeholder="Buscar..."
                                options={(careers || []).map((c: any) => ({ value: c.id, label: c.name }))}
                                isLoading={loadingCareers}
                                value={value}
                                onChange={(val) => onChange(Number(val))}
                                error={errors.careerId?.message as string}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="grade"
                        render={({ field: { onChange, value } }) => (
                            <TravesiaSelect
                                label="Año / Grado"
                                options={[
                                    { value: "1er AÑO", label: "1er AÑO" },
                                    { value: "2do AÑO", label: "2do AÑO" },
                                    { value: "3er AÑO", label: "3er AÑO" },
                                    { value: "4to AÑO", label: "4to AÑO" },
                                    { value: "5to AÑO", label: "5to AÑO" },
                                ]}
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                error={errors.grade?.message as string}
                            />
                        )}
                    />
                </div>
            </form>
        </TravesiaModal>
    );
};