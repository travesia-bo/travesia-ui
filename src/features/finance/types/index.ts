// src/features/finance/types/index.ts

export interface TransactionResponse {
    id: number;
    amount: number;
    transactionDate: string; // ISO String
    
    // Método de Pago
    paymentMethodName: string;
    paymentMethodCode: number;
    
    // Detalles
    bankReference: string | null;
    proofUrl: string | null;
    
    // Estado
    statusName: string;
    statusCode: number;
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