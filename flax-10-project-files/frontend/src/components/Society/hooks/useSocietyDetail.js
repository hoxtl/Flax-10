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
        all_day: data.allDay || false, tag: parseTagId(data.tag), recurrence: data.recurrence || "none",
        announcement: data.announcement || null
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
    const [state, setState] = useState({ loading: true, error: null });

    const loadSociety = useCallback(async () => {
        if (!societyId) return;
        try {
            setState({ loading: true, error: null });
            setSociety(await api.fetchSociety(societyId));
        } catch (err) { setState({ loading: false, error: err.message }); }
        finally { setState(s => ({ ...s, loading: false })); }
    }, [societyId]);

    useEffect(() => { loadSociety(); }, [loadSociety]);

    const updateSociety = async (updates) => {
        await api.updateSociety(societyId, updates);
        await loadSociety();
    };
    const updateLocal = (u) => setSociety(p => ({ ...p, ...u }));
    return { society, setSociety, ...state, loadSociety, updateSociety, updateLocalSociety: updateLocal };
}

function useSocietyTags(societyId, setSociety) {
    const updateLocal = (fn) => setSociety(p => ({ ...p, tags: fn(p.tags || []) }));
    const addTag = async (tagData) => {
        const newTag = await api.createSocietyTag(societyId, tagData);
        updateLocal(tags => [...tags, newTag]);
    };
    const updateTag = async (id, data) => {
        const updated = await api.updateSocietyTag(societyId, id, data);
        updateLocal(tags => tags.map(t => t.id === id ? updated : t));
    };
    const deleteTag = async (id) => {
        await api.deleteSocietyTag(societyId, id);
        updateLocal(tags => tags.filter(t => t.id !== id));
    };
    return { addTag, updateTag, deleteTag };
}

function useSocietyEvents(societyId, setSociety, loadSociety) {
    const updateLocal = (fn) => setSociety(prev => ({ ...prev, events: fn(prev.events || []) }));
    
    const addEvent = async (data, silent = false) => {
        const event = await api.createSocietyEvent(societyId, transformEventData(data), silent);
        updateLocal(events => [...events, event]);
        return event;
    };
    const updateEvent = async (eventId, data, silent = false) => {
        const event = await api.updateSocietyEvent(societyId, eventId, transformEventData(data), silent);
        updateLocal(events => events.map(e => e.id === eventId ? event : e));
        return event;
    };
    const deleteEvent = async (id, s = false) => {
        await api.deleteSocietyEvent(societyId, id, s);
        updateLocal(events => events.filter(e => e.id !== id));
    };
    const addException = async (id, date, s = false) => {
        await api.addExceptionDate(societyId, id, date, s);
        await loadSociety();
    };
    return { addEvent, updateEvent, deleteEvent, addException };
}

function useAnnounceHandlers(societyId, setSociety, eventOps) {
    const setEventId = (annId, evId) => {
        setSociety(p => ({ ...p, announcements: p.announcements.map(a => a.id === annId ? { ...a, event_id: evId } : a) }));
    };
    const handleSync = async (data, ann, s) => {
        if (!data.addAsEvent) return ann.event_id && deleteLinked(ann.event_id, ann.id, s);
        const evData = { ...data, description: data.content, tag: data.tag || null, announcement: ann.id };
        try {
            if (ann.event_id) return await eventOps.updateEvent(ann.event_id, evData, s);
            const ev = await eventOps.addEvent(evData, s);
            setEventId(ann.id, ev.id);
        } catch (e) { console.error('Failed to sync event:', e); }
    };
    const deleteLinked = async (evId, annId, s) => {
        try { await eventOps.deleteEvent(evId, s); setEventId(annId, null); }
        catch (e) { console.error('Failed to delete linked event:', e); }
    };
    return { handleSync, deleteLinked };
}

function useAnnounceActions(societyId, setSociety, handleSync) {
    const updateLocal = (fn) => setSociety(p => ({ ...p, announcements: fn(p.announcements || []) }));
    
    const add = async (data, silent = false) => {
        const ann = await api.createAnnouncement(societyId, transformAnnouncementData(data), silent);
        updateLocal(anns => [...anns, ann]);
        if (data.addAsEvent) await handleSync(data, ann, silent);
        return ann;
    };
    const update = async (id, data, silent = false) => {
        const updated = await api.updateAnnouncement(societyId, id, transformAnnouncementData(data), silent);
        updateLocal(anns => anns.map(a => a.id === id ? updated : a));
        await handleSync(data, updated, silent);
        return updated;
    };
    return { add, update };
}

function useSocietyAnnouncements(societyId, society, setSociety, eventOps) {
    const { handleSync } = useAnnounceHandlers(societyId, setSociety, eventOps);
    const { add, update } = useAnnounceActions(societyId, setSociety, handleSync);

    const deleteAnnouncement = async (id, silent = false) => {
        const ann = society?.announcements?.find(a => a.id === id);
        await api.deleteAnnouncement(societyId, id, silent);
        setSociety(p => ({
            ...p, announcements: p.announcements.filter(a => a.id !== id),
            events: ann?.event_id ? p.events.filter(e => e.id !== ann.event_id) : p.events
        }));
    };
    return { addAnnouncement: add, updateAnnouncement: update, deleteAnnouncement };
}

