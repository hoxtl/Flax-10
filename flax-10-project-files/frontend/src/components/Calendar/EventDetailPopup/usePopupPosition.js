const POPUP_HEIGHT_ESTIMATE = 250;
const POPUP_MARGIN = 8;

export function usePopupPosition(anchorRect) {
    if (!anchorRect) return getCenteredPosition();
    return getAnchoredPosition(anchorRect);
}

function getCenteredPosition() {
    return { top: "50%", left: "50%", transform: "translate(-50%, -50%)", position: "fixed" };
}

function getAnchoredPosition(anchorRect) {
    const spaceBelow = window.innerHeight - anchorRect.bottom;
    const spaceAbove = anchorRect.top;
    const openAbove = spaceBelow < POPUP_HEIGHT_ESTIMATE && spaceAbove > spaceBelow;

    const top = openAbove ? anchorRect.top - POPUP_MARGIN : anchorRect.bottom + POPUP_MARGIN;
    const transform = openAbove ? 'translateY(-100%)' : 'none';
    const left = Math.max(POPUP_MARGIN, Math.min(anchorRect.left, window.innerWidth - 380));

    return { top: `${top}px`, left: `${left}px`, transform, position: "fixed" };
}
