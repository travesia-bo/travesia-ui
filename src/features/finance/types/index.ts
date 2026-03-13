export interface TransactionApplicationResponse {
    appliedPaymentId: number;
    clientFullName: string;
    packageName: string;
    reservationCode: string;
    appliedAmount: number;
}

export interface TransactionResponse {
    id: number;
    amount: number;
    transactionDate: string; // ISO String de LocalDateTime
    paymentMethodName: string;
    paymentMethodCode: number;
    bankReference?: string;
    proofUrl?: string;
    statusName: string;
    statusCode: number;
    applications: TransactionApplicationResponse[]; 
}

// ✅ NUEVO: DTO para actualizar transacción
export interface UpdateTransactionRequest {
    amount: number;
    transactionDate: string; // ISO String LocalDateTime
    paymentMethodType: number; // Numeric Code del parámetro
    bankReference?: string;
    proofUrl?: string | null; // Lo enviaremos oculto para no perderlo
    statusType: number; // Numeric Code del parámetro
}