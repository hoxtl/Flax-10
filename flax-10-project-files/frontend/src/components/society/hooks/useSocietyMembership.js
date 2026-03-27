/*
 * useSocietyMembership handles joining and leaving societies.
 */

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

const makeJoinSociety = (id, setSociety, confirm, onMembershipChange) =>
    async () => {
        try {
            await api.joinSociety(id);
            updateMemberState(setSociety, true, 1);
            await promptSubscription(confirm, id, setSociety);
            onMembershipChange?.();
        } catch (err) {
        }
    };

const makeLeaveSociety = (id, setSociety, refreshTags, onMembershipChange) =>
    async () => {
        try {
            await api.leaveSociety(id, 'me');
            updateMemberState(setSociety, false, -1);
            refreshTags();
            onMembershipChange?.();
        } catch (err) {
        }
    };

const makeRequestRatification = (id, setSociety) =>
    async () => {
        await api.requestRatification(id);
        setSociety(prev => ({ ...prev, ratification_status: 'pending' }));
    };

export const useSocietyMembership = (id, setSociety, onMembershipChange) => {
    const { refreshTags } = useTags();
    const confirm = useConfirm();
    return {
        joinSociety: makeJoinSociety(id, setSociety, confirm, onMembershipChange),
        leaveSociety: makeLeaveSociety(id, setSociety, refreshTags, onMembershipChange),
        requestRatification: makeRequestRatification(id, setSociety),
        publishChanges: async (changes) => api.publishChanges(id, changes),
    };
};
