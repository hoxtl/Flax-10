/*
 * useChangeTracker records edit-mode changes made to society content.
 */
import { useState, useCallback } from "react";

const EMPTY_CHANGES = {
    eventsAdded: [],
    eventsUpdated: [],
    eventsDeleted: [],
    announcementsAdded: [],
    announcementsUpdated: [],
    announcementsDeleted: []
};

export function useChangeTracker() {
    const [changes, setChanges] = useState(EMPTY_CHANGES);

    const trackEvent = useCallback((action, title) => {
        setChanges(prev => addToList(prev, `events${action}`, title));
    }, []);

    const trackAnnouncement = useCallback((action, title) => {
        setChanges(prev => addToList(prev, `announcements${action}`, title));
    }, []);

    const getChangeSummary = useCallback(() => buildSummary(changes), [changes]);
    const hasChanges = useCallback(() => checkHasChanges(changes), [changes]);
    const resetChanges = useCallback(() => setChanges(EMPTY_CHANGES), []);

    return { trackEvent, trackAnnouncement, getChangeSummary, hasChanges, resetChanges };
}

function addToList(prev, key, title) {
    return { ...prev, [key]: [...prev[key], title] };
}

function buildSummary(changes) {
    return {
        events_added: changes.eventsAdded,
        events_updated: changes.eventsUpdated,
        events_deleted: changes.eventsDeleted,
        announcements_added: changes.announcementsAdded,
        announcements_updated: changes.announcementsUpdated,
        announcements_deleted: changes.announcementsDeleted
    };
}

function checkHasChanges(changes) {
    return Object.values(changes).some(list => list.length > 0);
}
