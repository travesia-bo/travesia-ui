// src/features/finance/components/TransactionFormModal.tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../../context/ToastContext"; 
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Hooks & Services
import { useParameters } from "../../../hooks/useParameters";
import { updateTransaction } from "../services/transactionService";
import { PARAM_CATEGORIES } from "../../../config/constants"; 
import type { TransactionResponse } from "../types";

// UI Components
import { TravesiaModal } from "../../../components/ui/TravesiaModal";
import { TravesiaInput } from "../../../components/ui/TravesiaInput";
import { TravesiaSelect } from "../../../components/ui/TravesiaSelect";
import { BtnSave, BtnCancel } from "../../../components/ui/CrudButtons";

// Esquema de Validación
const schema = z.object({
    amount: z.coerce.number().min(0.01, "El monto debe ser mayor a 0"),
    transactionDate: z.string().min(1, "La fecha es requerida"),
    paymentMethodType: z.coerce.number().min(1, "Seleccione un método de pago"),
    bankReference: z.string().max(200, "Máximo 200 caracteres").optional(),
    statusType: z.coerce.number().min(1, "Seleccione un estado"),
});

interface Props {
    isOpen: boolean;
    onClose: () => void;
    transactionToEdit: TransactionResponse | null;
}

export const TransactionFormModal = ({ isOpen, onClose, transactionToEdit }: Props) => {
    const { success, error: toastError } = useToast();
    const queryClient = useQueryClient();

    // Carga de Parámetros
    const { parameters: paymentMethods, isLoading: loadingPayments } = useParameters(PARAM_CATEGORIES.PAYMENT_METHOD);
    const { parameters: statuses, isLoading: loadingStatuses } = useParameters(PARAM_CATEGORIES.TRANSACTION_STATUS);

    // Formatear hoy como YYYY-MM-DD
    const getLocalDatetime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 19); 
    };

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            amount: 0,
            transactionDate: getLocalDatetime(),
            paymentMethodType: 0,
            bankReference: "",
            statusType: 0
        }
    });

    // ✅ Cargar datos al abrir para editar
    useEffect(() => {
        if (isOpen && transactionToEdit) {
            reset({
                amount: transactionToEdit.amount,
                transactionDate: transactionToEdit.transactionDate.slice(0, 19),
                paymentMethodType: transactionToEdit.paymentMethodCode,
                bankReference: transactionToEdit.bankReference || "",
                statusType: transactionToEdit.statusCode
            });
        }
    }, [isOpen, transactionToEdit, reset]);

    // Mutación
    const mutation = useMutation({
        mutationFn: (data: any) => updateTransaction(transactionToEdit!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance', 'income'] });
            success("Transacción actualizada correctamente");
            onClose();
        },
        onError: () => {
            toastError("Error al actualizar la transacción");
        }
    });

    const onSubmit = (data: any) => {
        // ✅ AQUÍ ARMAMOS EL PAYLOAD PERFECTO PARA EL BACKEND
        const payload = {
            ...data,
            // Al string YYYY-MM-DD le pegamos siempre la medianoche. ¡Adiós bug de TimeZone!
            transactionDate: data.transactionDate,
            proofUrl: transactionToEdit?.proofUrl 
        };
        
        mutation.mutate(payload);
    };

    // Verificamos si estamos editando para bloquear campos
    const isEditing = !!transactionToEdit;

    return (
        <TravesiaModal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Editar Transacción" : "Nueva Transacción"}
            size="md"
            actions={
                <div className="flex justify-end gap-2 w-full">
                    <BtnCancel onClick={onClose} disabled={isSubmitting} />
                    <BtnSave 
                        onClick={handleSubmit(onSubmit)} 
                        isLoading={isSubmitting || mutation.isPending} 
                    />
                </div>
            }
        >
            <form className="space-y-4 pt-2">
                
                {/* Monto y Estado */}
                <div className="w-full">
                    {/* ✅ BLOQUEO DE MONTO AL EDITAR */}
                    <TravesiaInput
                        label="Monto (Bs)"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        readOnly={isEditing} // Jamás se edita si existe
                        className={`font-mono font-bold ${isEditing ? "bg-base-200 text-base-content/50 cursor-not-allowed" : ""}`}
                        helperText={isEditing ? "El monto no puede modificarse" : undefined}
                        {...register("amount")}
                        error={errors.amount?.message as string}
                    />
                </div>

                {/* ✅ FECHA CORREGIDA CON INPUT NATIVO DATE */}
                <div className="grid grid-cols-2 gap-4">
                    <TravesiaInput
                        label="Fecha de Transacción"
                        type="datetime-local"
                        step="1" 
                        isRequired
                        {...register("transactionDate")}
                        error={errors.transactionDate?.message as string}
                    />
                    
                    <TravesiaSelect
                        label="Estado"
                        options={statuses.map(p => ({ value: p.numericCode, label: p.name }))}
                        isLoading={loadingStatuses}
                        {...register("statusType")}
                        error={errors.statusType?.message as string}
                    />
                </div>

                {/* Método de Pago y Referencia */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TravesiaSelect
                        label="Método de Pago"
                        options={paymentMethods.map(p => ({ value: p.numericCode, label: p.name }))}
                        isLoading={loadingPayments}
                        {...register("paymentMethodType")}
                        error={errors.paymentMethodType?.message as string}
                    />
                    
                    <TravesiaInput
                        label="Referencia Bancaria"
                        placeholder="Ej: 12345678"
                        {...register("bankReference")}
                        error={errors.bankReference?.message as string}
                    />
                </div>
            </form>
        </TravesiaModal>
    );
};