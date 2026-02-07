import api from "../../../lib/axios";
import type { ClientFinancialReportResponse, 
    ClientStatementResponse, 
    CreatePaymentRequest } from "../types";

export const getFinancialReports = async (): Promise<ClientFinancialReportResponse[]> => {
    const { data } = await api.get<ClientFinancialReportResponse[]>('/sales/financial-reports');
    return data;
};

export const getActiveDebtors = async (): Promise<ClientStatementResponse[]> => {
    const { data } = await api.get<ClientStatementResponse[]>('/sales/financial-reports/active-debtors');
    return data;
};

export const createAppliedPayment = async (payload: CreatePaymentRequest): Promise<void> => {
    await api.post('/sales/applied-payments', payload);
};