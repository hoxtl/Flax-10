import { useSocietyCore } from './useSocietyCore';
import { useSocietyTags } from './useSocietyTags';
import { useSocietyEvents } from './useSocietyEvents';
import { useSocietyAnnouncements } from './useSocietyAnnouncements';
import { useSocietyMembers } from './useSocietyMembers';
import { useSocietyMembership } from './useSocietyMembership';

const getAnnouncementTitle = (data, id) =>
    data.society?.announcements?.find(a => a.id === id)?.title;

const wrapAnnouncement = (action, fn, tracker, isSilent, titleFn) =>
    (id, d) => {
        tracker?.trackAnnouncement(action, titleFn ? titleFn(id) : d.title);
        return fn(id, d, isSilent);
    };

const wrapEvent = (action, fn, tracker, isSilent, titleFn) =>
    (id, d) => {
        tracker?.trackEvent(action, titleFn ? titleFn(id, d) : d.title);
        return fn(id, d, isSilent);
    };

const buildAnnouncementHandlers = (data, tracker, isSilent) => ({
    addAnnouncement: (d) => { tracker?.trackAnnouncement('Added', d.title); return data.addAnnouncement(d, isSilent); },
    updateAnnouncement: wrapAnnouncement('Updated', data.updateAnnouncement, tracker, isSilent),
    deleteAnnouncement: wrapAnnouncement('Deleted', data.deleteAnnouncement, tracker, isSilent, (id) => getAnnouncementTitle(data, id)),
});

const buildEventHandlers = (data, tracker, isSilent) => ({
    addEvent: (d) => { tracker?.trackEvent('Added', d.title); return data.addEvent(d, isSilent); },
    updateEvent: wrapEvent('Updated', data.updateEvent, tracker, isSilent),
    deleteEvent: (id, title) => wrapEvent('Deleted', data.deleteEvent, tracker, isSilent, () => title)(id),
    addException: (id, d) => data.addException(id, d, isSilent),
});

const buildTagHandlers = (data) => ({
    onAddTag: data.addTag,
    onDeleteTag: data.deleteTag,
    onUpdateTag: data.updateTag,
});

export const buildHandlers = (data, editMode, tracker) => ({
    ...data,
    ...buildAnnouncementHandlers(data, tracker, editMode),
    ...buildEventHandlers(data, tracker, editMode),
    ...buildTagHandlers(data),
});

export const useSocietyDetail = (id, onMembershipChange) => {
    const core = useSocietyCore(id);
    const tags = useSocietyTags(id, core.society, core.setSociety);
    const events = useSocietyEvents(id, core.setSociety, core.fetchSociety);
    const announcements = useSocietyAnnouncements(id, core.setSociety, events);
    const members = useSocietyMembers(id, core.setSociety);
    const membership = useSocietyMembership(id, core.setSociety, onMembershipChange);

    return {
        ...core, ...tags, ...events, ...announcements,
        ...members, ...membership
    };
};
