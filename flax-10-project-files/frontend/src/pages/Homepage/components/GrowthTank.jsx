/**
 * Live progress: circular "Liquid Progress Tank" — sage green liquid, double wave, data-driven level.
 */

import { useState, useEffect, useRef } from "react";
import styles from "../Homepage.module.css";

export function GrowthTank({ completed = 0, total = 0, goalsCrushed: goalsCrushedProp }) {
  const prevCompletedRef = useRef(completed);
  const [splash, setSplash] = useState(false);

  const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  const displayPct = Math.max(0, pct);
  const goalsDisplay = goalsCrushedProp != null ? goalsCrushedProp : completed;

  useEffect(() => {
    if (completed > prevCompletedRef.current) {
      setSplash(true);
      const t = setTimeout(() => setSplash(false), 1200);
      prevCompletedRef.current = completed;
      return () => clearTimeout(t);
    }
    prevCompletedRef.current = completed;
  }, [completed]);

  return (
    <div
      className={`${styles.growthTankWrap} ${splash ? styles.growthTankSplash : ""}`}
      title={total ? `${completed} of ${total} tasks done — ${displayPct}%` : "No tasks today"}
      role="img"
      aria-label={total ? `Progress: ${displayPct}% complete, ${goalsDisplay} goals crushed` : "No tasks today"}
    >
      <div className={styles.growthTank}>
        <div className={styles.growthTankLiquid} style={{ height: `${displayPct}%` }} />
        {splash && (
          <>
            <span className={styles.growthTankBubble} style={{ "--bub-x": "12px", left: "30%", top: "50%" }} aria-hidden />
            <span className={styles.growthTankBubble} style={{ "--bub-x": "-10px", left: "55%", top: "55%" }} aria-hidden />
            <span className={styles.growthTankBubble} style={{ "--bub-x": "6px", left: "45%", top: "48%" }} aria-hidden />
          </>
        )}
        <div className={styles.growthTankOverlay}>
          <span className={styles.growthTankPct}>{total ? `${displayPct}%` : "—"}</span>
          <span className={styles.growthTankGoals}>{goalsDisplay} Goals Crushed</span>
        </div>
      </div>
    </div>
  );
}
