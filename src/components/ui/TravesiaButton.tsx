import React from "react";

// Agregamos las nuevas variantes a la lista
type ButtonVariant = 
  | "primary" | "secondary" | "neutral" | "ghost" 
  | "save" | "delete" | "cancel" | "edit" // CRUD Básico
  | "excel" | "pdf" // Reportes
  | "success" | "error" | "warning" | "info" | "create"; 

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string; // Ahora es opcional (porque los botones redondos no llevan texto)
  variant?: ButtonVariant;
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  isIconOnly?: boolean; // Nueva prop para hacerlos redondos
  tooltip?: string; // Útil para botones sin texto
}

export const TravesiaButton = ({ 
  label, 
  variant = "primary", 
  isLoading = false, 
  icon,
  fullWidth = false,
  isIconOnly = false,
  className = "",
  tooltip,
  ...props 
}: Props) => {

  const getVariantClass = () => {
    switch (variant) {
      // Clases mapeadas en index.css
      case "save": return "btn-travesia-save border-none"; 
      case "delete": return "btn-travesia-delete border-none";
      case "cancel": return "btn-travesia-delete border-none"; // Reusamos el rojo para cancelar como pediste
      
      case "edit": return "btn-travesia-edit border-none";
      case "excel": return "btn-travesia-excel border-none";
      case "pdf": return "btn-travesia-pdf border-none";
      case "create": return "btn-travesia-create border-none";
      
      // Defaults de DaisyUI
      case "neutral": return "btn-neutral text-white";
      case "ghost": return "btn-travesia-ghost text-white"; 
      default: return "btn-travesia-primary text-white";
    }
  };

  const content = (
    <button 
      className={`
        btn 
        ${getVariantClass()} 
        ${fullWidth ? "w-full" : ""}
        ${isIconOnly ? "btn-circle btn-sm md:btn-md" : "min-w-[120px] gap-2"} 
        shadow-sm hover:shadow-md transition-all
        ${className}
      `} 
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <span className="loading loading-spinner"></span> : icon}
      {!isIconOnly && label}
    </button>
  );

  // Si tiene tooltip, lo envolvemos
  if (tooltip) {
    return <div className="tooltip" data-tip={tooltip}>{content}</div>;
  }

  return content;
};