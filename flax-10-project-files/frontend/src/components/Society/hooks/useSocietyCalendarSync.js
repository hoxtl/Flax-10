import { useState, useEffect } from 'react';
import { getSyncStatus, syncCalendar, unsyncCalendar } from '../../../api/societyApi';
import { useNotify } from '../../Notifications/hooks/useNotify';
import { useTags } from '../../../context/TagContext';
import { useCalendarDispatch } from '../../../context/CalendarContext';

export function useSocietyCalendarSync(societyId, societyName) {
    const [isSynced, setIsSynced] = useState(false);
    const [loading, setLoading] = useState(true);
    const notify = useNotify();
    const { refreshTags } = useTags();
    const calendarDispatch = useCalendarDispatch();

    useEffect(() => {
        if (societyId) loadSyncStatus(societyId, setIsSynced, setLoading);
    }, [societyId]);

    const triggerCalendarReload = () => calendarDispatch?.({ type: 'TRIGGER_RELOAD' });
    const toggleSync = () => handleToggle(
        societyId, isSynced, setIsSynced, setLoading, notify, societyName, refreshTags, triggerCalendarReload
    );

    return { isSynced, loading, toggleSync };
}

async function loadSyncStatus(societyId, setIsSynced, setLoading) {
    try {
        const { is_synced } = await getSyncStatus(societyId);
        setIsSynced(is_synced);
    } catch (err) {
        console.error('Failed to load sync status:', err);
    } finally {
        setLoading(false);
    }
}

async function handleToggle(societyId, isSynced, setIsSynced, setLoading, notify, societyName, refreshTags, reloadCalendar) {
    setLoading(true);
    try {
        if (isSynced) await handleUnsync(societyId, setIsSynced, notify, societyName, refreshTags, reloadCalendar);
        else await handleSync(societyId, setIsSynced, notify, societyName, refreshTags, reloadCalendar);
    } catch (err) { console.error('Failed to toggle sync:', err); }
    finally { setLoading(false); }
}

async function handleUnsync(societyId, setIsSynced, notify, societyName, refreshTags, reloadCalendar) {
    await unsyncCalendar(societyId);
    setIsSynced(false);
    await refreshTags();
    reloadCalendar();
    notify('Unsync Successful', `Calendar for ${societyName} is now unsynced.`);
}

async function handleSync(societyId, setIsSynced, notify, societyName, refreshTags, reloadCalendar) {
    await syncCalendar(societyId);
    setIsSynced(true);
    await refreshTags();
    reloadCalendar();
    notify('Sync Successful', `Calendar for ${societyName} is now synced!`);
}
