/*
 * Pure utility functions for AnimatedDropdown: filtering, positioning, and event helpers.
 */

/** Filters grouped option sets by label, removing empty groups. */

export function filterGrouped(options, query) {
  if (!query.trim()) return options;
  const q = query.toLowerCase();
  return options
    .map(group => ({ ...group, options: group.options.filter(o => o.label.toLowerCase().includes(q)) }))
    .filter(group => group.options.length > 0);
}

/** Filters a flat option list by label. */

export function filterFlat(options, query) {
  if (!query.trim()) return options;
  const q = query.toLowerCase();
  return options.filter(o => {
    const label = typeof o === "string" ? o : o.label;
    return label.toLowerCase().includes(q);
  });
}

/** Builds inline style for the dropdown menu panel. */

export function buildMenuStyle(openUpward, usePortal, coords, menuMaxHeight) {
  const style = openUpward ? { bottom: "100%", top: "auto", marginBottom: 4 } : {};
  if (usePortal && coords) {
    const top = openUpward ? "auto" : coords.top + 4;
    const bottom = openUpward ? window.innerHeight - coords.top + 4 : "auto";
    Object.assign(style, { position: "fixed", top, bottom, left: coords.left, width: "max-content", minWidth: coords.width, zIndex: 10001, margin: 0 });
  }
  let effectiveMaxHeight = menuMaxHeight || 260;
  if (usePortal && coords) {
    const availableSpace = openUpward
      ? coords.top - 20
      : window.innerHeight - coords.top - 20;
    effectiveMaxHeight = Math.min(effectiveMaxHeight, Math.max(160, availableSpace));
  }
  style.maxHeight = effectiveMaxHeight;
  return style;
}

/** Determines whether the dropdown should open upward and computes its coords. */

export function computeOpenDirection(rect, menuMaxHeight, allowFlipUpward) {
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const shouldOpenUpward = allowFlipUpward && spaceBelow < menuMaxHeight && spaceAbove > spaceBelow;
  return {
    shouldOpenUpward,
    coords: { top: shouldOpenUpward ? rect.top : rect.bottom, left: rect.left, width: rect.width },
  };
}

/** Returns a mousedown listener that closes the dropdown on outside clicks. */

export function makeOutsideClickListener(containerRef, menuRef, setIsOpen) {
  return (event) => {
    const isInside = containerRef.current?.contains(event.target);
    const isInsideMenu = menuRef.current?.contains(event.target);
    if (!isInside && !isInsideMenu) setIsOpen(false);
  };
}
