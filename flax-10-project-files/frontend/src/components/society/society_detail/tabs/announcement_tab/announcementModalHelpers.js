/**
 * Utility functions for managing the AnnouncementModal form state,
 * validation, and image processing.
 */

import { validateEventTimes } from '../../../../calendar/utils/dateValidation';
import { readImageFile, resetFileInput } from '../../../../../utils/imageFile';

export const MAX_IMAGES = 1;

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
    return raw
        .map(img => (img && typeof img === 'object' ? img.url || null : img))
        .filter(Boolean);
}

export function validateForm(form) {
    if (!form.title?.trim()) return "Title is required";
    if (!form.addAsEvent) return null;
    return validateEventTimes(form);
}

export function handleFileSelect(file, onAdd, fileRef) {
    readImageFile(file, onAdd, () => resetFileInput(fileRef));
}
