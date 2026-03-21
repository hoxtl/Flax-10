/**
 * Utility functions for managing the AnnouncementModal form state,
 * validation, and image processing.
 */
<<<<<<< HEAD:flax-10-project-files/frontend/src/components/Society/society_detail/tabs/announcement_tab/announcementModalHelpers.js

import { validateEventTimes } from '../../../../calendar/utils/dateValidation';
=======
import { validateEventTimes } from '../../../../Calendar/utils/dateValidation';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration):flax-10-project-files/frontend/src/components/Society/SocietyDetail/tabs/announcementTab/AnnouncementModalHelpers.js

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
    const images = getImageList(announcement);
    return {
        ...base,
        title: announcement.title || "",
        content: announcement.content || "",
        tag: announcement.tag || announcement.tagId || null,
        images,
        pinned: announcement.pinned || false,
        id: announcement.id,
        event_id: announcement.event_id || null,
        addAsEvent: !!announcement.event_id,
    };
}

export function getImageList(ann) {
    const raw = Array.isArray(ann?.images) ? ann.images : (ann?.image ? [ann.image] : []);
<<<<<<< HEAD:flax-10-project-files/frontend/src/components/Society/society_detail/tabs/announcement_tab/announcementModalHelpers.js
    return raw
        .map(img => (img && typeof img === 'object' ? img.url || null : img))
        .filter(Boolean);
=======
    return raw.map(img => (typeof img === 'object' && img.url) ? img.url : img).filter(Boolean);
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration):flax-10-project-files/frontend/src/components/Society/SocietyDetail/tabs/announcementTab/AnnouncementModalHelpers.js
}

export function validateForm(form) {
    if (!form.title?.trim()) return "Title is required";
    if (!form.addAsEvent) return null;
    return validateEventTimes(form);
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
