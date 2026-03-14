import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Phone, Mail, BookOpen, GraduationCap, IdCard, Calendar } from 'lucide-react';

// Servicios y Tipos
import { getClients } from '../services/clientService';
import type { ClientResponse } from '../types/index';

// UI Components
import { TravesiaTable, type Column } from '../../../components/ui/TravesiaTable';
import { TravesiaInput } from '../../../components/ui/TravesiaInput';
import { CrudButtons } from '../../../components/ui/CrudButtons';
import { ClientFormModal } from '../components/ClientFormModal';

export const ClientsPage = () => {
    // 1. Data Fetching
    const { data: clients = [], isLoading } = useQuery({
        queryKey: ['clients', 'all'],
        queryFn: getClients
    });

    // 2. Estados de Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [searchReservation, setSearchReservation] = useState('');

    // 3. Lógica de Filtrado Local
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [clientToEdit, setClientToEdit] = useState<ClientResponse | null>(null);

    const filteredClients = useMemo(() => {
        return clients.filter(client => {
            // Filtro General (Nombre, CI, Email)
            const term = searchTerm.toLowerCase();
            const matchesSearch = 
                client.fullName.toLowerCase().includes(term) ||
                client.identityCard.toLowerCase().includes(term) ||
                (client.email && client.email.toLowerCase().includes(term));
            
            // Filtro por Código de Reserva
            const resTerm = searchReservation.toUpperCase().trim();
            const matchesReservation = resTerm === '' 
                ? true 
                : (client.reservationCodes && client.reservationCodes.toUpperCase().includes(resTerm));

            return matchesSearch && matchesReservation;
        });
    }, [clients, searchTerm, searchReservation]);

    // 4. Handlers (Vacíos por ahora)
    const handleEdit = (client: ClientResponse) => {
        setClientToEdit(client);
        setIsEditModalOpen(true);
    };

    const handleDelete = (client: ClientResponse) => {
        console.log("Intentando eliminar cliente (Bloqueado temporalmente):", client.id);
    };
// 5. Definición de Columnas
    const columns: Column<ClientResponse>[] = [
        {
            header: 'Cliente',
            accessorKey: 'fullName',
            render: (row) => (
                <div className="flex items-center gap-3 py-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Users size={20} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-base-content text-sm">{row.fullName}</span>
                        {/* Tipo de cliente (Ej: Estudiante, Particular, etc) */}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-base-content/50">
                            {row.clientTypeName}
                        </span>
                    </div>
                </div>
            )
        },
        {
            header: 'Identidad',
            render: (row) => {
                // Formateo seguro de fecha (de YYYY-MM-DD a DD/MM/YYYY) para evitar bugs de TimeZone
                const formattedDate = row.birthDate 
                    ? row.birthDate.split('-').reverse().join('/') 
                    : '--';

                return (
                    <div className="flex flex-col gap-1.5 text-xs">
                        <span className="flex items-center gap-1.5 font-mono font-medium">
                            <IdCard size={14} className="text-base-content/50"/> 
                            {row.identityCard}
                        </span>
                        <span className="flex items-center gap-1.5 text-base-content/70" title="Fecha de Nacimiento">
                            <Calendar size={14} className="text-base-content/50"/>
                            {formattedDate}
                        </span>
                    </div>
                );
            }
        },
        {
            header: 'Contacto',
            render: (row) => (
                <div className="flex flex-col gap-1.5 text-xs">
                    <span className="flex items-center gap-1.5 font-medium">
                        <Phone size={14} className="text-success"/> 
                        {row.phoneNumber}
                    </span>
                    {row.email ? (
                        <span className="flex items-center gap-1.5 text-base-content/70">
                            <Mail size={14} className="text-info"/> 
                            <span className="truncate max-w-[150px]" title={row.email}>{row.email}</span>
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 text-base-content/40 italic">
                            <Mail size={14} /> Sin correo
                        </span>
                    )}
                </div>
            )
        },
        {
            header: 'Perfil Académico',
            render: (row) => (
                <div className="flex flex-col gap-1 text-xs">
                    <span className="font-bold text-base-content/80 flex items-center gap-1.5">
                        <BookOpen size={14} className="text-secondary shrink-0"/>
                        <span className="truncate max-w-[200px]" title={row.universityName}>{row.universityName}</span>
                    </span>
                    <span className="flex items-center gap-1.5 opacity-80">
                        <GraduationCap size={14} className="text-base-content/50 shrink-0"/>
                        <span className="truncate max-w-[200px]" title={row.careerName}>{row.careerName}</span>
                    </span>
                    <span className="text-[10px] opacity-60 uppercase tracking-wide mt-0.5">
                        {row.grade}
                    </span>
                </div>
            )
        },
        {
            header: 'Acciones',
            className: 'text-right w-24',
            render: (row) => (
                <CrudButtons 
                    onEdit={() => handleEdit(row)} 
                    onDelete={() => handleDelete(row)} 
                />
            )
        }
    ];

    return (
        <div className="p-6 space-y-6 animate-fade-in container mx-auto max-w-7xl">
            {/* Header sin botón de Crear */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-base-200 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-base-content flex items-center gap-2">
                        <Users className="text-primary" /> 
                        Directorio de Clientes
                    </h1>
                    <p className="text-sm text-base-content/60">
                        Base de datos general de pasajeros y estudiantes registrados.
                    </p>
                </div>
                {/* Botón Excel opcional por si quieren descargar lo que ven en pantalla */}
                {/* <BtnExcel /> */}
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-base-100 p-4 rounded-xl shadow-sm border border-base-200">
                <div className="md:col-span-2">
                    <TravesiaInput 
                        label="Búsqueda General" 
                        placeholder="Nombre, CI o correo electrónico..." 
                        icon="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div>
                    {/* Filtro específico para código de reserva */}
                    <TravesiaInput 
                        label="Código de Reserva" 
                        placeholder="Ej: RES-8B85E" 
                        icon="hash"
                        uppercase
                        value={searchReservation}
                        onChange={(e) => setSearchReservation(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabla */}
            <TravesiaTable 
                data={filteredClients} 
                columns={columns} 
                isLoading={isLoading} 
            />

            {isEditModalOpen && (
                <ClientFormModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setClientToEdit(null);
                    }}
                    clientToEdit={clientToEdit}
                />
            )}
        </div>
    );
};

export default ClientsPage;