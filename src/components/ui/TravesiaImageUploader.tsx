import { useRef } from "react";
import { ImagePlus, X, Star, ArrowUp, ArrowDown } from "lucide-react";

export interface ImageItem {
    id: string; // URL temporal o ID único
    file: File;
    isCover: boolean;
}

interface Props {
    images: ImageItem[];
    onChange: (newImages: ImageItem[]) => void;
    error?: string;
    shakeKey?: number;
}

export const TravesiaImageUploader = ({ images, onChange, error, shakeKey }: Props) => {
    const inputRef = useRef<HTMLInputElement>(null);

    // Manejar selección de archivos
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            
            const newImageItems: ImageItem[] = newFiles.map(file => ({
                id: URL.createObjectURL(file), // Preview URL
                file,
                isCover: false // Se recalcula luego
            }));

            // Combinar con existentes
            const updatedList = [...images, ...newImageItems];
            updateListState(updatedList);
        }
        // Reset input para permitir seleccionar el mismo archivo si se borró
        if (inputRef.current) inputRef.current.value = "";
    };

    // Actualizar estado asegurando que el primero siempre es Cover
    const updateListState = (list: ImageItem[]) => {
        const validatedList = list.map((img, index) => ({
            ...img,
            isCover: index === 0 // Regla de negocio: El primero siempre es Cover
        }));
        onChange(validatedList);
    };

    const removeImage = (index: number) => {
        const newList = [...images];
        newList.splice(index, 1);
        updateListState(newList);
    };

    const moveImage = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === images.length - 1) return;

        const newList = [...images];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        
        // Intercambiar
        [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
        updateListState(newList);
    };

    return (
        <div className={`space-y-4 ${shakeKey ? 'animate-shake' : ''}`}>
            
            {/* ZONA DE CARGA */}
            <div 
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors
                    ${error ? 'border-error bg-error/5' : 'border-base-300 hover:bg-base-200/50 hover:border-primary/50'}
                `}
                onClick={() => inputRef.current?.click()}
            >
                <input 
                    ref={inputRef}
                    type="file" 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileSelect}
                />
                <div className="bg-base-200 p-3 rounded-full mb-2">
                    <ImagePlus size={24} className="text-base-content/60" />
                </div>
                <p className="font-medium text-sm">Click para seleccionar imágenes</p>
                <p className="text-xs text-base-content/50 mt-1">Soporta JPG, PNG, WEBP</p>
            </div>

            {error && <p className="text-xs text-error font-medium">{error}</p>}

            {/* LISTA DE IMÁGENES */}
            <div className="space-y-2">
                {images.map((img, index) => (
                    <div key={img.id} className={`flex items-center gap-3 p-2 rounded-lg border ${img.isCover ? 'border-primary bg-primary/5' : 'border-base-200 bg-base-100'}`}>
                        
                        {/* Preview */}
                        <div className="relative w-16 h-16 shrink-0 rounded-md overflow-hidden bg-base-300">
                            <img src={img.id} alt="preview" className="w-full h-full object-cover" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{img.file.name}</p>
                            <p className="text-xs text-base-content/60">
                                {(img.file.size / 1024).toFixed(1)} KB
                            </p>
                            {img.isCover && (
                                <span className="badge badge-primary badge-xs mt-1 gap-1">
                                    <Star size={8} fill="currentColor" /> PORTADA
                                </span>
                            )}
                        </div>

                        {/* Controles de Orden */}
                        <div className="flex flex-col gap-1">
                            <button 
                                type="button"
                                disabled={index === 0}
                                onClick={() => moveImage(index, 'up')}
                                className="btn btn-xs btn-square btn-ghost disabled:bg-transparent disabled:opacity-20"
                            >
                                <ArrowUp size={14} />
                            </button>
                            <button 
                                type="button"
                                disabled={index === images.length - 1}
                                onClick={() => moveImage(index, 'down')}
                                className="btn btn-xs btn-square btn-ghost disabled:bg-transparent disabled:opacity-20"
                            >
                                <ArrowDown size={14} />
                            </button>
                        </div>

                        {/* Borrar */}
                        <button 
                            type="button"
                            onClick={() => removeImage(index)}
                            className="btn btn-sm btn-square btn-ghost text-error hover:bg-error/10"
                        >
                            <X size={18} />
                        </button>
                    </div>
                ))}
                
                {images.length > 0 && (
                    <p className="text-xs text-center text-base-content/40 mt-2">
                        La primera imagen de la lista será la portada del producto.
                    </p>
                )}
            </div>
        </div>
    );
};