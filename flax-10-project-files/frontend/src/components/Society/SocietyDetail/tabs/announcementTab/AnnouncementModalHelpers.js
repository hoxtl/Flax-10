export const MAX_IMAGES = 5;

export function getInitialForm(announcement) {
    const base = {
        title: "", content: "", images: [], tag: null, addAsEvent: false,
        all_day: false, start_time: "", end_time: "", recurrence: "", pinned: false
    };
    if (!announcement) return base;
    return mapAnnouncementToForm(base, announcement);
}

function mapAnnouncementToForm(base, announcement) {
    const images = (announcement.images || [])
        .map(img => (typeof img === 'object' && img.url) ? img.url : img)
        .filter(Boolean);

    return {
        ...base,
        title: announcement.title || "",
        content: announcement.content || "",
        tag: announcement.tagId || null,
        images: images,
        pinned: announcement.pinned || false,
        id: announcement.id
    };
}

export function validateForm(form) {
    if (!form.title?.trim()) return "Title is required";
    if (!form.addAsEvent) return null;
    return validateEventFields(form);
}

function validateEventFields(form) {
    if (!form.start_time) return "Start time is required for event";
    if (form.end_time && form.end_time < form.start_time) {
        return "End time must be after start time";
    }
    return null;
}

export function handleFileSelect(file, onAdd, fileRef) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        onAdd(e.target.result);
        if (fileRef.current) fileRef.current.value = "";
    };
    reader.readAsDataURL(file);
}
