/*
 * Task assignee popup helpers.
 */

/** Returns coordinates for positioning the assignee popup relative to a trigger rect. */
export function createPopupCoords(rect, showTop) {
  return {
    top: showTop ? rect.top - 8 : rect.bottom + 8,
    left: Math.min(rect.left, window.innerWidth - 210),
    width: 200,
  };
}

/** Returns true if the popup should open above the trigger due to limited space below. */
export function shouldShowPopupAbove(rect) {
  const popupHeight = 250;
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  return spaceBelow < popupHeight && spaceAbove > spaceBelow;
}
