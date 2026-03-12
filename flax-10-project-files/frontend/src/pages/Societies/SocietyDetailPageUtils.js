/**
 * Utility functions for SocietyDetailPage to maintain SRP and line limits.
 */

export function getImageUrls(images) {
    const list = Array.isArray(images) ? images : [];
    return list.map(i => {
        const url = i?.url || i;
        return typeof url === 'string' ? url.trim() : null;
    }).filter(Boolean);
}

export function getAvailablePhotos(society) {
    if (!society) return [];
    const announcements = society.announcements || [];
    const announcementImages = announcements.flatMap(a => {
        const images = a?.images || [];
        return images.map(i => i?.url || i);
    }).map(u => typeof u === 'string' ? u.trim() : null).filter(Boolean);
    const currentCovers = new Set(getImageUrls(society.images));
    return announcementImages.filter(img => !currentCovers.has(img));
}

export function scrollContentToTop() {
    const scrollable = findScrollableParent();
    if (scrollable) scrollable.scrollTop = 0;
    window.scrollTo(0, 0);
}

function findScrollableParent() {
    const containers = document.querySelectorAll('*');
    for (const el of containers) {
        const style = window.getComputedStyle(el);
        const isScrollable = style.overflow === 'auto' || style.overflowY === 'auto';
        if (isScrollable && el.scrollHeight > el.clientHeight) return el;
    }
    return null;
}

export const wrapAddEvent = (addEvent, silent, track) => async (data) => {
    const result = await addEvent(data, silent);
    if (silent) track('Added', data.title);
    return result;
};

export const wrapUpdateEvent = (updateEvent, silent, track) => async (id, data) => {
    const result = await updateEvent(id, data, silent);
    if (silent) track('Updated', data.title);
    return result;
};

export const wrapDeleteEvent = (deleteEvent, silent, track) => async (id, title = 'Event') => {
    await deleteEvent(id, silent);
    if (silent) track('Deleted', title);
};

export const wrapAddAnnouncement = (addAnn, silent, track) => async (data) => {
    const result = await addAnn(data, silent);
    if (silent) track('Added', data.title);
    return result;
};

export const wrapUpdateAnnouncement = (updateAnn, silent, track) => async (id, data) => {
    const result = await updateAnn(id, data, silent);
    if (silent) track('Updated', data.title);
    return result;
};

export const wrapDeleteAnnouncement = (deleteAnn, silent, track) => async (id, title = 'Ann') => {
    await deleteAnn(id, silent);
    if (silent) track('Deleted', title);
};
