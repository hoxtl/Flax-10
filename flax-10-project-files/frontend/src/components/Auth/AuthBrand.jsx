<<<<<<< HEAD:flax-10-project-files/frontend/src/components/Auth/AuthBrand.jsx
/*
 * Authentication brand mark for tall auth layouts.
 */

import { useEffect, useState } from "react";
import styles from "./AuthBranding.module.css";

function isTallViewport() {
  return window.innerHeight >= 860;
}

export function AuthBrand() {
  const [isTallEnough, setIsTallEnough] = useState(isTallViewport);
  useEffect(() => {
    const handleResize = () => setIsTallEnough(isTallViewport());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
=======
import { useState, useEffect } from "react";
import styles from "./AuthBranding.module.css";

export function AuthBrand() {
  const [isTallEnough, setIsTallEnough] = useState(window.innerHeight >= 860);
  const onResize = () => setIsTallEnough(window.innerHeight >= 860);
  useEffect(() => {
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration):flax-10-project-files/frontend/src/components/Authentication/AuthBrand.jsx
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
