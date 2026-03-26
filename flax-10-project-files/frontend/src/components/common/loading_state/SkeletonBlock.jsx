/*
 * Animated placeholder block for skeleton loading states.
 */

import styles from "./SkeletonBlock.module.css";

/** Single animated skeleton block for use in loading skeletons. */
<<<<<<< HEAD:flax-10-project-files/frontend/src/components/common/loading_state/SkeletonBlock.jsx

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration):flax-10-project-files/frontend/src/components/common/LoadingState/SkeletonBlock.jsx
export default function SkeletonBlock({ className = "", style, ...props }) {
  return <div className={className ? `${styles.block} ${className}` : styles.block} style={style} {...props} />;
}
