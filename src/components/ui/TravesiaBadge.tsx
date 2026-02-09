import { type BadgeType, getBadgeStyle } from "../../config/badgeConfig";

interface Props {
    label: string;           // El texto a mostrar (ej: "Hospedaje")
    code?: string | number | boolean; // El valor para decidir el color (ej: 602, true, "PENDING")
    type?: BadgeType;        // El contexto (ej: 'PRODUCT_CATEGORY')
    className?: string;      // Clases extra si necesitas
}

export const TravesiaBadge = ({ label, code, type = 'DEFAULT', className = '' }: Props) => {
    // Si no pasan código, usamos el label como fallback, o un default
    const codeToEvaluate = code ?? label;
    
    // Obtenemos la clase mágica
    const colorClass = getBadgeStyle(type, codeToEvaluate);

    return (
        <span className={`badge ${colorClass} gap-2 px-3 py-3 font-medium border-0 shadow-sm ${className}`}>
            {label}
        </span>
    );
};