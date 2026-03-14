
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

    // parameters
    genderTypeName: string;
    genderTypeCode: number;
    clientTypeName: string;
    clientTypeCode: number;

    // Datos Académicos Aplanados
    universityId: number;
    universityName: string;
    universityAcronym: string;

    facultyId: number;
    facultyName: string;
    facultyAcronym: string;

    careerId: number;
    careerName: string;

    // parameters
    studyAreaTypeName: string;
    studyAreaTypeCode: number;

    // ciudad
    cityId: number;
    cityName: string;

    reservationCodes?: string;
}