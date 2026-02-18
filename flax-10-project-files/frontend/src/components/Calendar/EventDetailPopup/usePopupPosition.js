export function usePopupPosition(anchorRect) {
    if (!anchorRect) return getCenteredPosition();
    return getAnchoredPosition(anchorRect);
}

function getCenteredPosition() {
    return { top: "50%", left: "50%", transform: "translate(-50%, -50%)", position: "fixed" };
}

function getAnchoredPosition(anchorRect) {
    const top = anchorRect.bottom + 8;
    const left = Math.max(8, anchorRect.left);
    return { top: `${top}px`, left: `${left}px`, position: "fixed" };
}
