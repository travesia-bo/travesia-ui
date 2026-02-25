import api from "../../../lib/axios";

export interface University {
    id: number;
    name: string;
    acronym: string;
}

export interface faculty {
    id: number;
    name: string;
    acronym: string;
}

export interface Career {
    id: number;
    name: string;
    studyAreaName: string;
    studyAreaCode: number;
}



export const getUniversities = async (): Promise<University[]> => {
    const { data } = await api.get<University[]>('/academic/universities');
    return data;
};


export const getFaculties = async (): Promise<faculty[]> => {
    const { data } = await api.get<faculty[]>('/academic/faculties');
    return data;
};


export const getCareers = async (): Promise<Career[]> => {
    const { data } = await api.get<Career[]>('/academic/careers');
    return data;
};