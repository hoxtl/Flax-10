/*
 * Shared Framer Motion transition presets and animation variants.
 */

export const STANDARD_EASE = [0.22, 1, 0.36, 1];

export const fadeInMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.24, ease: STANDARD_EASE },
};

export const tabContentMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 6 },
  transition: { duration: 0.25, ease: STANDARD_EASE },
};

export const viewSwapMotion = {
  initial: { opacity: 0, y: 10, scale: 0.992 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 8, scale: 0.992 },
  transition: { duration: 0.22, ease: STANDARD_EASE },
};

/** Returns panel entrance/exit motion props, flipping y direction when opening upward. */
export function getDropdownPanelMotion(openUpward = false) {
  const yOffset = openUpward ? 8 : -8;
  return {
    initial: { opacity: 0, y: yOffset, scale: 0.985 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: yOffset, scale: 0.985 },
    transition: { duration: 0.18, ease: STANDARD_EASE },
  };
}

/** Returns staggered item entrance motion props based on list index. */
export function getDropdownItemMotion(index = 0) {
  return {
    initial: { opacity: 0, x: -10 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.15, delay: index * 0.02, ease: STANDARD_EASE },
  };
}

export const checkmarkMotion = {
  initial: { scale: 0 },
  animate: { scale: 1 },
  transition: { type: "spring", stiffness: 500, damping: 28 },
};

export const chevronRotateTransition = {
  duration: 0.22,
  ease: STANDARD_EASE,
};
