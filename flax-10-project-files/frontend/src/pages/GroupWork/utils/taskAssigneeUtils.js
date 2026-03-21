/*
 * Task assignee popup helpers.
 */

export function createPopupCoords(rect, showTop) {
  return {
    top: showTop ? rect.top - 8 : rect.bottom + 8,
    left: Math.min(rect.left, window.innerWidth - 210),
    width: 200,
  };
}

export function shouldShowPopupAbove(rect) {
  const popupHeight = 250;
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  return spaceBelow < popupHeight && spaceAbove > spaceBelow;
}
