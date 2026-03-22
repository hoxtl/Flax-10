/*
 * Standard page shell with an optional header, toolbar, and constrained-width content area.
 */

import BackButton from "../BackButton/BackButton.jsx";
import PageHeader from "../PageHeader/PageHeader";
import styles from "./AppPage.module.css";

function joinClassNames(...values) {
  return values.filter(Boolean).join(" ");
}

/** Page shell that wraps content with an optional header and toolbar. */
export default function AppPage({
  title,
  subtitle,
  action,
  onBack,
  backLabel = "Back",
  backPlacement = "inline",
  toolbar,
  width = "xl",
  className = "",
  contentClassName = "",
  children,
  ...props
}) {
  const widthClass = styles[`width${width.charAt(0).toUpperCase()}${width.slice(1)}`];
  const showBackAboveHeader = onBack && backPlacement === "above";
  return (
    <section className={joinClassNames(styles.page, widthClass, className)} {...props}>
      {showBackAboveHeader && (
        <div className={styles.backRow}>
          <BackButton onClick={onBack} label={backLabel} />
        </div>
      )}
      {(title || subtitle || action || onBack) && (
        <PageHeader title={title} subtitle={subtitle} action={action} onBack={showBackAboveHeader ? undefined : onBack} />
      )}
      {toolbar && <div className={styles.toolbar}>{toolbar}</div>}
      <div className={joinClassNames(styles.content, contentClassName)}>{children}</div>
    </section>
  );
}
