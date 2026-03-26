/**
 * Breadcrumb navigation component.
 * Accepts a crumbs array of { label, navKey } objects.
 * Uses the app's custom navigation event system.
 */

import styles from "./Breadcrumb.module.css";

function navigate(navKey) {
  window.dispatchEvent(new CustomEvent("navigate", { detail: navKey }));
}

export default function Breadcrumb({ crumbs }) {
  if (!crumbs || crumbs.length === 0) return null;
  return (
    <nav className={styles.breadcrumb} aria-label="Breadcrumb">
      {crumbs.map((crumb, i) => (
        <span key={crumb.label} className={styles.crumbItem}>
          {i > 0 && <span className={styles.separator} aria-hidden="true">/</span>}
          {crumb.navKey ? (
            <button
              type="button"
              className={styles.crumbLink}
              onClick={() => navigate(crumb.navKey)}
            >
              {crumb.label}
            </button>
          ) : (
            <span className={styles.crumbCurrent} aria-current="page">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
