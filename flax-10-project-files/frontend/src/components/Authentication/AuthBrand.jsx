import { useState, useEffect } from "react";
import styles from "./AuthBranding.module.css";

export function AuthBrand() {
  const [isTallEnough, setIsTallEnough] = useState(window.innerHeight >= 860);
  const onResize = () => setIsTallEnough(window.innerHeight >= 860);
  useEffect(() => {
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  if (!isTallEnough) return null;
  return (
    <div className={styles.brandWrap}>
      <div className={styles.brandOrbital}>
        <span className={styles.brandDot} />
        <span className={styles.brandName}>STUDYFLAX</span>
      </div>
      <div className={styles.brandTag}>Built for calm study.</div>
    </div>
  );
}
