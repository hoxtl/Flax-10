/*
 * Authentication footer messaging.
 */

import styles from "./AuthenticationBranding.module.css";

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
      Always secure · No ads · Free forever
    </div>
  );
}
