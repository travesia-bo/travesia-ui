import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { UserPlus, Search, CheckCircle2, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query"; 

// UI Components
import { TravesiaInput } from "../../../../components/ui/TravesiaInput";
import { TravesiaSelect } from "../../../../components/ui/TravesiaSelect";
import { RichSelect } from "../../../../components/ui/RichSelect";

// Servicios y Hooks
import { useParameters } from "../../../../hooks/useParameters"; 
import { useCities } from "../../../../hooks/useCities";
import { searchClients } from "../../services/reservationService";
import { getCareers } from "../../services/academicService"; 
// Usamos 'import type' para evitar errores de compilación con interfaces
import type { ClientSearchResult } from "../../types";

interface Props {
    index: number;
    isExpanded: boolean;
    onToggle: () => void;
}

export const ClientSlot = ({ index, isExpanded, onToggle }: Props) => {
    const { register, setValue, watch, formState: { errors } } = useFormContext();
    const [mode, setMode] = useState<"EXISTING" | "NEW">("EXISTING");
    
    // --- 1. HOOKS DE DATOS ---

    // A. Parámetros del Sistema (Listas desplegables)
    // Nota: Verifica en tu BD si es "GENDER_TYPES" (plural) o "GENDER_TYPE" (singular). 
    // Aquí uso defensividad (|| []) para que no explote si el nombre está mal.
    const { parameters: genderOptions, isLoading: loadingGenders } = useParameters("GENDER_TYPE");
    const { parameters: clientTypeOptions, isLoading: loadingClientTypes } = useParameters("CLIENT_TYPE");

    // B. Ciudades
    const { data: cities = [], isLoading: loadingCities } = useCities();

    // C. Carreras (Cacheado)
    const { data: careers = [], isLoading: loadingCareers } = useQuery({
        queryKey: ['careers'],
        queryFn: getCareers,
        staleTime: 1000 * 60 * 60 
    });

    // D. Clientes (Para el buscador)
    // ✅ CORRECCIÓN CLAVE: Cargamos los clientes aquí para pasarlos a 'options'
    const { data: clients = [], isLoading: loadingClients } = useQuery({
        queryKey: ['clients', 'all'], 
        queryFn: () => searchClients(''), // Trae la lista inicial
    });

    // --- 2. LÓGICA DE FORMULARIO ---

    // Acceso seguro a errores en arrays profundos
    const clientErrors = errors.clients as any;
    const currentErrors = clientErrors?.[index]?.newClientData || {};
    const clientSelectError = clientErrors?.[index]?.clientId?.message;

    // Watchers
    const firstName = watch(`clients.${index}.newClientData.firstName`);
    const paternal = watch(`clients.${index}.newClientData.paternalSurname`);
    const existingId = watch(`clients.${index}.clientId`);
    
    const handleModeChange = (newMode: "EXISTING" | "NEW") => {
        setMode(newMode);
        if (newMode === "EXISTING") {
            setValue(`clients.${index}.newClientData`, null);
        } else {
            setValue(`clients.${index}.clientId`, null);
            // Default a "Estudiante" (o el ID que corresponda, ej: 701)
            setValue(`clients.${index}.newClientData.clientType`, 701); 
        }
    };

    const getSlotTitle = () => {
        if (existingId) return <span className="text-success font-bold flex items-center gap-1"><CheckCircle2 size={14}/> Cliente Seleccionado</span>;
        if (firstName && paternal) return <span className="text-info font-bold flex items-center gap-1"><UserPlus size={14}/> {firstName} {paternal}</span>;
        return <span className="opacity-50 italic">Sin datos registrados</span>;
    };

    return (
        <div className={`border rounded-xl transition-all duration-300 ${isExpanded ? 'border-primary shadow-md bg-base-100' : 'border-base-200 bg-base-50'}`}>
            {/* Header */}
            <div className="p-3 flex justify-between items-center cursor-pointer select-none" onClick={onToggle}>
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isExpanded ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content'}`}>
                        {index + 1}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-wider opacity-60">Pasajero {index + 1}</span>
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

                    {/* === MODO 1: BUSCAR CLIENTE (Corregido) === */}
                    {mode === "EXISTING" && (
                        <div className="space-y-3">
                            <RichSelect
                                label="Buscar Cliente"
                                placeholder="Seleccione un cliente..."
                                isLoading={loadingClients}
                                // ✅ CORRECCIÓN: Pasamos la data de 'useQuery' mapeada
                                options={(clients || []).map((c: ClientSearchResult) => ({
                                    value: c.id,
                                    label: c.fullName, 
                                    subtitle: `${c.careerName} | ${c.phoneNumber}`
                                }))}
                                value={watch(`clients.${index}.clientId`)}
                                onChange={(val) => setValue(`clients.${index}.clientId`, Number(val))}
                                error={clientSelectError}
                            />
                        </div>
                    )}

                    {/* === MODO 2: CREAR CLIENTE (Blindado) === */}
                    {mode === "NEW" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <TravesiaInput 
                                label="Nombres" 
                                placeholder="Ej: Juan Pablo" 
                                {...register(`clients.${index}.newClientData.firstName`)}
                                error={currentErrors.firstName?.message}
                            />
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
                                <TravesiaInput 
                                    label="Fecha Nac." 
                                    type="date"
                                    {...register(`clients.${index}.newClientData.birthDate`)}
                                    error={currentErrors.birthDate?.message}
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
                                    // Blindaje: (cities || [])
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
                                    // ✅ BLINDAJE ANTI-CRASH: (lista || []).map(...)
                                    options={(clientTypeOptions || []).map((p: any) => ({ value: p.numericCode, label: p.name }))}
                                    isLoading={loadingClientTypes}
                                    {...register(`clients.${index}.newClientData.clientType`, { valueAsNumber: true })}
                                    error={currentErrors.clientType?.message}
                                />

                                <RichSelect 
                                    label="Carrera"
                                    placeholder="Buscar carrera..."
                                    // ✅ BLINDAJE ANTI-CRASH
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
                                    // ✅ BLINDAJE ANTI-CRASH
                                    options={(genderOptions || []).map((p: any) => ({ value: p.numericCode, label: p.name }))}
                                    isLoading={loadingGenders}
                                    {...register(`clients.${index}.newClientData.genderType`, { valueAsNumber: true })}
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
                            icon="dollar-sign"
                            className="font-mono font-bold text-primary"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};