/**
 * Popover positioning utilities for event detail popovers.
 */

/** Calculates optimal popover position based on anchor and viewport. */
export function calculatePopoverPosition(anchorRect, popWidth, popHeight, winWidth, winHeight, currTop = null, viewMode = 'month') {
  if (!anchorRect) return { top: 0, left: 0, placement: 'right' };
  return viewMode === 'day'
    ? calcDayViewPosition(anchorRect, popWidth, popHeight, winWidth)
    : calcDefaultPosition(anchorRect, popWidth, popHeight, winWidth, winHeight, currTop);
}

function calcDayViewPosition(anchorRect, popWidth, popHeight, winWidth) {
  let top = anchorRect.top - popHeight - 12;
  let placement = 'top';
  if (top < 16) { top = anchorRect.bottom + 12; placement = 'bottom'; }
  let left = anchorRect.left + (anchorRect.width / 2) - (popWidth / 2);
  left = Math.max(16, Math.min(left, winWidth - popWidth - 16));
  return { top, left, placement };
}

function adjustLeftPlacement(anchorRect, popWidth, winWidth) {
  let left = anchorRect.left - popWidth - 12;
  let placement = 'left';
  if (left < 16) { placement = 'none'; left = Math.max(16, Math.min(anchorRect.left + 12, winWidth - popWidth - 16)); }
  return { left, placement };
}

function calcDefaultPosition(anchorRect, popWidth, popHeight, winWidth, winHeight, currTop) {
  let top = currTop !== null ? currTop : anchorRect.top + (anchorRect.height / 2) - (popHeight / 2);
  top = Math.max(16, Math.min(top, winHeight - popHeight - 16));
  let left = anchorRect.right + 12;
  let placement = 'right';
  if (left + popWidth > winWidth - 16) {
    const adjusted = adjustLeftPlacement(anchorRect, popWidth, winWidth);
    left = adjusted.left;
    placement = adjusted.placement;
  }
  return { top, left, placement };
}

/** Calculates arrow position relative to anchor center. */
export function calculateArrowPosition(anchorRect, popoverPos, placement) {
  if (!anchorRect || !popoverPos) return 0;
  if (placement === 'top' || placement === 'bottom') {
    return anchorRect.left + (anchorRect.width / 2) - popoverPos.left - 6;
  }
  return anchorRect.top + (anchorRect.height / 2) - popoverPos.top - 6;
}
