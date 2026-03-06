import { useState, useEffect, useCallback } from 'react';
import { getSyncStatus, syncCalendar, unsyncCalendar } from '../../../api/societyApi';
import { useNotify } from '../../Notifications/hooks/useNotify';
import { useTags } from '../../../context/TagContext';

export function useSocietyCalendarSync(societyId, societyName) {
    const [isSynced, setIsSynced] = useState(false);
    const [loading, setLoading] = useState(true);
    const notify = useNotify();
    const { refreshTags } = useTags();
    useEffect(() => {
        if (!societyId) return;
        loadSyncStatus(societyId, setIsSynced, setLoading);
    }, [societyId]);
    const toggleSync = useCallback(() => {
        return handleToggle(societyId, isSynced, setIsSynced, setLoading, notify, societyName, refreshTags);
    }, [societyId, isSynced, notify, societyName, refreshTags]);
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

async function handleToggle(societyId, isSynced, setIsSynced, setLoading, notify, societyName, refreshTags) {
    setLoading(true);
    try {
        if (isSynced) await handleUnsync(societyId, setIsSynced, notify, societyName, refreshTags);
        else await handleSync(societyId, setIsSynced, notify, societyName, refreshTags);
    } catch (err) {
        console.error('Failed to toggle sync:', err);
    } finally {
        setLoading(false);
    }
}

async function handleUnsync(societyId, setIsSynced, notify, societyName, refreshTags) {
    await unsyncCalendar(societyId);
    setIsSynced(false);
    await refreshTags();
    notify('Unsync Successful', `Calendar for ${societyName} is now unsynced.`);
}

async function handleSync(societyId, setIsSynced, notify, societyName, refreshTags) {
    await syncCalendar(societyId);
    setIsSynced(true);
    await refreshTags();
    notify('Sync Successful', `Calendar for ${societyName} is now synced!`);
}
