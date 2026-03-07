import { useState, useEffect, useCallback } from "react";
import * as api from "../../../api/societyApi";
import { addHourToTime } from "../../Calendar/utils/dateUtils";
import { useTags } from "../../../context/TagContext";
import { useConfirm } from "../../../context/ConfirmContext";

function transformAnnouncementData(data) {
    const images = (data.images || []).map(img => (typeof img === 'object' && img.url) ? img.url : img).filter(Boolean);
    return { title: data.title, content: data.content, tag: parseTagId(data.tag), pinned: data.pinned, image_urls: images };
}

function parseTagId(tag) {
    if (tag === null || tag === undefined || tag === '') return null;
    const parsed = parseInt(tag, 10);
    return isNaN(parsed) ? null : parsed;
}

function transformEventData(data) {
    if (data.start_time && data.end_time) return transformIsoEventData(data);
    return transformLegacyEventData(data);
}

function transformIsoEventData(data) {
    return {
        title: data.title, description: data.description || "", location: data.location || "",
        start_time: normalizeIsoTime(data.start_time), end_time: normalizeIsoTime(data.end_time),
        all_day: data.all_day || false, tag: parseTagId(data.tag),
        recurrence: getRecurrence(data), recurrence_end_date: getRecurrenceEndDate(data), announcement: data.announcement || null
    };
}

function transformLegacyEventData(data) {
    const time = data.time || "12:00";
    const endTime = data.endTime || addHourToTime(time);
    return {
        title: data.title, description: data.description || "", location: data.location || "",
        start_time: `${data.date}T${time}:00`, end_time: `${data.date}T${endTime}:00`,
        all_day: data.allDay || false, tag: parseTagId(data.tag), recurrence: data.recurrence || "none"
    };
}

function normalizeIsoTime(datetime) {
    const str = typeof datetime === 'string' ? datetime : new Date(datetime).toISOString();
    return str.includes('T') && str.length === 16 ? `${str}:00` : str;
}

function getRecurrence(data) {
    const rec = data.recurrence;
    if (!rec || rec === 'none' || rec.frequency === 'none') return 'none';
    return typeof rec === 'string' ? rec : rec.frequency;
}

function getRecurrenceEndDate(data) {
    const rec = data.recurrence;
    return (typeof rec === 'object' && rec?.end_date) ? rec.end_date : (data.recurrence_end_date || null);
}

