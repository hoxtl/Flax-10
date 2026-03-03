import { useNotifications } from '../../../context/NotificationContext';
import { disenrolByModuleId } from '../../../api/moduleApi';
import { createNotify } from '../utils/notifyHelper';

export function useModuleDisenrollment() {
    const { addNotification } = useNotifications();
    const notify = createNotify(addNotification);

    const disenrollFromModule = async (moduleId, onSuccess) => {
        try {
            await disenrolByModuleId(moduleId);
            notify('Successfully left the module!', 'success');
            if (onSuccess) onSuccess();
        } catch (err) {
            notify(err.message, 'error');
        }
    };

    return { disenrollFromModule };
}
