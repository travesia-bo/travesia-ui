import api from '../../../lib/axios';
import type { ClientResponse } from "../types/index";

export const getClients = async (): Promise<ClientResponse[]> => {
    const { data } = await api.get<ClientResponse[]>("/commercial/clients");
    return data;
};