import { useNotifications } from '../../../context/NotificationContext';
import { disenrolByModuleId } from '../../../api/moduleApi';
import { createNotify } from '../utils/notifyHelper';

async function disenrollFromModule(moduleId, onSuccess, notify) {
    try {
        await disenrolByModuleId(moduleId);
        notify('Successfully left the module!', 'success');
        if (onSuccess) onSuccess();
    } catch (err) {
        notify(err.message, 'error');
    }
}

export function useModuleDisenrollment() {
    const { addNotification } = useNotifications();
    const notify = createNotify(addNotification);
    return { disenrollFromModule: (moduleId, onSuccess) => disenrollFromModule(moduleId, onSuccess, notify) };
}
