/*
 * useSocietyEvents manages event operations tied to a society.
 */
import * as api from '../../../api/societyApi';
import { transformEventData } from './utils/societyHookUtils';

const appendEvent = (setSociety, event) =>
    setSociety(prev => ({ ...prev, events: [...prev.events, event] }));

const replaceEvent = (setSociety, eventId, updated) =>
    setSociety(prev => ({
        ...prev,
        events: prev.events.map(e => e.id === eventId ? updated : e)
    }));

const removeEvent = (setSociety, eventId) =>
    setSociety(prev => ({
        ...prev,
        events: prev.events.filter(e => e.id !== eventId)
    }));

const makeAddEvent = (id, setSociety) =>
    async (data, isSilent = false) => {
        const event = await api.createSocietyEvent(id, transformEventData(data), isSilent);
        appendEvent(setSociety, event);
        return event;
    };

const makeUpdateEvent = (id, setSociety) =>
    async (eventId, data, isSilent = false) => {
        const updated = await api.updateSocietyEvent(id, eventId, transformEventData(data), isSilent);
        replaceEvent(setSociety, eventId, updated);
        return updated;
    };

const makeDeleteEvent = (id, setSociety) =>
    async (eventId, isSilent = false) => {
        await api.deleteSocietyEvent(id, eventId, isSilent);
        removeEvent(setSociety, eventId);
    };

const makeAddException = (id, fetchSociety) =>
    async (eventId, date, isSilent = false) => {
        await api.addExceptionDate(id, eventId, date, isSilent);
        await fetchSociety();
    };

export const useSocietyEvents = (id, setSociety, fetchSociety) => ({
    addEvent: makeAddEvent(id, setSociety),
    updateEvent: makeUpdateEvent(id, setSociety),
    deleteEvent: makeDeleteEvent(id, setSociety),
    addException: makeAddException(id, fetchSociety),
});
