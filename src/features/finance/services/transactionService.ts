import api from "../../../lib/axios";
import type { TransactionResponse } from "../types/index";

export const getTransactions = async (): Promise<TransactionResponse[]> => {
    const { data } = await api.get<TransactionResponse[]>('/sales/transactions');
    return data;
};