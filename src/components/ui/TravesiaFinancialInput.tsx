import { forwardRef, useEffect, useState } from 'react';

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    label?: string;
    error?: string;
    value: number;
    onValueChange: (val: number) => void; // ✅ Propiedad personalizada
    prefix?: string;
    shakeKey?: number;
}

export const TravesiaFinancialInput = forwardRef<HTMLInputElement, Props>(
    ({ label, error, value, onValueChange, className, prefix = "Bs.", shakeKey, ...props }, ref) => {
        const [isShaking, setIsShaking] = useState(false);
        
        useEffect(() => {
            if (shakeKey && shakeKey > 0) {
                setIsShaking(true);
                const timer = setTimeout(() => setIsShaking(false), 500);
                return () => clearTimeout(timer);
            }
        }, [shakeKey]);

        return (
            <div className={`form-control w-full ${isShaking ? 'animate-shake' : ''}`}>
                {label && (
                    <label className="label py-1">
                        <span className={`label-text font-semibold ${error ? "text-error" : "opacity-70"}`}>
                            {label}
                        </span>
                    </label>
                )}
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-sm">
                        {prefix}
                    </span>
                    <input
                        ref={ref}
                        type="number"
                        className={`input input-bordered w-full pl-3 font-mono ${error ? 'input-error' : ''} ${className}`}
                        value={value === 0 ? '' : value} // Muestra vacío si es 0 para mejor UX al escribir
                        onChange={(e) => {
                            // ✅ Convertimos el evento a número limpio
                            const val = parseFloat(e.target.value);
                            onValueChange(isNaN(val) ? 0 : val);
                        }}
                        onWheel={(e) => e.currentTarget.blur()} // Evita cambiar valor con scroll del mouse
                        step="0.01"
                        min="0"
                        {...props}
                    />
                </div>
                {error && (
                    <label className="label py-0.5">
                        <span className="label-text-alt text-error">{error}</span>
                    </label>
                )}
            </div>
        );
    }
);

TravesiaFinancialInput.displayName = "TravesiaFinancialInput";