/*
 * useSocietyCalendarSync keeps society calendar sync state in step with the API.
 */

import { useState, useEffect } from 'react';
import { getSyncStatus, syncCalendar, unsyncCalendar } from '../../../api/societyApi';
import { useTags } from '../../../context/TagContext';
import { useCalendarDispatch } from '../../../context/CalendarContext';
import { useToast } from '../../../context/ToastContext';

export function useSocietyCalendarSync(societyId, societyName) {
    const [isSynced, setIsSynced] = useState(false);
    const [loading, setLoading] = useState(true);
    const showToast = useToast();
    const { refreshTags } = useTags();
    const calendarDispatch = useCalendarDispatch();

    useEffect(() => {
        if (societyId) loadSyncStatus(societyId, setIsSynced, setLoading);
    }, [societyId]);

    const triggerCalendarReload = () => calendarDispatch?.({ type: 'TRIGGER_RELOAD' });
    const toggleSync = () => handleToggle(
        societyId, isSynced, setIsSynced, setLoading, showToast, societyName, refreshTags, triggerCalendarReload
    );

    return { isSynced, loading, toggleSync };
}

async function loadSyncStatus(societyId, setIsSynced, setLoading) {
    try {
        const { is_synced } = await getSyncStatus(societyId);
        setIsSynced(is_synced);
    } catch (err) {
    } finally {
        setLoading(false);
    }
}

async function handleToggle(societyId, isSynced, setIsSynced, setLoading, showToast, societyName, refreshTags, reloadCalendar) {
    setLoading(true);
    try {
        const action = isSynced ? handleUnsync : handleSync;
        await action(societyId, setIsSynced, showToast, societyName, refreshTags, reloadCalendar);
    } catch (err) {
    }
    finally { setLoading(false); }
}

async function handleUnsync(societyId, setIsSynced, showToast, societyName, refreshTags, reloadCalendar) {
    await unsyncCalendar(societyId);
    setIsSynced(false);
    await refreshTags();
    reloadCalendar();
    showToast?.(`Calendar for ${societyName} is now unsynced.`, { title: 'Unsync Successful', variant: 'info' });
}

async function handleSync(societyId, setIsSynced, showToast, societyName, refreshTags, reloadCalendar) {
    await syncCalendar(societyId);
    setIsSynced(true);
    await refreshTags();
    reloadCalendar();
    showToast?.(`Calendar for ${societyName} is now synced!`, { title: 'Sync Successful', variant: 'success' });
}
