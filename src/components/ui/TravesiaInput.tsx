import React from "react";
import { IconRenderer } from "./IconRenderer";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
}

export const TravesiaInput = ({ label, error, icon, className = "", ...props }: Props) => {
  return (
    <div className="form-control w-full">
      {label && (
        <label className="label">
          <span className={`label-text font-semibold ${error ? "text-error" : ""}`}>
              {label}
          </span>
        </label>
      )}
      
      <div className="relative">
        {/* 1. EL INPUT VA PRIMERO (Fondo) */}
        <input
          className={`
            input input-bordered w-full 
            ${error ? "input-error" : ""} 
            ${icon ? "pl-10" : ""} 
            ${className}
          `}
          {...props}
        />

        {/* 2. EL ICONO VA DESPUÉS (Para que flote ENCIMA del input) */}
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-base-content/50">
             <IconRenderer iconName={icon} size={18} />
          </div>
        )}
      </div>
      
      {error && (
        <label className="label">
          <span className="label-text-alt text-error">{error}</span>
        </label>
      )}
    </div>
  );
};