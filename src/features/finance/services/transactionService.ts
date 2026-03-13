import api from "../../../lib/axios";
import type { TransactionResponse, UpdateTransactionRequest } from "../types/index";

export const getTransactions = async (): Promise<TransactionResponse[]> => {
    const { data } = await api.get<TransactionResponse[]>('/sales/transactions');
    return data;
};

/**
 * Actualiza una transacción existente
 */
export const updateTransaction = async (id: number, data: UpdateTransactionRequest): Promise<TransactionResponse> => {
    const { data: response } = await api.put<TransactionResponse>(`/sales/transactions/${id}`, data);
    return response;
};

export const deleteTransaction = async (id: number): Promise<void> => {
    await api.delete(`/sales/transactions/${id}`);
};