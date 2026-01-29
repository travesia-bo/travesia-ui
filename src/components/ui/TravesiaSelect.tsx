import React from "react";

export interface SelectOption {
    value: string | number;
    label: string;
}

interface Props extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
  isLoading?: boolean;
  enableDefaultOption?: boolean; // 1. NUEVA PROPIEDAD
}

export const TravesiaSelect = ({ 
    label, 
    options, 
    error, 
    isLoading, 
    placeholder = "Seleccione...", 
    enableDefaultOption = false, // Por defecto sigue bloqueada (para formularios)
    ...props 
}: Props) => {
  return (
    <div className="form-control w-full">
      <label className="label">
        <span className={`label-text font-semibold ${error ? "text-error" : ""}`}>{label}</span>
      </label>
      
      <select 
        className={`select select-bordered w-full ${error ? "select-error" : ""}`} 
        disabled={isLoading}
        {...props}
      >
        {/* 2. LÓGICA CORREGIDA: Solo se deshabilita si NO permitimos default y NO está cargando */}
        <option 
            disabled={isLoading || !enableDefaultOption} 
            value=""
        >
            {isLoading ? "Cargando datos..." : placeholder}
        </option>
        
        {!isLoading && options.map((opt) => (
            <option key={opt.value} value={opt.value}>
                {opt.label}
            </option>
        ))}
      </select>

      {error && (
        <label className="label">
          <span className="label-text-alt text-error">{error}</span>
        </label>
      )}
    </div>
  );
};