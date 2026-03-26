/**
 * Breadcrumb navigation component.
 * Accepts a crumbs array of { label, navKey } objects.
 * Uses the app's custom navigation event system.
 */

import styles from "./Breadcrumb.module.css";

function navigate(navKey) {
  window.dispatchEvent(new CustomEvent("navigate", { detail: navKey }));
}

<<<<<<< HEAD
function BreadcrumbItem({ crumb, isFirst }) {
  return (
    <span className={styles.crumbItem}>
      {!isFirst && <span className={styles.separator} aria-hidden="true">/</span>}
      {crumb.navKey ? (
        <button type="button" className={styles.crumbLink} onClick={() => navigate(crumb.navKey)}>
          {crumb.label}
        </button>
      ) : (
        <span className={styles.crumbCurrent} aria-current="page">{crumb.label}</span>
      )}
    </span>
=======
function CrumbItem({ crumb, index }) {
  return (
    <span className={styles.crumbItem}>
      {index > 0 && <span className={styles.separator} aria-hidden="true">/</span>}
      {crumb.navKey ? (
        <button type="button" className={styles.crumbLink} onClick={() => navigate(crumb.navKey)}>
          {crumb.label}
        </button>
      ) : (
        <span className={styles.crumbCurrent} aria-current="page">{crumb.label}</span>
      )}
    </span>
  );
}
export default function Breadcrumb({ crumbs }) {
  if (!crumbs || crumbs.length === 0) return null;
  return (
    <nav className={styles.breadcrumb} aria-label="Breadcrumb">
      {crumbs.map((crumb, i) => <CrumbItem key={crumb.label} crumb={crumb} index={i} />)}
    </nav>
>>>>>>> origin/main
  );
}

export default function Breadcrumb({ crumbs }) {
  if (!crumbs?.length) return null;
  return <nav className={styles.breadcrumb} aria-label="Breadcrumb">{crumbs.map((crumb, index) => <BreadcrumbItem key={crumb.label} crumb={crumb} isFirst={index === 0} />)}</nav>;
}
