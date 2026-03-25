/*
 * useSocietySubscription toggles notification subscriptions for a society.
 */

import { toggleSubscription as apiToggle } from "../../../api/societyApi";
import { useConfirm } from "../../../context/ConfirmContext";

const confirmUnsub = async (confirm, name) => {
    return await confirm({
        title: "Turn off notifications?",
        message: `Are you sure you want to turn off notifications for ${name}?`,
    });
};

const makeSubscribe = (societyId, updateLocalSociety) =>
    async () => {
        try {
            await apiToggle(societyId, true);
            updateLocalSociety({ is_subscribed: true });
        } catch (err) {
            console.error('Subscription failed:', err);
        }
    };

const doUnsubscribe = async (societyId, updateLocalSociety, confirm, name) => {
    const confirmed = await confirmUnsub(confirm, name);
    if (!confirmed) return;
    await apiToggle(societyId, false);
    updateLocalSociety({ is_subscribed: false });
};

const makeUnsubscribe = (societyId, updateLocalSociety, confirm, name) =>
    async () => {
        try { await doUnsubscribe(societyId, updateLocalSociety, confirm, name); }
        catch (err) { console.error('Unsubscription failed:', err); }
    };

export function useSocietySubscription(societyId, society, updateLocalSociety) {
    const confirm = useConfirm();
    const isSubscribed = society?.is_subscribed ?? false;
    const subscribe = makeSubscribe(societyId, updateLocalSociety);
    const unsubscribe = makeUnsubscribe(societyId, updateLocalSociety, confirm, society?.name);
    const toggleSubscription = () => isSubscribed ? unsubscribe() : subscribe();
    return { isSubscribed, toggleSubscription };
}
