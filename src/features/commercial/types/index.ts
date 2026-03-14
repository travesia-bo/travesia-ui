
export interface SellerResponse {
    // Datos de Vendedor
    id: number;
    targetTypeName: string;
    targetTypeCode: number;
    isCommissionExempt: boolean;
    targetValue: number; // BigDecimal viene como number

    // Datos Personales
    fullName: string;
    firstName: string;
    paternalSurname: string;
    maternalSurname?: string;
    identityCard: string;
    phoneNumber: string;
    email: string;

    // Datos de Usuario
    username: string;
    userStatusName: string;
    userStatusCode: number;
}

export interface ClientResponse {
    id: number;
    fullName: string;
    firstName: string;
    paternalSurname: string;
    maternalSurname?: string;
    phoneNumber: number;
    email?: string;
    identityCard: string;
    birthDate: string;
    grade: string;
    
    // Parámetros
    genderTypeName: string;
    genderTypeCode: number;
    clientTypeName: string;
    clientTypeCode: number;
    
    // Académico
    universityName: string;
    facultyName: string;
    careerName: string;
    
    // Reservas (Viene como string separado por comas: "RES-8B85E, RES-1C3A9")
    reservationCodes?: string;
}