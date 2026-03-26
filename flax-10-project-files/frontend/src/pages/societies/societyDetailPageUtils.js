/**
 * Utility functions for SocietyDetailPage to maintain SRP and line limits.
 */

export function getImageUrls(images) {
    const list = Array.isArray(images) ? images : [];
    return list.map(extractUrl).filter(Boolean);
}

function extractUrl(item) {
    const url = item?.url || item;
    return typeof url === 'string' ? url.trim() : null;
}

<<<<<<< HEAD
export function getAvailablePhotos(society) {
    const coverUrls = new Set(getImageUrls(society?.images));
    const available = [];
    (society?.announcements || []).forEach(ann => {
        getImageUrls(ann?.images).forEach(url => {
            if (!coverUrls.has(url) && !available.includes(url)) {
                available.push(url);
            }
        });
    });
    return available;
}

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
export function scrollContentToTop() {
    const scrollable = findScrollableParent();
    if (scrollable) scrollable.scrollTop = 0;
    window.scrollTo(0, 0);
}

function findScrollableParent() {
    const containers = Array.from(document.querySelectorAll('*'));
    return containers.find(isScrollableElement) || null;
}

function isScrollableElement(el) {
    const style = window.getComputedStyle(el);
    const isScrollable = style.overflow === 'auto' || style.overflowY === 'auto';
    return isScrollable && el.scrollHeight > el.clientHeight;
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
