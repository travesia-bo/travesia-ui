import { ReactNode } from "react";

export interface Column<T> {
    header: string;
    accessorKey?: keyof T; // La clave directa del objeto (ej: 'name')
    render?: (item: T) => ReactNode; // Render personalizado (ej: botones, badges)
    className?: string; // Para anchos específicos o alineación
}

interface Props<T> {
    data: T[];
    columns: Column<T>[];
    isLoading?: boolean;
}

export const TravesiaTable = <T extends { id: number | string }>({ data, columns, isLoading }: Props<T>) => {
    if (isLoading) {
        return <div className="flex justify-center p-10"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
    }

    if (!data || data.length === 0) {
        return <div className="text-center p-10 text-gray-500">No se encontraron registros.</div>;
    }

    return (
        <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-200">
            <table className="table table-zebra w-full">
                <thead className="bg-base-200 text-base-content uppercase text-xs font-bold">
                    <tr>
                        {columns.map((col, idx) => (
                            <th key={idx} className={col.className}>{col.header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row) => (
                        <tr key={row.id} className="hover">
                            {columns.map((col, idx) => (
                                <td key={idx} className={col.className}>
                                    {col.render 
                                        ? col.render(row) 
                                        : (col.accessorKey ? String(row[col.accessorKey]) : '-')}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};