import { useState, useRef, useEffect } from "react";
import { Image as ImageIcon, Upload, GripVertical } from "lucide-react";
import styles from "../styles/TaskWidget.module.css"; // Reuse card base styles

export function ImageWidget({ widgetData, onUpdateImage, onUpdateSpan, isEditing }) {
    const [isHovered, setIsHovered] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const fileInputRef = useRef(null);
    const startX = useRef(0);

    // Default size is 2 to match Discover widget
    const currentSpan = widgetData.span || 2;

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

    const handleResizeStart = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsResizing(true);
        startX.current = e.clientX;
        document.body.style.cursor = "ew-resize";
    };

    useEffect(() => {
        const handlePointerMove = (e) => {
            if (!isResizing) return;
            const diff = e.clientX - startX.current;

            // X-pixels delta threshold to step span sizes
            if (diff > 80 && currentSpan < 3) {
                onUpdateSpan(widgetData.id, currentSpan + 1);
                startX.current = e.clientX;
            } else if (diff < -80 && currentSpan > 1) {
                onUpdateSpan(widgetData.id, currentSpan - 1);
                startX.current = e.clientX;
            }
        };

        const handlePointerUp = () => {
            setIsResizing(false);
            document.body.style.cursor = "";
        };

        if (isResizing) {
            window.addEventListener("pointermove", handlePointerMove);
            window.addEventListener("pointerup", handlePointerUp);
        }
        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };
    }, [isResizing, currentSpan, onUpdateSpan, widgetData.id]);

    const hasImage = !!widgetData?.url;

    // Compute dynamic aspect ratio so the image scale isn't distorted by other tall widgets in the row
    const getAspectRatio = () => {
        if (currentSpan === 1) return '1 / 1';
        if (currentSpan === 2) return '2 / 1';
        if (currentSpan === 3) return '3 / 1';
        return '2 / 1';
    };

    return (
        <div
            className={`flex flex-col w-full relative rounded-[24px] overflow-hidden group shadow-sm transition-all ${isResizing ? 'ring-4 ring-black/10 scale-[1.02]' : 'hover:shadow-md'}`}
            style={{
                backgroundColor: 'var(--color-card)',
                border: '1px solid rgba(139, 115, 85, 0.06)',
                aspectRatio: getAspectRatio()
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {hasImage ? (
                <div className="absolute inset-0 w-full h-full p-[2px]">
                    <div className="relative w-full h-full rounded-[20px] overflow-hidden">
                        <img
                            src={widgetData.url}
                            alt="Custom user widget"
                            className="w-full h-full object-cover"
                        />
                        {isEditing && (
                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white/90 text-xs font-medium mb-3">Widget Preview</span>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/95 text-stone-800 font-semibold rounded-full shadow-lg hover:bg-white text-sm hover:scale-105 transition-transform"
                                >
                                    <Upload size={14} /> Change Photo
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center w-full h-full p-6">
                    <div className="flex flex-col items-center justify-center w-full h-full gap-3 p-4 bg-stone-50/50 border-2 border-dashed border-stone-200/80 rounded-[18px] transition-colors hover:bg-stone-50">
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-stone-400">
                            <ImageIcon size={22} />
                        </div>
                        {isEditing ? (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="text-sm font-semibold text-stone-600 hover:text-stone-900 mt-1"
                            >
                                Upload Photo
                            </button>
                        ) : (
                            <span className="text-sm text-stone-400 font-medium mt-1">Empty Widget</span>
                        )}
                    </div>
                </div>
            )}

            {/* Custom drag-to-resize handle */}
            {isEditing && (
                <div
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-14 bg-white/90 backdrop-blur-md rounded-l-lg shadow-sm border border-stone-200 flex items-center justify-center cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-stone-50"
                    onPointerDown={handleResizeStart}
                >
                    <GripVertical size={14} className="text-stone-400 pointer-events-none" />
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
