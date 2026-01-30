import { useEffect, useRef, ReactNode } from "react";
import { X } from "lucide-react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    actions?: ReactNode;
    size?: "sm" | "md" | "lg" | "xl";
}

export const TravesiaModal = ({ isOpen, onClose, title, children, actions, size = "md" }: Props) => {
    const modalRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const modal = modalRef.current;
        if (!modal) return;

        if (isOpen) {
            modal.showModal();
        } else {
            modal.close();
        }
    }, [isOpen]);

    // ❌ BORRAMOS handleBackdropClick (Ya no queremos que cierre al clic afuera)

    const sizeClasses = {
        sm: "max-w-sm",
        md: "max-w-2xl",
        lg: "max-w-4xl",
        xl: "max-w-6xl",
    };

    return (
        <dialog 
            ref={modalRef} 
            // 1. CAMBIO: Quitamos 'modal-bottom' y agregamos 'modal-middle' explícito y z-index alto
            className="modal modal-middle !m-0 !p-0 z-[9999]"
            // ✅ AGREGAR ESTO: Capturamos el ESC
            onCancel={(e) => {
                e.preventDefault(); // 1. Evitamos que el navegador lo cierre "a escondidas"
                onClose();          // 2. Ejecutamos tu función para poner isModalOpen(false)
            }}
        >
            <div className={`modal-box ${sizeClasses[size]} p-0 overflow-hidden bg-base-100 shadow-2xl`}>
                {/* Header */}
                <div className="bg-base-200 px-6 py-4 flex justify-between items-center border-b border-base-300">
                    <h3 className="font-bold text-lg text-base-content">{title}</h3>
                    {/* Botón X: Única forma de salir (además de cancelar) */}
                    <button 
                        type="button"
                        onClick={onClose} 
                        className="btn btn-sm btn-circle btn-ghost hover:bg-base-300"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {children}
                </div>

                {/* Footer */}
                {actions && (
                    <div className="modal-action bg-base-100 px-6 py-4 mt-0 border-t border-base-200 flex justify-end gap-2">
                        {actions}
                    </div>
                )}
            </div>
            
            {/* ❌ BORRAMOS EL FORM BACKDROP AQUI (El que cerraba al hacer clic afuera) */}
        </dialog>
    );
};