import * as api from '../../../api/societyApi';
import { useTags } from '../../../context/TagContext';
import { useConfirm } from '../../../context/ConfirmContext';

export const useSocietyMembership = (id, setSociety) => {
    const { refreshTags } = useTags();
    const confirm = useConfirm();

    const promptNotificationSubscription = async () => {
        try {
            const result = await confirm({
                title: 'Turn on notifications?',
                message: 'Stay updated with announcements and events.'
            });
            if (result) await api.toggleSubscription(id, true);
        } catch (e) { console.error('Failed to prompt subscription:', e); }
    };

    const joinSociety = async () => {
        try {
            await api.joinSociety(id);
            setSociety(prev => ({ ...prev, is_member: true, member_count: (prev.member_count || 0) + 1 }));
            await promptNotificationSubscription();
        } catch (e) { console.error('Join failed:', e); }
    };

    const leaveSociety = async () => {
        try {
            await api.leaveSociety(id, 'me');
            setSociety(prev => ({ ...prev, is_member: false, member_count: Math.max(0, (prev.member_count || 0) - 1) }));
            refreshTags();
        } catch (e) { console.error('Leave failed:', e); }
    };

    const requestRatification = async () => {
        await api.requestRatification(id);
        setSociety(prev => ({ ...prev, ratification_status: 'pending' }));
    };

    const publishChanges = async (changes) => {
        await api.publishChanges(id, changes);
    };

    return { joinSociety, leaveSociety, requestRatification, publishChanges };
};
