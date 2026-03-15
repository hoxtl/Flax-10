import * as api from '../../../api/societyApi';
import { useTags } from '../../../context/TagContext';
import { useConfirm } from '../../../context/ConfirmContext';

const updateMemberState = (setSociety, isMember, delta) =>
    setSociety(prev => ({
        ...prev,
        is_member: isMember,
        is_subscribed: isMember ? prev.is_subscribed : false,
        member_count: Math.max(0, (prev.member_count || 0) + delta)
    }));

const promptSubscription = async (confirm, id, setSociety) => {
    const result = await confirm({
        title: 'Turn on notifications?',
        message: 'Stay updated with announcements and events.'
    });
    if (!result) return;
    await api.toggleSubscription(id, true);
    setSociety(prev => ({ ...prev, is_subscribed: true }));
};

const makeJoinSociety = (id, setSociety, confirm) =>
    async () => {
        try {
            await api.joinSociety(id);
            updateMemberState(setSociety, true, 1);
            await promptSubscription(confirm, id, setSociety);
        } catch (e) { console.error('Join failed:', e); }
    };

const makeLeaveSociety = (id, setSociety, refreshTags) =>
    async () => {
        try {
            await api.leaveSociety(id, 'me');
            updateMemberState(setSociety, false, -1);
            refreshTags();
        } catch (e) { console.error('Leave failed:', e); }
    };

const makeRequestRatification = (id, setSociety) =>
    async () => {
        await api.requestRatification(id);
        setSociety(prev => ({ ...prev, ratification_status: 'pending' }));
    };

export const useSocietyMembership = (id, setSociety) => {
    const { refreshTags } = useTags();
    const confirm = useConfirm();
    return {
        joinSociety: makeJoinSociety(id, setSociety, confirm),
        leaveSociety: makeLeaveSociety(id, setSociety, refreshTags),
        requestRatification: makeRequestRatification(id, setSociety),
        publishChanges: async (changes) => api.publishChanges(id, changes),
    };
};