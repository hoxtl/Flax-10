export function calculatePopoverPosition(anchorRect, popWidth, popHeight, winWidth, winHeight, currTop = null, viewMode = 'month') {
    if (!anchorRect) return { top: 0, left: 0, placement: 'right' };

    if (viewMode === 'day') {
        let top = anchorRect.top - popHeight - 12;
        let placement = 'top';
        if (top < 16) {
            top = anchorRect.bottom + 12;
            placement = 'bottom';
        }
        let left = anchorRect.left + (anchorRect.width / 2) - (popWidth / 2);
        left = Math.max(16, Math.min(left, winWidth - popWidth - 16));
        return { top, left, placement };
    }

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

export function calculateArrowPosition(anchorRect, popoverPos, placement) {
    if (!anchorRect || !popoverPos) return 0;
    if (placement === 'top' || placement === 'bottom') {
        const anchorCenterX = anchorRect.left + (anchorRect.width / 2);
        return anchorCenterX - popoverPos.left - 6;
    }
    const anchorCenterY = anchorRect.top + (anchorRect.height / 2);
    return anchorCenterY - popoverPos.top - 6;
}
