import * as api from '../../../api/societyApi';

export const useSocietyAnnouncements = (id, setSociety, eventOps) => {
    const setEventId = (annId, eventId) => {
        setSociety(prev => ({
            ...prev,
            announcements: prev.announcements.map(a => a.id === annId ? { ...a, event_id: eventId } : a)
        }));
    };

    const deleteLinked = async (eventId, annId) => {
        try {
            await eventOps.deleteEvent(eventId, true);
            setEventId(annId, null);
        } catch (e) { console.error('Failed to delete linked event:', e); }
    };

    const handleSync = async (ann, data) => {
        if (!data.addAsEvent) return ann.event_id && deleteLinked(ann.event_id, ann.id);
        const evData = { ...data, description: data.content, tag: data.tag || null, announcement: ann.id };
        try {
            if (ann.event_id) return await eventOps.updateEvent(ann.event_id, evData, true);
            const ev = await eventOps.addEvent(evData, true);
            setEventId(ann.id, ev.id);
        } catch (e) { console.error('Failed to sync event:', e); }
    };

    const addAnnouncement = async (data, isSilent = false) => {
        const ann = await api.createAnnouncement(id, data, isSilent);
        setSociety(prev => ({ ...prev, announcements: [...prev.announcements, ann] }));
        await handleSync(ann, data);
        return ann;
    };

    const updateAnnouncement = async (annId, data, isSilent = false) => {
        const updated = await api.updateAnnouncement(id, annId, data, isSilent);
        setSociety(prev => ({
            ...prev,
            announcements: prev.announcements.map(a => a.id === annId ? updated : a)
        }));
        await handleSync(updated, data);
        return updated;
    };

    const deleteAnnouncement = async (annId, isSilent = false) => {
        const ann = (await api.fetchSociety(id)).announcements.find(a => a.id === annId);
        if (ann?.event_id) await deleteLinked(ann.event_id, annId);
        await api.deleteAnnouncement(id, annId, isSilent);
        setSociety(prev => ({
            ...prev,
            announcements: prev.announcements.filter(a => a.id !== annId)
        }));
    };

    return { addAnnouncement, updateAnnouncement, deleteAnnouncement };
};
