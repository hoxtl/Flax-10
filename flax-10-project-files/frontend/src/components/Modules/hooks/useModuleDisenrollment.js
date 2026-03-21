/* Hook for handling module disenrolment with notifications. */
import { useNotifications } from '../../../context/NotificationContext';
import { disenrolByModuleId } from '../../../api/moduleApi';
import { createNotify } from '../utils/notifyHelper';

function handleSuccess(onSuccess, notify) {
    notify('Successfully left the module!', 'success');
    if (onSuccess) onSuccess();
}

function disenrollFromModule(moduleId, onSuccess, notify) {
    disenrolByModuleId(moduleId)
        .then(() => handleSuccess(onSuccess, notify))
        .catch(err => notify(err.message, 'error'));
}

export function useModuleDisenrollment() {
    const { addNotification } = useNotifications();
    const notify = createNotify(addNotification);
    return { disenrollFromModule: (moduleId, onSuccess) => disenrollFromModule(moduleId, onSuccess, notify) };
}
