export function calculatePopoverPosition(anchorRect, popWidth, popHeight, winWidth, winHeight, currTop = null) {
    if (!anchorRect) return { top: 0, left: 0, placement: 'right' };
    let top = currTop !== null ? currTop : anchorRect.top + (anchorRect.height / 2) - (popHeight / 2);
    top = Math.max(16, Math.min(top, winHeight - popHeight - 16));
    let left = anchorRect.right + 12, placement = 'right';
    if (left + popWidth > winWidth - 16) {
        placement = 'left'; left = anchorRect.left - popWidth - 12;
        if (left < 16) {
            placement = 'none';
            left = Math.max(16, Math.min(anchorRect.left + 12, winWidth - popWidth - 16));
        }
    }
    return { top, left, placement };
}

export function calculateArrowPosition(anchorRect, popoverTop) {
    if (!anchorRect) return 0;
    const anchorCenterY = anchorRect.top + (anchorRect.height / 2);
    const arrowTop = anchorCenterY - popoverTop - 6;

    return arrowTop;
}
