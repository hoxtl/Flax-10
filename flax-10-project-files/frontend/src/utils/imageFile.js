/**
 * Helpers for handling single image file uploads.
 */

export function readImageFile(file, onLoad, onReset) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        onLoad?.(event.target.result);
        onReset?.();
    };
    reader.readAsDataURL(file);
}

export function resetFileInput(ref) {
    if (ref?.current) ref.current.value = "";
}
