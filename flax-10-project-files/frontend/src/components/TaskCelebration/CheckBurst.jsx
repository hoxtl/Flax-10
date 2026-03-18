import styles from "./CheckBurst.module.css";

/**
 * Wrap around a checkbox; particles burst outward from center.
 */
export function CheckBurst({ active, children, className = "" }) {
  return (
    <div className={`${styles.wrap} ${active ? styles.active : ""} ${className}`}>
      {children}
      <div className={styles.burst} aria-hidden>
        {Array.from({ length: 8 }, (_, i) => (
          <span
            key={i}
            className={styles.particle}
            style={{ "--angle": `${i * 45}deg`, "--delay": `${i * 0.02}s` }}
          />
        ))}
      </div>
    </div>
  );
}
