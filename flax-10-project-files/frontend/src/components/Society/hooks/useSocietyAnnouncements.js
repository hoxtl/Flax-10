/*
 * useSocietyAnnouncements manages announcement CRUD for a society.
 */
import * as api from '../../../api/societyApi';

/** Helper to update local society state when an announcement's linked event changes. */
const updateAnnEventState = (setSociety, annId, eventId) => {
    setSociety(prev => ({
        ...prev,
        announcements: prev.announcements.map(a => a.id === annId ? { ...a, event_id: eventId } : a)
    }));
};

/** Handles the removal of a linked event when an announcement is unsynced. */
const handleRemoval = async (ann, eventOps, onIdUpdate) => {
    await deleteLinkedEvent(ann, eventOps);
    onIdUpdate(ann.id, null);
};

/** Logic for creating or updating a linked event. */
const handleLinkedUpdate = async (ann, evData, eventOps, onIdUpdate) => {
    if (ann.event_id) return await eventOps.updateEvent(ann.event_id, evData, true);
    const ev = await eventOps.addEvent(evData, true);
    onIdUpdate(ann.id, ev.id);
};

/** Coordinates syncing an announcement with the events system. */
const syncAnnouncement = async (ann, data, eventOps, onIdUpdate) => {
    if (!data.addAsEvent) return handleRemoval(ann, eventOps, onIdUpdate);
    const evData = { ...data, description: data.content, tag: data.tag || null, announcement: ann.id };
    try {
        await handleLinkedUpdate(ann, evData, eventOps, onIdUpdate);
    } catch {}
};

/** Hook for managing society announcements and their lifecycle. */
const appendAnnouncement = (setSociety, ann) =>
    setSociety(prev => ({ ...prev, announcements: [...prev.announcements, ann] }));

const replaceAnnouncement = (setSociety, annId, updated) =>
    setSociety(prev => ({
        ...prev,
        announcements: prev.announcements.map(a => a.id === annId ? updated : a)
    }));

const removeAnnouncement = (setSociety, annId) =>
    setSociety(prev => ({
        ...prev,
        announcements: prev.announcements.filter(a => a.id !== annId)
    }));

const fetchAnnouncementById = async (societyId, annId) => {
    const society = await api.fetchSociety(societyId);
    return society.announcements.find(a => a.id === annId);
};

const deleteLinkedEvent = async (ann, eventOps) => {
    if (!ann?.event_id) return;
    try {
        await eventOps.deleteEvent(ann.event_id, true);
    } catch {}
};

const makeAddAnnouncement = (id, setSociety, eventOps, onIdUpdate) =>
    async (data, isSilent = false) => {
        const ann = await api.createAnnouncement(id, data, isSilent);
        appendAnnouncement(setSociety, ann);
        await syncAnnouncement(ann, data, eventOps, onIdUpdate);
        return ann;
    };

const makeUpdateAnnouncement = (id, setSociety, eventOps, onIdUpdate) =>
    async (annId, data, isSilent = false) => {
        const updated = await api.updateAnnouncement(id, annId, data, isSilent);
        replaceAnnouncement(setSociety, annId, updated);
        await syncAnnouncement(updated, data, eventOps, onIdUpdate);
        return updated;
    };

const makeDeleteAnnouncement = (id, setSociety, eventOps) =>
    async (annId, isSilent = false) => {
        const ann = await fetchAnnouncementById(id, annId);
        await deleteLinkedEvent(ann, eventOps);
        await api.deleteAnnouncement(id, annId, isSilent);
        removeAnnouncement(setSociety, annId);
    };

export const useSocietyAnnouncements = (id, setSociety, eventOps) => {
    const onIdUpdate = (annId, evId) => updateAnnEventState(setSociety, annId, evId);
    return {
        addAnnouncement: makeAddAnnouncement(id, setSociety, eventOps, onIdUpdate),
        updateAnnouncement: makeUpdateAnnouncement(id, setSociety, eventOps, onIdUpdate),
        deleteAnnouncement: makeDeleteAnnouncement(id, setSociety, eventOps),
    };
};
