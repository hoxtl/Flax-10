function clampHorizontal(rawLeft, popWidth, winWidth) {
    return Math.max(16, Math.min(rawLeft, winWidth - popWidth - 16));
}

function positionAboveAnchor(anchorRect, popWidth, popHeight, winWidth) {
    const top = Math.max(16, anchorRect.top - popHeight - 12);
    const left = clampHorizontal(anchorRect.left + (anchorRect.width / 2) - (popWidth / 2), popWidth, winWidth);
    return { top, left, placement: 'top' };
}

function resolveHorizontalPlacement(anchorRect, popWidth, winWidth) {
    const rightLeft = anchorRect.right + 12;
    if (rightLeft + popWidth <= winWidth - 16) return { left: rightLeft, placement: 'right' };
    const leftLeft = anchorRect.left - popWidth - 12;
    if (leftLeft >= 16) return { left: leftLeft, placement: 'left' };
    return { left: clampHorizontal(anchorRect.left + 12, popWidth, winWidth), placement: 'none' };
}

export function calculatePopoverPosition(anchorRect, popWidth, popHeight, winWidth, winHeight, currTop = null, viewMode = 'month') {
    if (!anchorRect) return { top: 0, left: 0, placement: 'right' };
    if (viewMode === 'day') return positionAboveAnchor(anchorRect, popWidth, popHeight, winWidth);
    let top = currTop !== null ? currTop : anchorRect.top + (anchorRect.height / 2) - (popHeight / 2);
    top = Math.max(16, Math.min(top, winHeight - popHeight - 16));
    const { left, placement } = resolveHorizontalPlacement(anchorRect, popWidth, winWidth);
    return { top, left, placement };
}

/** Calculates arrow position relative to anchor center. */
export function calculateArrowPosition(anchorRect, popoverPos, placement) {
    if (!anchorRect || !popoverPos) return 0;
    if (placement === 'top' || placement === 'bottom') return anchorRect.left + (anchorRect.width / 2) - popoverPos.left - 6;
    return anchorRect.top + (anchorRect.height / 2) - popoverPos.top - 6;
}