function useSocietyCore(societyId) {
    const [society, setSociety] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadSociety = useCallback(async () => {
        if (!societyId) return;
        try { setLoading(true); setSociety(await api.fetchSociety(societyId)); }
        catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, [societyId]);

    useEffect(() => { loadSociety(); }, [loadSociety]);

    const updateSociety = async (updates) => {
        await api.updateSociety(societyId, updates);
        await loadSociety();
    };
    const updateLocalSociety = (updates) => setSociety(prev => ({ ...prev, ...updates }));
    return { society, setSociety, loading, error, loadSociety, updateSociety, updateLocalSociety };
}

function useSocietyTags(societyId, setSociety) {
    const addTag = async (tagData) => {
        const newTag = await api.createSocietyTag(societyId, tagData);
        setSociety(prev => ({ ...prev, tags: [...(prev.tags || []), newTag] }));
    };
    const updateTag = async (tagId, data) => {
        const updated = await api.updateSocietyTag(societyId, tagId, data);
        setSociety(prev => ({ ...prev, tags: prev.tags.map(t => t.id === tagId ? updated : t) }));
    };
    const deleteTag = async (tagId) => {
        await api.deleteSocietyTag(societyId, tagId);
        setSociety(prev => ({ ...prev, tags: prev.tags.filter(t => t.id !== tagId) }));
    };
    return { addTag, updateTag, deleteTag };
}

function useSocietyEvents(societyId, setSociety, loadSociety) {
    const addEvent = async (data, silent = false) => {
        const event = await api.createSocietyEvent(societyId, transformEventData(data), silent);
        setSociety(prev => ({ ...prev, events: [...(prev.events || []), event] }));
        return event;
    };
    const updateEvent = async (eventId, data, silent = false) => {
        const event = await api.updateSocietyEvent(societyId, eventId, transformEventData(data), silent);
        setSociety(prev => ({ ...prev, events: prev.events.map(e => e.id === eventId ? event : e) }));
        return event;
    };
    const deleteEvent = async (eventId, silent = false) => {
        await api.deleteSocietyEvent(societyId, eventId, silent);
        setSociety(prev => ({ ...prev, events: prev.events.filter(e => e.id !== eventId) }));
    };
    const addException = async (eventId, date, silent = false) => {
        await api.addExceptionDate(societyId, eventId, date, silent);
        await loadSociety();
    };
    return { addEvent, updateEvent, deleteEvent, addException };
}

function useSocietyAnnouncements(societyId, society, setSociety, eventOps) {
    const setAnnouncementEventId = (announcementId, eventId) => {
        setSociety(prev => ({ ...prev, announcements: prev.announcements.map(a => a.id === announcementId ? { ...a, event_id: eventId } : a) }));
    };
    const buildEventData = (data, announcement) => ({ ...data, description: data.content, tag: data.tag || null, announcement: announcement.id });

    const addAnnouncement = async (data, silent = false) => {
        const apiData = transformAnnouncementData(data);
        const announcement = await api.createAnnouncement(societyId, apiData, silent);
        setSociety(prev => ({ ...prev, announcements: [...(prev.announcements || []), announcement] }));
        if (data.addAsEvent) await createLinkedEvent(buildEventData(data, announcement), announcement.id, silent);
        return announcement;
    };

    const createLinkedEvent = async (eventData, announcementId, silent) => {
        try { const event = await eventOps.addEvent(eventData, silent); setAnnouncementEventId(announcementId, event.id); }
        catch (e) { console.error('Failed to add event for announcement:', e); }
    };

    const updateAnnouncement = async (announcementId, data, silent = false) => {
        const updated = await api.updateAnnouncement(societyId, announcementId, transformAnnouncementData(data), silent);
        setSociety(prev => ({ ...prev, announcements: prev.announcements.map(a => a.id === announcementId ? updated : a) }));
        await syncEvent(data, updated, silent);
        return updated;
    };

    const syncEvent = async (data, announcement, silent) => {
        const eventId = announcement.event_id || data.event_id;
        if (!data.addAsEvent && eventId) return deleteLinkedEvent(eventId, announcement.id, silent);
        if (data.addAsEvent) return upsertLinkedEvent(data, announcement, eventId, silent);
    };

    const deleteLinkedEvent = async (eventId, announcementId, silent) => {
        try { await eventOps.deleteEvent(eventId, silent); setAnnouncementEventId(announcementId, null); }
        catch (e) { console.error('Failed to delete linked event:', e); }
    };

    const upsertLinkedEvent = async (data, announcement, eventId, silent) => {
        const eventData = buildEventData(data, announcement);
        try { if (eventId) await eventOps.updateEvent(eventId, eventData, silent); else await createLinkedEvent(eventData, announcement.id, silent); }
        catch (e) { console.error('Failed to sync event for announcement:', e); }
    };

    const deleteAnnouncement = async (announcementId, silent = false) => {
        const announcement = society?.announcements?.find(a => a.id === announcementId);
        const linkedEventId = announcement?.event_id;
        await api.deleteAnnouncement(societyId, announcementId, silent);
        setSociety(prev => ({
            ...prev, announcements: prev.announcements.filter(a => a.id !== announcementId),
            events: linkedEventId ? prev.events.filter(e => e.id !== linkedEventId) : prev.events
        }));
    };

    return { addAnnouncement, updateAnnouncement, deleteAnnouncement };
}

function useSocietyMembers(societyId, setSociety) {
    const [members, setMembers] = useState([]);
    const fetchMembers = useCallback(async () => setMembers(await api.fetchMembers(societyId)), [societyId]);
    const updateMemberRole = async (userId, role) => {
        await api.updateMemberRole(societyId, userId, role);
        setMembers(prev => prev.map(m => m.user === userId ? { ...m, role } : m));
    };
    const removeMember = async (userId) => {
        await api.leaveSociety(societyId, userId);
        setMembers(prev => prev.filter(m => m.user !== userId));
        setSociety(prev => ({ ...prev, member_count: Math.max(0, prev.member_count - 1) }));
    };
    const addCollaborator = async (identifier, role) => {
        const member = await api.addCollaborator(societyId, identifier, role);
        setMembers(prev => [...prev, member]);
        setSociety(prev => ({ ...prev, member_count: prev.member_count + 1 }));
        return member;
    };
    return { members, fetchMembers, updateMemberRole, removeMember, addCollaborator };
}

function useSocietyMembership(societyId, setSociety) {
    const { refreshTags } = useTags();
    const confirm = useConfirm();
    const joinSociety = async () => {
        await api.joinSociety(societyId);
        setSociety(prev => ({ ...prev, is_member: true, member_count: prev.member_count + 1 }));
        await promptNotificationSubscription(societyId, setSociety, confirm);
    };
    const leaveSociety = async () => {
        await api.leaveSociety(societyId, 'me');
        setSociety(prev => ({ ...prev, is_member: false, is_subscribed: false, member_count: Math.max(0, prev.member_count - 1) }));
        await refreshTags();
    };
    const deleteSociety = async () => await api.deleteSociety(societyId);
    const requestRatification = async () => {
        await api.requestRatification(societyId);
        setSociety(prev => ({ ...prev, ratification_status: 'pending' }));
    };
    const publishChanges = async (changes = {}) => await api.publishChanges(societyId, changes);
    return { joinSociety, leaveSociety, deleteSociety, requestRatification, publishChanges };
}

async function promptNotificationSubscription(societyId, setSociety, confirm) {
    const yes = await confirm({
        title: "Enable notifications?",
        message: "Would you like to turn on notifications for this society?",
    });
    if (!yes) return;
    await api.toggleSubscription(societyId, true);
    setSociety(prev => ({ ...prev, is_subscribed: true }));
}

export function useSocietyDetail(societyId) {
    const core = useSocietyCore(societyId);
    const tags = useSocietyTags(societyId, core.setSociety);
    const events = useSocietyEvents(societyId, core.setSociety, core.loadSociety);
    const announcements = useSocietyAnnouncements(societyId, core.society, core.setSociety, events);
    const members = useSocietyMembers(societyId, core.setSociety);
    const membership = useSocietyMembership(societyId, core.setSociety);

    return {
        society: core.society, loading: core.loading, error: core.error,
        refresh: core.loadSociety, updateSociety: core.updateSociety, updateLocalSociety: core.updateLocalSociety,
        ...tags, ...events, ...announcements, ...members, ...membership
    };
}
