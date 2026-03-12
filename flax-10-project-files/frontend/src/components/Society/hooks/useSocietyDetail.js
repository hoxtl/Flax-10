import { useSocietyCore } from './useSocietyCore';
import { useSocietyTags } from './useSocietyTags';
import { useSocietyEvents } from './useSocietyEvents';
import { useSocietyAnnouncements } from './useSocietyAnnouncements';
import { useSocietyMembers } from './useSocietyMembers';
import { useSocietyMembership } from './useSocietyMembership';

export const buildHandlers = (data, editMode, tracker) => {
    const { addAnnouncement, updateAnnouncement, deleteAnnouncement, addEvent, updateEvent, deleteEvent, addException } = data;
    const isSilent = editMode;
    const wrapAn = (action, fn, titleFn) => (id, d) => {
        const title = titleFn ? titleFn(id) : d.title;
        tracker?.trackAnnouncement(action, title);
        return fn(id, d, isSilent);
    };
    const wrapEv = (action, fn, titleFn) => (id, d) => {
        const title = titleFn ? titleFn(id, d) : d.title;
        tracker?.trackEvent(action, title);
        return fn(id, d, isSilent);
    };
    
    return {
        ...data,
        addAnnouncement: (d) => { tracker?.trackAnnouncement('Added', d.title); return addAnnouncement(d, isSilent); },
        updateAnnouncement: wrapAn('Updated', updateAnnouncement),
        deleteAnnouncement: (id) => wrapAn('Deleted', deleteAnnouncement, (i) => data.society?.announcements?.find(a => a.id === i)?.title)(id),
        addEvent: (d) => { tracker?.trackEvent('Added', d.title); return addEvent(d, isSilent); },
        updateEvent: wrapEv('Updated', updateEvent),
        deleteEvent: (id, title) => wrapEv('Deleted', deleteEvent, () => title)(id),
        addException: (id, d) => addException(id, d, isSilent),
        onAddTag: data.addTag, onDeleteTag: data.deleteTag, onUpdateTag: data.updateTag
    };
};

export const useSocietyDetail = (id) => {
    const core = useSocietyCore(id);
    const tags = useSocietyTags(id, core.society, core.setSociety);
    const events = useSocietyEvents(id, core.setSociety, core.fetchSociety);
    const announcements = useSocietyAnnouncements(id, core.setSociety, events);
    const members = useSocietyMembers(id, core.setSociety);
    const membership = useSocietyMembership(id, core.setSociety);

    return { 
        ...core, ...tags, ...events, ...announcements, 
        ...members, ...membership 
    };
};
