import { useState, useCallback } from "react";
import { toggleSubscription as apiToggle } from "../../../api/societyApi";
import { useConfirm } from "../../../context/ConfirmContext";

const confirmUnsub = async (confirm, name) => {
    return await confirm({
        title: "Turn off notifications?",
        message: `Are you sure you want to turn off notifications for ${name}?`,
    });
};

export function useSocietySubscription(societyId, society, updateLocalSociety) {
    const confirm = useConfirm();
    const isSubscribed = society?.is_subscribed ?? false;

    const subscribe = async () => {
        try {
            await apiToggle(societyId, true);
            updateLocalSociety({ is_subscribed: true });
        } catch (err) { console.error('Subscription failed:', err); }
    };

    const unsubscribe = async () => {
        try {
            const confirmed = await confirmUnsub(confirm, society?.name);
            if (!confirmed) return;
            await apiToggle(societyId, false);
            updateLocalSociety({ is_subscribed: false });
        } catch (err) { console.error('Unsubscription failed:', err); }
    };

    const toggleSubscription = () => isSubscribed ? unsubscribe() : subscribe();

    return { isSubscribed, toggleSubscription };
}
