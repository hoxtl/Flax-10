const POPUP_HEIGHT_ESTIMATE = 280;
const POPUP_WIDTH = 380;
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
    const openAbove = spaceBelow < POPUP_HEIGHT_ESTIMATE && spaceAbove > POPUP_HEIGHT_ESTIMATE;

    let top;
    let transform = 'none';

    if (openAbove) {
        top = anchorRect.top - POPUP_MARGIN;
        transform = 'translateY(-100%)';
    } else {
        top = anchorRect.bottom + POPUP_MARGIN;
        // Clamp so popup never goes off the bottom
        const maxTop = window.innerHeight - POPUP_HEIGHT_ESTIMATE - POPUP_MARGIN;
        top = Math.min(top, maxTop);
        // If it would start too close to the top (e.g. all-day row), add offset
        top = Math.max(top, POPUP_MARGIN);
    }

    const left = Math.max(POPUP_MARGIN, Math.min(anchorRect.left, window.innerWidth - POPUP_WIDTH - POPUP_MARGIN));

    return { top: `${top}px`, left: `${left}px`, transform, position: "fixed" };
}
