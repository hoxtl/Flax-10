import PageHeader from "../PageHeader/PageHeader";
import styles from "./AppPage.module.css";

function joinClassNames(...values) {
  return values.filter(Boolean).join(" ");
}

export default function AppPage({
  title,
  subtitle,
  action,
  toolbar,
  width = "xl",
  className = "",
  contentClassName = "",
  children,
  ...props
}) {
  const widthClass = styles[`width${width.charAt(0).toUpperCase()}${width.slice(1)}`];

  return (
    <section className={joinClassNames(styles.page, widthClass, className)} {...props}>
      {(title || subtitle || action) && (
        <PageHeader title={title} subtitle={subtitle} action={action} />
      )}
      {toolbar && <div className={styles.toolbar}>{toolbar}</div>}
      <div className={joinClassNames(styles.content, contentClassName)}>{children}</div>
    </section>
  );
}
