import { useState, useMemo, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wallet, Trash2, AlertTriangle, CheckCircle2, User, Package, Plus } from "lucide-react";

// Servicios y Tipos
import { createAppliedPayment, getActiveDebtors } from "../services/financialService";
import type { ClientStatementResponse, PackageDebtResponse } from "../types";
import { useParameters } from "../../../hooks/useParameters";
import { PARAM_CATEGORIES } from "../../../config/constants";
import { useToast } from "../../../context/ToastContext";

// UI Components
import { TravesiaModal } from "../../../components/ui/TravesiaModal";
import { TravesiaInput } from "../../../components/ui/TravesiaInput";
import { TravesiaSelect } from "../../../components/ui/TravesiaSelect";
import { TravesiaFinancialInput } from "../../../components/ui/TravesiaFinancialInput";
import { TravesiaStepper } from "../../../components/ui/TravesiaStepper";
import { RichSelect } from "../../../components/ui/RichSelect"; 
import { BtnSave, BtnCancel, BtnNext, BtnBack } from "../../../components/ui/CrudButtons";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

// 1. ✅ ESQUEMA ACTUALIZADO CON LA FECHA
const paymentHeaderSchema = z.object({
    totalAmount: z.number().min(1, "El monto debe ser mayor a 0"),
    paymentMethodType: z.number().min(1, "Selecciona un método de pago"),
    bankReference: z.string().optional(),
    transactionDate: z.string().min(1, "La fecha es requerida"), 
});

interface ApplicationRow {
    clientName: string;
    debt: PackageDebtResponse;
    amountToApply: number;
}

