import { useTags } from '../../../context/TagContext';
import { useNotify } from '../../Notifications/hooks/useNotify';
import { useCalendarEvents } from './useCalendarEvents';
import { useModuleDisenrollment } from '../../Modules/hooks/useModuleDisenrollment';
import { getEventType } from '../utils/eventUtils';
import { unsyncCalendar } from '../../../api/societyApi';

export function useQuickActions(event) {
    const { loadEvents } = useCalendarEvents();
    const { disenrollFromModule } = useModuleDisenrollment();
    const { refreshTags } = useTags();
    const notify = useNotify();

    const type = getEventType(event);

    const handleAction = async (e) => {
        if (e) e.stopPropagation();
        if (type === 'module') {
            disenrollFromModule(event.module, loadEvents);
        } else if (type === 'society') {
            await unsyncCalendar(event.society_id);
            await refreshTags();
            loadEvents();
            notify('Unsync Successful', `Calendar for ${event.society_name || 'this society'} is now unsynced.`);
        }
    };

    if (type === 'module') return { label: 'Leave', onClick: handleAction };
    if (type === 'society') return { label: 'Unsync', onClick: handleAction };
    return null;
}
