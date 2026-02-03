import { forwardRef } from "react";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    badge?: React.ReactNode;   // Para "Auto-calculado"
    suffix?: React.ReactNode;  // Para "%" o "Bs"
    helperText?: string;       // Para el texto de ayuda inferior
}

export const TravesiaFinancialInput = forwardRef<HTMLInputElement, Props>(
    ({ label, error, badge, suffix, helperText, className = "", ...props }, ref) => {
        return (
            <div className="form-control w-full">
                {/* LABEL + BADGE */}
                <label className="label cursor-pointer justify-start gap-2 pb-1">
                    <span className="label-text text-xs font-bold uppercase opacity-60">
                        {label}
                    </span>
                    {badge}
                </label>

                {/* INPUT GROUP */}
                {/* Usamos 'flex' para asegurar que estén en línea y 'w-full' para el ancho total */}
                <div className={`flex items-center w-full ${suffix ? "join" : ""}`}>
                    <input
                        ref={ref}
                        className={`
                            input input-bordered 
                            /* Si hay sufijo, usamos flex-1 para llenar espacio restante y quitamos borde derecho */
                            ${suffix ? "join-item flex-1 min-w-0 rounded-r-none border-r-0" : "w-full"} 
                            ${error ? "input-error text-error" : ""}
                            ${className}
                        `}
                        {...props}
                    />
                    
                    {/* SUFIJO (Si existe) */}
                    {suffix && (
                        <span className="join-item btn btn-md no-animation bg-base-200 border-base-300 border-l-0 px-4 cursor-default hover:bg-base-200 hover:border-base-300 shrink-0 text-base-content/70 font-bold">
                            {suffix}
                        </span>
                    )}
                </div>

                {/* MENSAJES DE ERROR O AYUDA */}
                {error && (
                    <span className="text-error text-xs mt-1 block animate-fade-in font-medium">
                        {error}
                    </span>
                )}
                
                {!error && helperText && (
                    <p className="text-xs text-base-content/50 mt-1 italic animate-fade-in ml-1">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

TravesiaFinancialInput.displayName = "TravesiaFinancialInput";