export const WELCOME_SEEN_KEY = "flax_welcome_seen_v1";
export const ACTIVE_NAV_KEY = "flax_active_nav";

export const ROOT_STYLE = {
  position: "relative",
  width: "100vw",
  height: "100vh",
  overflow: "hidden",
};

export const DASH_WRAP_STYLE = { position: "relative", height: "100%" };
export const AUTH_WRAP_STYLE = { position: "relative", height: "100vh" };
export const MOTION_ABSOLUTE = { position: "absolute", inset: 0 };

export const fadeAnim = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const DASH_MOTION = {
  variants: fadeAnim,
  initial: "initial",
  animate: "animate",
  exit: "exit",
  transition: { duration: 0.18 },
  style: MOTION_ABSOLUTE,
};

export const AUTH_MOTION = {
  variants: fadeAnim,
  initial: "initial",
  animate: "animate",
  exit: "exit",
  transition: { duration: 0.22 },
  style: MOTION_ABSOLUTE,
};
