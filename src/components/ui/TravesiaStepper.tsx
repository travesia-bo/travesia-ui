interface Props {
    steps: string[];      // Array con los nombres: ["Datos", "Precios", "Confirmar"]
    currentStep: number;  // El número del paso actual (1-based)
    className?: string;
}

export const TravesiaStepper = ({ steps, currentStep, className = "" }: Props) => {
    return (
        <div className={`w-full px-4 mb-6 ${className}`}>
            <ul className="steps steps-horizontal w-full">
                {steps.map((label, index) => {
                    const stepNumber = index + 1;
                    const isActive = stepNumber <= currentStep;
                    
                    return (
                        <li 
                            key={index}
                            data-content={isActive ? "✓" : stepNumber}
                            className={`step transition-colors duration-300 ${isActive ? 'step-primary font-bold text-primary' : 'text-base-content/60'}`}
                        >
                            {label}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};