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