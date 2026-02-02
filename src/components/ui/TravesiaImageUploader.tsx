import { useRef } from "react";
import { ImagePlus, X, Star, ArrowUp, ArrowDown, AlertTriangle } from "lucide-react";
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB, ALLOWED_IMAGE_TYPES } from "../../config/storage";

export interface ImageItem {
    id: string; // Para keys de React (puede ser la URL o un UUID temporal)
    preview: string; // Lo que mostramos en la etiqueta <img>
    file?: File; // Si existe, es NUEVA. Si no existe, es del SERVIDOR.
    isCover: boolean;
    name?: string; // Nombre para mostrar en UI
}

interface Props {
    images: ImageItem[];
    onChange: (newImages: ImageItem[]) => void;
    error?: string;
    shakeKey?: number;
}

export const TravesiaImageUploader = ({ images, onChange, error, shakeKey }: Props) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            const validNewItems: ImageItem[] = [];

            files.forEach(file => {
                // 1. Validar Tipo
                if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
                    alert(`El archivo "${file.name}" no es una imagen válida.`);
                    return;
                }

                // 2. Validar Tamaño
                if (file.size > MAX_FILE_SIZE_BYTES) {
                    alert(`El archivo "${file.name}" supera el límite de ${MAX_FILE_SIZE_MB}MB.`);
                    return;
                }

                // Crear objeto local
                validNewItems.push({
                    id: URL.createObjectURL(file), // URL temporal del navegador
                    preview: URL.createObjectURL(file),
                    file: file, // Guardamos el archivo para subirlo luego
                    isCover: false,
                    name: file.name
                });
            });

            const updatedList = [...images, ...validNewItems];
            updateListState(updatedList);
        }
        // Reset input para permitir subir el mismo archivo si se borró
        if (inputRef.current) inputRef.current.value = "";
    };

    const updateListState = (list: ImageItem[]) => {
        const validatedList = list.map((img, index) => ({
            ...img,
            isCover: index === 0 // El primero siempre es cover
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
        [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
        updateListState(newList);
    };

    // Helper para mostrar nombres bonitos
    const getDisplayName = (img: ImageItem) => {
        if (img.name) return img.name;
        // Si es URL de Cloudinary, intentamos sacar el nombre final
        try {
            const parts = img.preview.split('/');
            return parts[parts.length - 1]; // "mifoto.jpg"
        } catch {
            return "Imagen guardada";
        }
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
                    accept={ALLOWED_IMAGE_TYPES.join(',')} // Filtro nativo del OS
                    className="hidden" 
                    onChange={handleFileSelect}
                />
                <div className="bg-base-200 p-3 rounded-full mb-2">
                    <ImagePlus size={24} className="text-base-content/60" />
                </div>
                <p className="font-medium text-sm">Click para seleccionar imágenes</p>
                <p className="text-xs text-base-content/50 mt-1">
                    Máx. {MAX_FILE_SIZE_MB}MB • JPG, PNG, WEBP
                </p>
            </div>

            {error && <p className="text-xs text-error font-medium">{error}</p>}

            {/* LISTA DE IMÁGENES */}
            <div className="space-y-2">
                {images.map((img, index) => (
                    <div key={img.id} className={`flex items-center gap-3 p-2 rounded-lg border ${img.isCover ? 'border-primary bg-primary/5' : 'border-base-200 bg-base-100'}`}>
                        
                        {/* Preview */}
                        <div className="relative w-16 h-16 shrink-0 rounded-md overflow-hidden bg-base-300">
                            <img src={img.preview} alt="preview" className="w-full h-full object-cover" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate" title={getDisplayName(img)}>
                                {getDisplayName(img)}
                            </p>
                            
                            <div className="flex gap-2 mt-1">
                                {img.file ? (
                                    <span className="badge badge-warning badge-xs opacity-70">NUEVA</span>
                                ) : (
                                    <span className="badge badge-ghost badge-xs opacity-50">GUARDADA</span>
                                )}
                                
                                {img.isCover && (
                                    <span className="badge badge-primary badge-xs gap-1">
                                        <Star size={8} fill="currentColor" /> PORTADA
                                    </span>
                                )}
                            </div>
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
            </div>
        </div>
    );
};