/*
 * useSocietyMembership handles joining and leaving societies.
 */

import { useState } from "react";
import * as api from '../../../api/societyApi';
import { useTags } from '../../../context/TagContext';
import { useToast } from '../../../context/ToastContext';

const updateMemberState = (setSociety, isMember, delta) => {
    let name = "this society";
    setSociety(prev => {
        name = prev?.name || name;
        const nextCount = Math.max(0, (prev.member_count || 0) + delta);
        return {
            ...prev,
            is_member: isMember,
            is_subscribed: isMember ? prev.is_subscribed : false,
            member_count: nextCount
        };
    });
    return name;
};

const makeJoinSociety = (id, setSociety, onMembershipChange, toast, setPendingAction) =>
    async () => {
        setPendingAction("join");
        try {
            await api.joinSociety(id);
            const societyName = updateMemberState(setSociety, true, 1);
            toast?.(`Joined ${societyName}`);
            onMembershipChange?.();
        } catch (err) {
            toast?.("Couldn't join this society.", { variant: "error" });
        } finally {
            setPendingAction(null);
        }
    };

const makeLeaveSociety = (id, setSociety, refreshTags, onMembershipChange, toast, setPendingAction) =>
    async () => {
        setPendingAction("leave");
        try {
            await api.leaveSociety(id, 'me');
            const societyName = updateMemberState(setSociety, false, -1);
            refreshTags();
            toast?.(`Left ${societyName}`);
            onMembershipChange?.();
        } catch (err) {
            toast?.("Couldn't leave this society.", { variant: "error" });
        } finally {
            setPendingAction(null);
        }
    };

const makeRequestRatification = (id, setSociety) =>
    async () => {
        await api.requestRatification(id);
        setSociety(prev => ({ ...prev, ratification_status: 'pending' }));
    };

export const useSocietyMembership = (id, setSociety, onMembershipChange) => {
    const [membershipAction, setMembershipAction] = useState(null);
    const { refreshTags } = useTags();
    const toast = useToast();
    return {
        joinSociety: makeJoinSociety(id, setSociety, onMembershipChange, toast, setMembershipAction),
        leaveSociety: makeLeaveSociety(id, setSociety, refreshTags, onMembershipChange, toast, setMembershipAction),
        requestRatification: makeRequestRatification(id, setSociety),
        publishChanges: async (changes) => api.publishChanges(id, changes),
        membershipAction,
    };
};
