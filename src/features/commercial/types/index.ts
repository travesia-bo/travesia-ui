
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