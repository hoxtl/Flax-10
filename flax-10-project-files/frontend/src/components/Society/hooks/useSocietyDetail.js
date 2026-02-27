import { useState, useEffect, useCallback } from "react";
import * as api from "../../../api/societyApi";
import { addHourToTime } from "../../Calendar/utils/dateUtils";
import { useNotify } from "../../Notifications/hooks/useNotify";

function transformAnnouncementData(data) {
    const images = (data.images || [])
        .map(img => (typeof img === 'object' && img.url) ? img.url : img)
        .filter(Boolean);

    return {
        title: data.title,
        content: data.content,
        tag: parseTagId(data.tag),
        pinned: data.pinned,
        image_urls: images
    };
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
        title: data.title,
        description: data.description || "",
        location: data.location || "",
        start_time: normalizeIsoTime(data.start_time),
        end_time: normalizeIsoTime(data.end_time),
        all_day: data.all_day || false,
        tag: parseTagId(data.tag),
        recurrence: getRecurrence(data),
        recurrence_end_date: getRecurrenceEndDate(data),
        announcement: data.announcement || null
    };
}

function transformLegacyEventData(data) {
    const time = data.time || "12:00";
    const endTime = data.endTime || addHourToTime(time);
    return {
        title: data.title,
        description: data.description || "",
        location: data.location || "",
        start_time: `${data.date}T${time}:00`,
        end_time: `${data.date}T${endTime}:00`,
        all_day: data.allDay || false,
        tag: parseTagId(data.tag),
        recurrence: data.recurrence || "none"
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
    if (typeof rec === 'object' && rec?.end_date) return rec.end_date;
    return data.recurrence_end_date || null;
}

export function useSocietyDetail(societyId) {
    const [society, setSociety] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const notify = useNotify();

    const loadSociety = useCallback(async () => {
        if (!societyId) return;
        try {
            setLoading(true);
            const data = await api.fetchSociety(societyId);
            setSociety(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [societyId]);

    useEffect(() => { loadSociety(); }, [loadSociety]);

    const updateSociety = async (updates) => {
        const updated = await api.updateSociety(societyId, updates);
        setSociety(prev => ({ ...prev, ...updated }));
        await loadSociety();
    };

    const addTag = async (tagData) => {
        const newTag = await api.createSocietyTag(societyId, tagData);
        setSociety(prev => ({ ...prev, tags: [...(prev.tags || []), newTag] }));
    };

    const updateTag = async (tagId, data) => {
        const updated = await api.updateSocietyTag(societyId, tagId, data);
        setSociety(prev => ({
            ...prev,
            tags: prev.tags.map(t => t.id === tagId ? updated : t)
        }));
    };

    const deleteTag = async (tagId) => {
        await api.deleteSocietyTag(societyId, tagId);
        setSociety(prev => ({ ...prev, tags: prev.tags.filter(t => t.id !== tagId) }));
    };

    const addAnnouncement = async (data, silent = false) => {
        const apiData = transformAnnouncementData(data);
        const announcement = await api.createAnnouncement(societyId, apiData, silent);
        setSociety(prev => ({ ...prev, announcements: [...(prev.announcements || []), announcement] }));
        if (data.addAsEvent) await addAnnouncementEvent(data, announcement, silent);
        return announcement;
    };

    const addAnnouncementEvent = async (data, announcement, silent = false) => {
        try {
            const eventData = buildAnnouncementEventData(data, announcement);
            await createLinkedEvent(eventData, announcement.id, silent);
        } catch (error) { console.error('Failed to add event for announcement:', error); }
    };

    const addEvent = async (data, silent = false) => {
        const apiData = transformEventData(data);
        const event = await api.createSocietyEvent(societyId, apiData, silent);
        setSociety(prev => ({ ...prev, events: [...(prev.events || []), event] }));
        return event;
    };

    const updateEvent = async (eventId, data, silent = false) => {
        const apiData = transformEventData(data);
        const event = await api.updateSocietyEvent(societyId, eventId, apiData, silent);
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

    const updateAnnouncement = async (announcementId, data, silent = false) => {
        const apiData = transformAnnouncementData(data);
        const updated = await api.updateAnnouncement(societyId, announcementId, apiData, silent);
        setSociety(prev => ({ ...prev, announcements: prev.announcements.map(a => a.id === announcementId ? updated : a) }));
        await syncAnnouncementEvent(data, updated, silent);
        return updated;
    };

    const syncAnnouncementEvent = async (data, announcement, silent = false) => {
        const eventId = announcement.event_id || data.event_id;
        if (!data.addAsEvent && eventId) return deleteLinkedEvent(eventId, announcement.id, silent);
        if (data.addAsEvent) return upsertLinkedEvent(data, announcement, eventId, silent);
    };

    const deleteLinkedEvent = async (eventId, announcementId, silent = false) => {
        try {
            await deleteEvent(eventId, silent);
            setAnnouncementEventId(announcementId, null);
        } catch (error) { console.error('Failed to delete linked event:', error); }
    };

    const upsertLinkedEvent = async (data, announcement, eventId, silent = false) => {
        const eventData = buildAnnouncementEventData(data, announcement);
        try {
            if (eventId) await updateEvent(eventId, eventData, silent);
            else await createLinkedEvent(eventData, announcement.id, silent);
        } catch (error) { console.error('Failed to sync event for announcement:', error); }
    };

    const createLinkedEvent = async (eventData, announcementId, silent = false) => {
        const event = await addEvent(eventData, silent);
        setAnnouncementEventId(announcementId, event.id);
    };

    const setAnnouncementEventId = (announcementId, eventId) => {
        setSociety(prev => ({
            ...prev,
            announcements: prev.announcements.map(a => a.id === announcementId ? { ...a, event_id: eventId } : a)
        }));
    };

    const buildAnnouncementEventData = (data, announcement) => ({
        ...data, description: data.content, tag: data.tag || null, announcement: announcement.id
    });

    const deleteAnnouncement = async (announcementId, silent = false) => {
        const announcement = society?.announcements?.find(a => a.id === announcementId);
        const linkedEventId = announcement?.event_id;
        await api.deleteAnnouncement(societyId, announcementId, silent);
        setSociety(prev => removeAnnouncementAndEvent(prev, announcementId, linkedEventId));
    };

    const publishChanges = async (changes = {}) => {
        await api.publishChanges(societyId, changes);
    };

    const removeAnnouncementAndEvent = (prev, announcementId, eventId) => ({
        ...prev,
        announcements: prev.announcements.filter(a => a.id !== announcementId),
        events: eventId ? prev.events.filter(e => e.id !== eventId) : prev.events
    });

    const joinSociety = async () => {
        await api.joinSociety(societyId);
        setSociety(prev => ({ ...prev, is_member: true, member_count: prev.member_count + 1 }));
    };

    const leaveSociety = async () => {
        await api.leaveSociety(societyId, 'me');
        setSociety(prev => ({ ...prev, is_member: false, member_count: Math.max(0, prev.member_count - 1) }));
        notify('Unsync Successful', `Calendar for ${society.name} is now unsynced.`);
    };

    const deleteSociety = async () => {
        await api.deleteSociety(societyId);
    };

    const [members, setMembers] = useState([]);

    const fetchMembers = useCallback(async () => {
        const data = await api.fetchMembers(societyId);
        setMembers(data);
    }, [societyId]);

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

    const requestRatification = async () => {
        await api.requestRatification(societyId);
        setSociety(prev => ({ ...prev, ratification_status: 'pending' }));
    };

    return {
        society, loading, error, refresh: loadSociety, updateSociety,
        addTag, updateTag, deleteTag,
        addAnnouncement, updateAnnouncement, deleteAnnouncement,
        addEvent, updateEvent, deleteEvent, addException,
        joinSociety, leaveSociety, deleteSociety, publishChanges,
        members, fetchMembers, updateMemberRole, removeMember, addCollaborator,
        requestRatification
    };
}
