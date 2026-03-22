/*
 * Standard page shell with an optional header, toolbar, and constrained-width content area.
 */

import BackButton from "../BackButton/BackButton.jsx";
import PageHeader from "../PageHeader/PageHeader";
import styles from "./AppPage.module.css";

function joinClassNames(...values) {
  return values.filter(Boolean).join(" ");
}

function buildWidthClass(width) {
  return styles[`width${width.charAt(0).toUpperCase()}${width.slice(1)}`];
}

function BackRow({ onBack, backLabel }) {
  return (
    <div className={styles.backRow}>
      <BackButton onClick={onBack} label={backLabel} />
    </div>
  );
}

/** Page shell that wraps content with an optional header and toolbar. */
export default function AppPage({ title, subtitle, action, onBack, backLabel = "Back", backPlacement = "inline", toolbar, width = "xl", className = "", contentClassName = "", children, ...props }) {
  const widthClass = buildWidthClass(width);
  const showBackAboveHeader = onBack && backPlacement === "above";
  const hasHeader = title || subtitle || action || onBack;
  return (
    <section className={joinClassNames(styles.page, widthClass, className)} {...props}>
      {showBackAboveHeader && <BackRow onBack={onBack} backLabel={backLabel} />}
      {hasHeader && <PageHeader title={title} subtitle={subtitle} action={action} onBack={showBackAboveHeader ? undefined : onBack} />}
      {toolbar && <div className={styles.toolbar}>{toolbar}</div>}
      <div className={joinClassNames(styles.content, contentClassName)}>{children}</div>
    </section>
  );
}
