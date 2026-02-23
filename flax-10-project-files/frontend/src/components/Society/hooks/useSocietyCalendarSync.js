import { useState, useEffect, useCallback } from 'react';
import { getSyncStatus, syncCalendar, unsyncCalendar } from '../../../api/societyApi';

export function useSocietyCalendarSync(societyId) {
    const [isSynced, setIsSynced] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!societyId) return;
        loadSyncStatus(societyId, setIsSynced, setLoading);
    }, [societyId]);

    const toggleSync = useCallback(() => {
        return handleToggle(societyId, isSynced, setIsSynced, setLoading);
    }, [societyId, isSynced]);

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

async function handleToggle(societyId, isSynced, setIsSynced, setLoading) {
    setLoading(true);
    try {
        if (isSynced) {
            await unsyncCalendar(societyId);
            setIsSynced(false);
        } else {
            await syncCalendar(societyId);
            setIsSynced(true);
        }
    } catch (err) {
        console.error('Failed to toggle sync:', err);
    } finally {
        setLoading(false);}}
