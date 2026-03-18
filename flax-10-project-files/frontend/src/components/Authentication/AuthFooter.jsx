import styles from "./AuthBranding.module.css";

export function AuthFooter({ absolute = false }) {
  const className = absolute ? `${styles.footer} ${styles.footerAbsolute}` : styles.footer;
  const inlineLayout = absolute ? { position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 3 } : undefined;
  return (
    <div className={className} style={inlineLayout}>
      Always secure · No ads · Free forever
    </div>
  );
}
