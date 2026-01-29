interface Props {
    statusName: string;
    statusCode?: number; // Opcional, para lógica de colores más avanzada
}

export const StatusBadge = ({ statusName, statusCode }: Props) => {
    let colorClass = "badge-ghost";

    // Lógica de colores basada en nombres comunes o códigos específicos
    const lowerStatus = statusName.toLowerCase();
    
    if (lowerStatus.includes('confirmada') || lowerStatus.includes('activo')) colorClass = "badge-success text-white";
    else if (lowerStatus.includes('pendiente')) colorClass = "badge-warning text-white";
    else if (lowerStatus.includes('cancelada') || lowerStatus.includes('inactivo')) colorClass = "badge-error text-white";

    return (
        <span className={`badge ${colorClass} gap-2 px-3 py-3`}>
            {statusName}
        </span>
    );
};