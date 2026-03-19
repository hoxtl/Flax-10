const POPUP_WIDTH_PX = 380;
const POPUP_MARGIN_PX = 8;
const MIN_SPACE_PX = 250;

/**
 * Computes a fixed-position popup placement around an anchor rectangle.
 *
 * @param {{ top: number, bottom: number, left: number } | null} anchorRect
 * @returns {{ top: string, left: string, transform: string, position: string }}
 */
export function usePopupPosition(anchorRect) {
  if (!anchorRect) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      position: 'fixed',
    };
  }

  const spaceBelow = window.innerHeight - anchorRect.bottom;
  const openBelow = spaceBelow >= MIN_SPACE_PX;

  const topPx = openBelow
    ? anchorRect.bottom + POPUP_MARGIN_PX
    : anchorRect.top - POPUP_MARGIN_PX;

  const transform = openBelow ? 'none' : 'translateY(-100%)';

  const clampedLeftPx = Math.min(anchorRect.left, window.innerWidth - POPUP_WIDTH_PX);

  return {
    top: `${topPx}px`,
    left: `${clampedLeftPx}px`,
    transform,
    position: 'fixed',
  };
}

