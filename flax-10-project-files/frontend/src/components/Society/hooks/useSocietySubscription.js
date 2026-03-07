import { useState, useCallback } from "react";
import { toggleSubscription as apiToggle } from "../../../api/societyApi";
import { useConfirm } from "../../../context/ConfirmContext";

export function useSocietySubscription(societyId, society, updateLocalSociety) {
    const confirm = useConfirm();
    const isSubscribed = society?.is_subscribed ?? false;

    const subscribe = useCallback(async () => {
        await apiToggle(societyId, true);
        updateLocalSociety({ is_subscribed: true });
    }, [societyId, updateLocalSociety]);

    const confirmUnsubscribe = useCallback(async () => {
        const yes = await confirm({
            title: "Turn off notifications?",
            message: `Are you sure you want to turn off notifications for ${society?.name}?`,
        });
        if (!yes) return;
        await apiToggle(societyId, false);
        updateLocalSociety({ is_subscribed: false });
    }, [societyId, society?.name, confirm, updateLocalSociety]);

    const toggleSubscription = useCallback(() => {
        return isSubscribed ? confirmUnsubscribe() : subscribe();
    }, [isSubscribed, confirmUnsubscribe, subscribe]);

    return { isSubscribed, toggleSubscription };
}
