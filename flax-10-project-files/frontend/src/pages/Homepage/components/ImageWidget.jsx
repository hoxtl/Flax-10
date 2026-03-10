import { useState, useRef } from "react";
import { Image as ImageIcon, Upload, X } from "lucide-react";
import styles from "../styles/TaskWidget.module.css"; // Reuse card base styles

export function ImageWidget({ widgetData, onUpdateImage, isEditing }) {
    const [isHovered, setIsHovered] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Str = event.target.result;
            onUpdateImage(widgetData.id, base64Str);
        };
        reader.readAsDataURL(file);
    };

    const hasImage = !!widgetData?.url;

    return (
        <div
            className="flex flex-col h-full min-h-[160px] relative rounded-xl overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {hasImage ? (
                <div className="absolute inset-0 w-full h-full">
                    <img
                        src={widgetData.url}
                        alt="Custom user widget"
                        className="w-full h-full object-cover"
                    />
                    {isEditing && isHovered && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm transition-opacity">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2 bg-white/90 text-stone-800 font-semibold rounded-full shadow-sm hover:bg-white text-sm"
                            >
                                <Upload size={14} /> Change Photo
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full flex-1 gap-3 p-4 bg-stone-50 border-2 border-dashed border-stone-200 rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                        <ImageIcon size={24} />
                    </div>
                    {isEditing ? (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-sm font-semibold text-stone-600 hover:text-stone-900"
                        >
                            Upload Photo
                        </button>
                    ) : (
                        <span className="text-sm text-stone-500 font-medium">No photo selected</span>
                    )}
                </div>
            )}

            {/* Hidden file input */}
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />
        </div>
    );
}
