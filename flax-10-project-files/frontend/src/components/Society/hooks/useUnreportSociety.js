/**
 * Shared hook for handling society unreporting with confirmation.
 * Promotes DRY across the society directory and detail pages.
 */
import { unreportSociety } from "../../../api/societyApi";
import { useConfirm } from "../../../context/ConfirmContext";

export function useUnreportSociety(onUpdateLocal) {
    const confirm = useConfirm();

    const unreport = async (society) => {
        const ok = await confirm({
            title: "Unreport Society",
            message: `Remove your report for ${society.name}?`,
            confirmText: "Unreport", cancelText: "Cancel", confirmStyle: "danger"
        });
        if (ok) await performUnreport(society.id, onUpdateLocal);
    };

    return unreport;
}

async function performUnreport(id, onUpdateLocal) {
    try {
        await unreportSociety(id);
        onUpdateLocal(id, { has_reported: false });
    } catch (error) {
        console.error("Failed to unreport society:", error);
    }
}