function useSocietyMembers(societyId, setSociety) {
    const [members, setMembers] = useState([]);
    const fetchMembers = useCallback(async () => setMembers(await api.fetchMembers(societyId)), [societyId]);
    const updateRole = async (userId, role) => {
        await api.updateMemberRole(societyId, userId, role);
        setMembers(prev => prev.map(m => m.user === userId ? { ...m, role } : m));
    };
    const remove = async (userId) => {
        await api.leaveSociety(societyId, userId);
        setMembers(prev => prev.filter(m => m.user !== userId));
        setSociety(prev => ({ ...prev, member_count: Math.max(0, prev.member_count - 1) }));
    };
    const addCollab = async (id, role) => {
        const m = await api.addCollaborator(societyId, id, role);
        setMembers(prev => [...prev, m]);
        setSociety(prev => ({ ...prev, member_count: prev.member_count + 1 }));
        return m;
    };
    return { members, fetchMembers, updateMemberRole: updateRole, removeMember: remove, addCollaborator: addCollab };
}

function useSocietyMembership(societyId, setSociety) {
    const { refreshTags } = useTags();
    const confirm = useConfirm();
    const join = async () => {
        try {
            await api.joinSociety(societyId);
            setSociety(p => ({ ...p, is_member: true, member_count: p.member_count + 1 }));
            if (confirm) await promptNotificationSubscription(societyId, setSociety, confirm);
        } catch (err) { console.error('Join failed:', err); }
    };
    const leave = async () => {
        try {
            await api.leaveSociety(societyId, 'me');
            setSociety(p => ({ ...p, is_member: false, is_subscribed: false, member_count: Math.max(0, p.member_count - 1) }));
            await refreshTags();
        } catch (err) { console.error('Leave failed:', err); }
    };
    const request = async () => {
        await api.requestRatification(societyId);
        setSociety(p => ({ ...p, ratification_status: 'pending' }));
    };
    return { joinSociety: join, leaveSociety: leave, requestRatification: request, 
             deleteSociety: id => api.deleteSociety(id), publishChanges: c => api.publishChanges(societyId, c) };
}

async function promptNotificationSubscription(societyId, setSociety, confirm) {
    try {
        const yes = await confirm({
            title: "Enable notifications?",
            message: "Would you like to turn on notifications for this society?",
        });
        if (!yes) return;
        await api.toggleSubscription(societyId, true);
        setSociety(prev => ({ ...prev, is_subscribed: true }));
    } catch (err) { console.error('Failed to prompt subscription:', err); }
}

export function useSocietyDetail(societyId) {
    const core = useSocietyCore(societyId);
    const tags = useSocietyTags(societyId, core.setSociety);
    const events = useSocietyEvents(societyId, core.setSociety, core.loadSociety);
    const announcements = useSocietyAnnouncements(societyId, core.society, core.setSociety, events);
    const members = useSocietyMembers(societyId, core.setSociety);
    const membership = useSocietyMembership(societyId, core.setSociety);

    return {
        society: core.society, ...core, 
        refresh: core.loadSociety, updateSociety: core.updateSociety, updateLocalSociety: core.updateLocalSociety,
        ...tags, ...events, ...announcements, ...members, ...membership
    };
}

export function buildHandlers(data, editMode, tracker) {
    const isSilent = editMode;
    return {
        addAnnouncement: (d) => {
            data.addAnnouncement(d, isSilent);
            if (isSilent) tracker.trackAnnouncement("Added", d.title);
        },
        updateAnnouncement: (id, d) => {
            data.updateAnnouncement(id, d, isSilent);
            if (isSilent) tracker.trackAnnouncement("Updated", d.title);
        },
        deleteAnnouncement: (id) => {
            const title = data.society?.announcements?.find(a => a.id === id)?.title;
            data.deleteAnnouncement(id, isSilent);
            if (isSilent && title) tracker.trackAnnouncement("Deleted", title);
        },
        addEvent: (d) => {
            data.addEvent(d, isSilent);
            if (isSilent) tracker.trackEvent("Added", d.title);
        },
        updateEvent: (id, d) => {
            data.updateEvent(id, d, isSilent);
            if (isSilent) tracker.trackEvent("Updated", d.title);
        },
        deleteEvent: (id, title) => {
            data.deleteEvent(id, isSilent);
            if (isSilent && title) tracker.trackEvent("Deleted", title);
        },
        addException: (id, date) => data.addException(id, date, isSilent),
        onAddTag: data.addTag, onDeleteTag: data.deleteTag, onUpdateTag: data.updateTag,
        society: data.society, updateSociety: data.updateSociety,
        updateLocalSociety: data.updateLocalSociety, publishChanges: data.publishChanges
    };
}
