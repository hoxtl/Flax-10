/*
 * Animated placeholder block for skeleton loading states.
 */

import styles from "./SkeletonBlock.module.css";

/** Single animated skeleton block for use in loading skeletons. */

export default function SkeletonBlock({ className = "", style, height, width, ...props }) {
  const mergedStyle = (height || width) ? { ...style, height, width } : style;
  return <div className={className ? `${styles.block} ${className}` : styles.block} style={mergedStyle} {...props} />;
}
