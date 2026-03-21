/**
 * useQuickActions - Quick action buttons for module/society events.
 * Provides Leave (module) and Unsync (society) actions for external events.
 */
import { useTags } from '../../../context/TagContext';
import { useNotify } from '../../Notifications/hooks/useNotify';
import { useCalendarEvents } from './useCalendarEvents';
import { useModuleDisenrollment } from '../../Modules/hooks/useModuleDisenrollment';
import { getEventType } from '../utils/eventUtils';
import { unsyncCalendar } from '../../../api/societyApi';

async function handleSocietyAction(event, refreshTags, loadEvents, notify) {
    await unsyncCalendar(event.society_id);
    await refreshTags();
    loadEvents();
    notify('Unsync Successful', `Calendar for ${event.society_name || 'this society'} is now unsynced.`);
}

/** Hook returning quick action config for module/society events. */
export function useQuickActions(event) {
    const { loadEvents } = useCalendarEvents();
    const { refreshTags } = useTags();
    const notify = useNotify();
    const type = getEventType(event);

    const handleAction = async (e) => {
        if (e) e.stopPropagation();
        if (type === 'society') await handleSocietyAction(event, refreshTags, loadEvents, notify);
    };

    if (type === 'society') return { label: 'Unsync', onClick: handleAction };
    return null;
}
