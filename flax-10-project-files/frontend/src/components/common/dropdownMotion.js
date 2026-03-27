/*
 * Shared motion presets for dropdowns and timer task cards.
 */

const MOTION_EASE = [0.22, 1, 0.36, 1];

function buildMotionProps({ enterY = -8, enterScale = 0.98, exitY = enterY, exitScale = enterScale, duration = 0.2 } = {}) {
  return {
    initial: { opacity: 0, y: enterY, scale: enterScale },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: exitY, scale: exitScale },
    transition: { duration, ease: MOTION_EASE },
  };
}

export const DROPDOWN_MOTION_PROPS = buildMotionProps();

export const TASK_CARD_MOTION_PROPS = buildMotionProps({
  enterY: -10,
  enterScale: 0.97,
  exitScale: 0.97,
  duration: 0.22,
});
