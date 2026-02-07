import api from "../../../lib/axios";
import { type ClientFinancialReportResponse } from "../types";

export const getFinancialReports = async (): Promise<ClientFinancialReportResponse[]> => {
    const { data } = await api.get<ClientFinancialReportResponse[]>('/sales/financial-reports');
    return data;
};