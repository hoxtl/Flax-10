import * as api from '../../../api/societyApi';
import { transformEventData } from './utils/societyHookUtils';

export const useSocietyEvents = (id, setSociety, fetchSociety) => {
    const addEvent = async (data, isSilent = false) => {
        const payload = transformEventData(data);
        const event = await api.createSocietyEvent(id, payload, isSilent);
        setSociety(prev => ({ ...prev, events: [...prev.events, event] }));
        return event;
    };

    const updateEvent = async (eventId, data, isSilent = false) => {
        const payload = transformEventData(data);
        const updated = await api.updateSocietyEvent(id, eventId, payload, isSilent);
        setSociety(prev => ({
            ...prev,
            events: prev.events.map(e => e.id === eventId ? updated : e)
        }));
        return updated;
    };

    const deleteEvent = async (eventId, isSilent = false) => {
        await api.deleteSocietyEvent(id, eventId, isSilent);
        setSociety(prev => ({
            ...prev,
            events: prev.events.filter(e => e.id !== eventId)
        }));
    };

    const addException = async (eventId, date, isSilent = false) => {
        await api.addExceptionDate(id, eventId, date, isSilent);
        await fetchSociety();
    };

    return { addEvent, updateEvent, deleteEvent, addException };
};