export const PaymentRegistrationModal = ({ isOpen, onClose }: Props) => {
    const { success, error: toastError } = useToast();
    const queryClient = useQueryClient();
    
    // Estados
    const [step, setStep] = useState(1);
    const [applications, setApplications] = useState<ApplicationRow[]>([]);
    const [manualShake, setManualShake] = useState(0); 

    // Data Fetching
    const { parameters: paymentMethods, isLoading: loadingParams } = 
        useParameters(PARAM_CATEGORIES.PAYMENT_METHOD || 'TRANSACTION_STATUS');

    const { data: debtors = [] } = useQuery({
        queryKey: ['active-debtors'],
        queryFn: getActiveDebtors,
        enabled: isOpen,
    });

    // Obtenemos la fecha de hoy para el valor por defecto (YYYY-MM-DD)
    const getLocalDatetime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 19); 
    };
    const currentDateTime = getLocalDatetime();

    // 2. ✅ AÑADIMOS 'register', 'errors' Y EL DEFAULT VALUE DE LA FECHA
    const { register, control, trigger, getValues, watch, reset, formState: { errors, submitCount } } = useForm({
        resolver: zodResolver(paymentHeaderSchema),
        defaultValues: { 
            totalAmount: 0, 
            paymentMethodType: 0, 
            bankReference: "",
            transactionDate: currentDateTime
        },
        mode: "onChange"
    });
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setApplications([]);
            setManualShake(0);
            reset({
                totalAmount: 0,
                paymentMethodType: 0,
                bankReference: "",
                transactionDate: getLocalDatetime()
            });
        }
    }, [isOpen, reset]);

    const totalAmount = watch("totalAmount");

    // Mutación
    const mutation = useMutation({
        mutationFn: createAppliedPayment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["financial-reports"] });
            queryClient.invalidateQueries({ queryKey: ["active-debtors"] });
            success("Pago registrado correctamente");
            handleClose();
        },
        onError: () => toastError("Error al registrar el pago")
    });

    // --- LÓGICA DE NEGOCIO ---

    const handleClose = () => {
        setStep(1);
        setApplications([]);
        onClose();
    };

    const handleNext = async () => {
        const isValid = await trigger();
        if (isValid) {
            const currentTotalApp = applications.reduce((sum, app) => sum + app.amountToApply, 0);
            if (currentTotalApp > totalAmount) setApplications([]); 
            setStep(2);
            setManualShake(0); 
        } else {
            setManualShake(prev => prev + 1); 
        }
    };
    
    const debtorOptions = useMemo(() => {
        return debtors
            .filter(d => !applications.some(app => app.debt.id === d.reservations[0]?.id))
            .map(d => ({
                value: d.id,
                label: d.clientFullName,
                subtitle: d.identityCard,
                icon: <User size={14} className="text-primary"/>,
                rightContent: (
                    <div className="text-right">
                        <div className="text-[9px] opacity-50 uppercase font-bold">Deuda Global</div>
                        <div className="font-mono font-bold text-error text-xs">Bs. {d.totalGlobalBalance.toFixed(2)}</div>
                    </div>
                )
            }));
    }, [debtors, applications]);

    const handleSelectDebtor = (clientId: number | string) => {
        const client = debtors.find(d => d.id === clientId);
        if (!client) return;

        const defaultDebt = client.reservations[0];
        if (!defaultDebt) return;

        const currentAssigned = applications.reduce((sum, app) => sum + app.amountToApply, 0);
        const remainingTransaction = totalAmount - currentAssigned;
        const autoAmount = Math.min(remainingTransaction, defaultDebt.balance);

        if (autoAmount <= 0 && remainingTransaction <= 0) {
            toastError("Ya has distribuido todo el monto.");
            return;
        }

        setApplications(prev => [...prev, {
            clientName: client.clientFullName,
            debt: defaultDebt,
            amountToApply: autoAmount
        }]);
    };

    const handleRemoveApplication = (index: number) => {
        setApplications(prev => prev.filter((_, i) => i !== index));
    };

    const handleAmountChange = (index: number, newAmount: number) => {
        setApplications(prev => {
            const newApps = [...prev];
            const maxDebt = newApps[index].debt.balance;
            newApps[index].amountToApply = newAmount > maxDebt ? maxDebt : newAmount;
            return newApps;
        });
    };

    const handleChangeDebt = (index: number, newDebtId: number, client: ClientStatementResponse) => {
        const selectedDebt = client.reservations.find(r => r.id === newDebtId);
        if (selectedDebt) {
            setApplications(prev => {
                const newApps = [...prev];
                newApps[index].debt = selectedDebt;
                newApps[index].amountToApply = 0;
                return newApps;
            });
        }
    };

    // 4. ✅ CORREGIMOS EL ERROR DE TYPESCRIPT PASANDO transactionDate
    const onFinalSubmit = () => {
        const dataStep1 = getValues();
        const assignedTotal = applications.reduce((sum, app) => sum + app.amountToApply, 0);
        
        if (Math.abs(assignedTotal - dataStep1.totalAmount) > 0.01) {
            toastError(`Debes distribuir exactamente Bs. ${dataStep1.totalAmount}.`);
            return;
        }

        mutation.mutate({
            totalAmount: dataStep1.totalAmount,
            paymentMethodType: dataStep1.paymentMethodType,
            bankReference: dataStep1.bankReference,
            transactionDate: dataStep1.transactionDate,
            proofUrl: null,
            applications: applications.map(app => ({
                reservationClientId: app.debt.id,
                amountToApply: app.amountToApply
            }))
        });
    };

    // Cálculos UI
    const assignedAmount = applications.reduce((sum, item) => sum + item.amountToApply, 0);
    const remainingAmount = totalAmount - assignedAmount;
    const isBalanced = Math.abs(remainingAmount) < 0.01;

    if (!isOpen) return null;

    return (
        <TravesiaModal
            isOpen={isOpen}
            onClose={handleClose}
            title={
                <div className="flex items-center gap-2">
                    <Wallet className="text-primary" />
                    <span>Registrar Pago Agrupado</span>
                </div>
            }
            size="lg"
            actions={
                <div className="flex justify-between w-full">
                    <div>{step === 2 && <BtnBack onClick={() => setStep(1)} />}</div>
                    <div className="flex gap-2">
                        <BtnCancel onClick={handleClose} disabled={mutation.isPending} />
                        {step === 1 ? (
                            <BtnNext onClick={handleNext} />
                        ) : (
                            <BtnSave 
                                onClick={onFinalSubmit} 
                                isLoading={mutation.isPending}
                                disabled={!isBalanced} 
                            />
                        )}
                    </div>
                </div>
            }
        >
            <div className="flex flex-col h-[70vh] md:h-auto max-h-[600px] min-h-[400px]">
                
                <div className="shrink-0 mb-2 space-y-4">
                    <TravesiaStepper steps={["Datos de Transacción", "Distribución de Saldo"]} currentStep={step} />

                    {step === 2 && (
                        <div className="animate-fade-in space-y-4">
                            <div className="grid grid-cols-3 gap-2 bg-base-200 p-3 rounded-xl border border-base-300">
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] uppercase font-bold opacity-60">Total</span>
                                    <span className="font-mono font-black text-lg">Bs.{totalAmount}</span>
                                </div>
                                <div className="flex flex-col items-center border-l border-base-content/10">
                                    <span className="text-[10px] uppercase font-bold text-success">Asignado</span>
                                    <span className="font-mono font-black text-lg text-success">Bs.{assignedAmount}</span>
                                </div>
                                <div className="flex flex-col items-center border-l border-base-content/10">
                                    <span className={`text-[10px] uppercase font-bold ${isBalanced ? 'text-success' : 'text-error'}`}>
                                        Por Asignar
                                    </span>
                                    <span className={`font-mono font-black text-lg ${isBalanced ? 'text-success' : 'text-error animate-pulse'}`}>
                                        Bs.{remainingAmount.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <div className="relative z-50">
                                <RichSelect 
                                    label="Agregar Cliente a la Transacción"
                                    placeholder="Buscar por nombre o CI..."
                                    options={debtorOptions}
                                    onChange={handleSelectDebtor}
                                    value={null} 
                                    icon={<Plus size={16} className="text-primary"/>}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto px-1 custom-scrollbar pb-2">
                    
                    {step === 1 && (
                        <div className="space-y-4 animate-fade-in p-1 pt-2">
                            <Controller
                                name="totalAmount"
                                control={control}
                                render={({ field: { onChange, value }, fieldState: { error } }) => (
                                    <TravesiaFinancialInput
                                        label="Monto Total Recibido"
                                        value={value}
                                        onValueChange={(val) => onChange(val)}
                                        error={error?.message}
                                        placeholder="Ej: 1500"
                                        shakeKey={submitCount + manualShake}
                                    />
                                )}
                            />

                            {/* 3. ✅ SE AGREGA EL INPUT PARA LA FECHA JUNTO AL SELECT */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Controller
                                    name="paymentMethodType"
                                    control={control}
                                    render={({ field, fieldState: { error } }) => (
                                        <TravesiaSelect
                                            label="Método de Pago"
                                            {...field}
                                            value={field.value ? field.value.toString() : ""} 
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                            options={paymentMethods.map(p => ({ label: p.name, value: p.numericCode }))}
                                            isLoading={loadingParams}
                                            placeholder="Seleccione..."
                                            error={error?.message} 
                                            shakeKey={submitCount + manualShake}
                                        />
                                    )}
                                />

                                <TravesiaInput
                                    label="Fecha de Transacción"
                                    type="datetime-local"
                                    isRequired
                                    {...register("transactionDate")}
                                    error={errors.transactionDate?.message as string}
                                    shakeKey={submitCount + manualShake}
                                />
                            </div>

                            <TravesiaInput
                                label="Referencia Bancaria (Opcional)"
                                placeholder="Nro de comprobante, banco, o nota..."
                                {...register("bankReference")}
                            />
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-3 animate-fade-in pt-2">
                            {applications.length === 0 ? (
                                <div className="text-center py-10 opacity-40 border-2 border-dashed border-base-300 rounded-xl mx-1">
                                    <Plus className="mx-auto mb-2" />
                                    <p className="text-sm">Usa el buscador de arriba para agregar clientes.</p>
                                </div>
                            ) : (
                                applications.map((app, index) => {
                                    const debtorFull = debtors.find(d => d.clientFullName === app.clientName); 
                                    return (
                                        <div key={index} className="bg-base-100 border border-base-300 p-3 rounded-xl shadow-sm relative group mx-1">
                                            <button 
                                                onClick={() => handleRemoveApplication(index)}
                                                className="absolute top-2 right-2 btn btn-xs btn-circle btn-ghost text-error opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity bg-base-200 md:bg-transparent"
                                            >
                                                <Trash2 size={14} />
                                            </button>

                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <User size={16} className="text-primary"/>
                                                    <span className="font-bold text-sm">{app.clientName}</span>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                                                    <div className="flex flex-col gap-1 w-full">
                                                        <span className="text-[10px] font-bold opacity-60 flex items-center gap-1">
                                                            <Package size={10}/> Paquete / Deuda
                                                        </span>
                                                        {debtorFull && debtorFull.reservations.length > 1 ? (
                                                            <select 
                                                                className="select select-bordered select-xs w-full font-mono text-xs"
                                                                value={app.debt.id}
                                                                onChange={(e) => handleChangeDebt(index, Number(e.target.value), debtorFull)}
                                                            >
                                                                {debtorFull.reservations.map(r => (
                                                                    <option key={r.id} value={r.id}>
                                                                        {r.packageName} (Debe: {r.balance})
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <div className="text-xs font-mono bg-base-200 px-2 py-1 rounded truncate border border-base-300">
                                                                {app.debt.packageName}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-end gap-2">
                                                        <div className="flex-1">
                                                            <div className="flex justify-between text-[10px] mb-1">
                                                                <span className="font-bold opacity-60">A pagar</span>
                                                                <span className="text-error font-mono">Max: {app.debt.balance}</span>
                                                            </div>
                                                            <TravesiaFinancialInput 
                                                                value={app.amountToApply}
                                                                onValueChange={(val) => handleAmountChange(index, val)}
                                                                className={`h-8 text-sm ${app.amountToApply >= app.debt.balance ? "text-success font-bold" : ""}`}
                                                            />
                                                        </div>
                                                        {app.amountToApply >= app.debt.balance && (
                                                            <div className="tooltip tooltip-left" data-tip="Deuda saldada">
                                                                <CheckCircle2 className="text-success mb-2" size={20} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}

                            {!isBalanced && remainingAmount < 0 && (
                                <div className="alert alert-error py-2 text-xs flex items-center gap-2 mx-1 shadow-lg">
                                    <AlertTriangle size={16}/>
                                    <span>Error: Has asignado más dinero del recibido.</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </TravesiaModal>
    );
};