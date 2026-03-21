<<<<<<< HEAD:flax-10-project-files/frontend/src/components/Auth/AuthFooter.jsx
/*
 * Authentication footer messaging.
 */

import styles from "./AuthBranding.module.css";

function getFooterStyle(absolute) {
  return absolute
    ? { position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 3 }
    : undefined;
}

export function AuthFooter({ absolute = false }) {
  const className = absolute
    ? `${styles.footer} ${styles.footerAbsolute}`
    : styles.footer;

  return (
    <div className={className} style={getFooterStyle(absolute)}>
=======
import styles from "./AuthBranding.module.css";

export function AuthFooter({ absolute = false }) {
  const className = absolute ? `${styles.footer} ${styles.footerAbsolute}` : styles.footer;
  const inlineLayout = absolute ? { position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 3 } : undefined;
  return (
    <div className={className} style={inlineLayout}>
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration):flax-10-project-files/frontend/src/components/Authentication/AuthFooter.jsx
      Always secure · No ads · Free forever
    </div>
  );
}
