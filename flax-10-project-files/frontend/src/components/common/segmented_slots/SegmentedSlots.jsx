/*
 * Shared segmented slot container for compact action clusters.
 */

import styles from "./SegmentedSlots.module.css";

/** Shared segmented container used for compact multi-slot control rows. */

export function SegmentedSlots({ children, className = "" }) {
  return <div className={`${styles.container} ${className}`.trim()}>{children}</div>;
}

export function SegmentedSlot({ as: Component = "div", children, className = "", grow = false, ...props }) {
  const componentProps = Component === "button" ? { type: "button", ...props } : props;
  const classes = `${styles.slot} ${grow ? styles.slotGrow : ""} ${className}`.trim();
  return <Component className={classes} {...componentProps}>{children}</Component>;
}

export function SegmentedDivider({ className = "" }) {
  return <div className={`${styles.divider} ${className}`.trim()} aria-hidden="true" />;
}
