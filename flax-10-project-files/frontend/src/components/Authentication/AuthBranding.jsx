import { useState, useEffect } from "react";
import styles from "./AuthBranding.module.css";

export function AuthBrand() {
  const [isTallEnough, setIsTallEnough] = useState(window.innerHeight >= 860);
  useEffect(() => {
    const handleResize = () => {
      setIsTallEnough(window.innerHeight >= 860);};
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);}, []);
  if (!isTallEnough) return null;
  return (
    <div className={styles.brandWrap}>
      <div className={styles.brandOrbital}>
        <span className={styles.brandDot} />
        <span className={styles.brandName}>STUDYFLAX</span>
      </div>
      <div className={styles.brandTag}>Built for calm study.</div>
    </div>);}

export function AuthFooter({ absolute = false }) {
  const className = absolute ? `${styles.footer} ${styles.footerAbsolute}` : styles.footer;
  const inlineLayout = absolute ? { position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 3 } : undefined;
  return (
    <div className={className} style={inlineLayout}>
      Always secure · No ads · Free forever
    </div>
  );
}
