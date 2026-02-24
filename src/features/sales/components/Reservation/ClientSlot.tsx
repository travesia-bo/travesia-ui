// ClientSlot.tsx
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { UserPlus, Search, CheckCircle2, BookOpen, AlertCircle } from "lucide-react"; // Asegúrate de importar AlertCircle
import { useQuery } from "@tanstack/react-query";

// UI Components
import { TravesiaInput } from "../../../../components/ui/TravesiaInput";
import { TravesiaSelect } from "../../../../components/ui/TravesiaSelect";
import { RichSelect } from "../../../../components/ui/RichSelect";
import { TravesiaDateTimePicker } from "../../../../components/ui/TravesiaDateTimePicker";

// Servicios y Hooks
import { useParameters } from "../../../../hooks/useParameters";
import { useCities } from "../../../../hooks/useCities";
import { searchClients } from "../../services/reservationService";
import { getCareers } from "../../services/academicService";
import type { ClientSearchResult } from "../../types";

interface Props {
    index: number;
    isExpanded: boolean;
    onToggle: () => void;
}

export const ClientSlot = ({ index, isExpanded, onToggle }: Props) => {
    // 1. ✅ Extraemos 'clearErrors'
    const { register, control, setValue, watch, clearErrors, formState: { errors } } = useFormContext();
    const [mode, setMode] = useState<"EXISTING" | "NEW">("EXISTING");

    // --- HOOKS DE DATOS (Sin cambios) ---
    const { parameters: genderOptions, isLoading: loadingGenders } = useParameters("GENDER_TYPE");
    const { parameters: clientTypeOptions, isLoading: loadingClientTypes } = useParameters("CLIENT_TYPE");
    const { data: cities = [], isLoading: loadingCities } = useCities();
    const { data: careers = [], isLoading: loadingCareers } = useQuery({
        queryKey: ['careers'],
        queryFn: getCareers,
        staleTime: 1000 * 60 * 60
    });
    const { data: clients = [], isLoading: loadingClients } = useQuery({
        queryKey: ['clients', 'all'],
        queryFn: () => searchClients(''),
    });

    // --- LÓGICA DE ERRORES ---
    const clientErrors = errors.clients as any;
    const currentErrors = clientErrors?.[index]?.newClientData || {};
    const clientSelectError = clientErrors?.[index]?.clientId?.message;

    // Watchers
    const firstName = watch(`clients.${index}.newClientData.firstName`);
    const paternal = watch(`clients.${index}.newClientData.paternalSurname`);
    const existingId = watch(`clients.${index}.clientId`);

    // 2. ✅ Función corregida para LIMPIAR errores al cambiar de modo
    const handleModeChange = (newMode: "EXISTING" | "NEW") => {
        setMode(newMode);
        
        // Limpiamos el error global del slot inmediatamente
        clearErrors(`clients.${index}.clientId`); 

        if (newMode === "EXISTING") {
            setValue(`clients.${index}.newClientData`, null);
        } else {
            setValue(`clients.${index}.clientId`, null);

            setValue(`clients.${index}.newClientData.clientType`, 701); 
            setValue(`clients.${index}.newClientData.cityId`, 1); 

            setValue(`clients.${index}.newClientData.clientType`, undefined);
            setValue(`clients.${index}.newClientData.genderType`, undefined);
        }
    };

    const getSlotTitle = () => {
        if (existingId) return <span className="text-success font-bold flex items-center gap-1"><CheckCircle2 size={14}/> Cliente Seleccionado</span>;
        if (firstName && paternal) return <span className="text-info font-bold flex items-center gap-1"><UserPlus size={14}/> {firstName} {paternal}</span>;
        return <span className="opacity-50 italic">Sin datos registrados</span>;
    };

    // Calcula la fecha de hace exactamente 18 años
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

    return (
        <div className={`border rounded-xl transition-all duration-300 ${isExpanded ? 'border-primary shadow-md bg-base-100' : 'border-base-200 bg-base-50'}`}>
            {/* Header */}
            <div className="p-3 flex justify-between items-center cursor-pointer select-none" onClick={onToggle}>
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isExpanded ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content'}`}>
                        {index + 1}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-wider opacity-60">Cliente {index + 1}</span>
                        <div className="text-sm">{getSlotTitle()}</div>
                    </div>
                </div>
                <div className="text-xs font-mono font-bold text-primary">
                    Bs. {watch(`clients.${index}.agreedPrice`)}
                </div>
            </div>

            {/* Body */}
            {isExpanded && (
                <div className="p-4 border-t border-base-200 animate-fade-in">

                    <div className="flex gap-2 mb-4 p-1 bg-base-200 rounded-lg w-fit">
                        <button
                            type="button"
                            onClick={() => handleModeChange("EXISTING")}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${mode === "EXISTING" ? 'bg-white shadow-sm text-primary' : 'text-base-content/60 hover:bg-base-300'}`}
                        >
                            <Search size={14} /> Buscar
                        </button>
                        <button
                            type="button"
                            onClick={() => handleModeChange("NEW")}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${mode === "NEW" ? 'bg-white shadow-sm text-secondary' : 'text-base-content/60 hover:bg-base-300'}`}
                        >
                            <UserPlus size={14} /> Nuevo
                        </button>
                    </div>

                    {/* === MODO 1: BUSCAR CLIENTE === */}
                    {mode === "EXISTING" && (
                        <div className="space-y-1"> {/* space-y-1 para acercar el error al input */}
                            <RichSelect
                                label="Buscar Cliente"
                                placeholder="Seleccione un cliente..."
                                isLoading={loadingClients}
                                options={(clients || []).map((c: ClientSearchResult) => ({
                                    value: c.id,
                                    label: c.fullName,
                                    subtitle: `${c.careerName} | ${c.phoneNumber}`
                                }))}
                                value={watch(`clients.${index}.clientId`)}
                                onChange={(val) => {
                                    setValue(`clients.${index}.clientId`, Number(val));
                                    // 3. ✅ Limpiamos el error apenas seleccione algo
                                    clearErrors(`clients.${index}.clientId`);
                                }}
                                // 4. ✅ Ocultamos el error interno del componente para renderizarlo nosotros
                                error={undefined} 
                            />
                            
                            {/* 5. ✅ Renderizado MANUAL del error con WRAP y CSS corregido */}
                            {clientSelectError && (
                                <div className="flex items-start gap-1 mt-1 animate-fade-in">
                                    <AlertCircle size={14} className="text-error mt-0.5 shrink-0" />
                                    <span className="text-xs text-error font-medium whitespace-normal break-words leading-tight">
                                        {clientSelectError}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* === MODO 2: CREAR CLIENTE === */}
                    {mode === "NEW" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                             {/* Nota: Al estar en modo NEW, react-hook-form validará los campos internos
                                 y el error global de 'clientId' desaparecerá eventualmente al validar,
                                 pero el 'clearErrors' del handleModeChange ayuda visualmente. */}
                            
                            <TravesiaInput
                                label="Nombres"
                                placeholder="Ej: Juan Pablo"
                                {...register(`clients.${index}.newClientData.firstName`)}
                                error={currentErrors.firstName?.message}
                            />
                             {/* ... resto de inputs (Paterno, Materno, CI, etc.) ... */}
                            <div className="grid grid-cols-2 gap-2">
                                <TravesiaInput
                                    label="Ap. Paterno"
                                    placeholder="Pérez"
                                    {...register(`clients.${index}.newClientData.paternalSurname`)}
                                    error={currentErrors.paternalSurname?.message}
                                />
                                <TravesiaInput
                                    label="Ap. Materno"
                                    placeholder="(Opcional)"
                                    {...register(`clients.${index}.newClientData.maternalSurname`)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <TravesiaInput
                                    label="CI"
                                    placeholder="123456 LP"
                                    {...register(`clients.${index}.newClientData.identityCard`)}
                                    error={currentErrors.identityCard?.message}
                                />
                                <TravesiaDateTimePicker 
                                    label="Fecha Nac." 
                                    name={`clients.${index}.newClientData.birthDate`}
                                    control={control} 
                                    isBirthDate={true}
                                    // ✅ CAMBIO: El calendario bloqueará fechas recientes
                                    maxDate={eighteenYearsAgo} 
                                    helperText={currentErrors.birthDate?.message}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <TravesiaInput
                                    label="Celular"
                                    type="number"
                                    placeholder="70000000"
                                    {...register(`clients.${index}.newClientData.phoneNumber`, { valueAsNumber: true })}
                                    error={currentErrors.phoneNumber?.message}
                                />
                                <TravesiaSelect
                                    label="Ciudad"
                                    options={(cities || []).map(c => ({ value: c.id, label: c.name }))}
                                    isLoading={loadingCities}
                                    {...register(`clients.${index}.newClientData.cityId`, { valueAsNumber: true })}
                                    error={currentErrors.cityId?.message}
                                />
                            </div>

                            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-base-200/50 rounded-lg border border-base-200">
                                <div className="flex items-center gap-2 text-xs font-bold text-primary mb-1 md:col-span-2">
                                    <BookOpen size={14}/> Datos Académicos
                                </div>
                                <TravesiaSelect
                                    label="Tipo de Cliente"
                                    options={[
                                        ...(clientTypeOptions || []).map((p: any) => ({
                                            value: p.numericCode ?? p.id, 
                                            label: p.name
                                        }))
                                    ]}
                                    isLoading={loadingClientTypes}
                                    {...register(`clients.${index}.newClientData.clientType`, { valueAsNumber: true })}
                                    error={currentErrors.clientType?.message}
                                />

                                <RichSelect
                                    label="Carrera"
                                    placeholder="Buscar carrera..."
                                    options={(careers || []).map(c => ({
                                        value: c.id,
                                        label: c.name,
                                        subtitle: c.facultyName
                                    }))}
                                    isLoading={loadingCareers}
                                    value={watch(`clients.${index}.newClientData.careerId`)}
                                    onChange={(val) => setValue(`clients.${index}.newClientData.careerId`, Number(val))}
                                    error={currentErrors.careerId?.message}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <TravesiaSelect
                                    label="Género"
                                    options={[
                                        { value: "", label: "Seleccione" },
                                        ...(genderOptions || []).map((p: any) => ({ 
                                            value: p.numericCode ?? p.id,
                                            label: p.name 
                                        }))
                                    ]}
                                    isLoading={loadingGenders}
                                    {...register(`clients.${index}.newClientData.genderType`, { valueAsNumber: true })}
                                    error={currentErrors.genderType?.message}
                                />
                                <TravesiaInput
                                    label="Email"
                                    type="email"
                                    placeholder="(Opcional)"
                                    {...register(`clients.${index}.newClientData.email`)}
                                />
                            </div>
                        </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-base-200">
                        <TravesiaInput
                            label="Precio Acordado"
                            type="number"
                            step="0.01"
                            {...register(`clients.${index}.agreedPrice`, { valueAsNumber: true })}
                            className="font-mono font-bold text-primary"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};