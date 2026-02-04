import api from "../../../lib/axios";

export interface Career {
    id: number;
    name: string;
    studyAreaName: string;
    facultyName: string;
}

export const getCareers = async (): Promise<Career[]> => {
    const { data } = await api.get<Career[]>('/academic/careers');
    return data;
};