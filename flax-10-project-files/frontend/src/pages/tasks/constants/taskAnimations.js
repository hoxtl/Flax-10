/*
 * Shared animation constants for task feed sections.
 */

export const SECTION_SHOW_LIMIT = 8;

export const TASK_ROW_ANIM = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0, transition: { opacity: { duration: 0.15 }, height: { duration: 0.2, delay: 0.05 } } },
  transition: { opacity: { duration: 0.2 }, height: { duration: 0.25 } },
};

export const SECTION_BODY_ANIM = {
  initial: { height: 0, opacity: 0, y: -4 },
  animate: { height: "auto", opacity: 1, y: 0 },
  exit: { height: 0, opacity: 0, y: -4 },
  transition: { height: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.2, ease: "easeOut" }, y: { duration: 0.2, ease: "easeOut" } },
};
