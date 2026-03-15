import { Link, useInRouterContext } from "react-router-dom";
import styles from "./EntityLinkChip.module.css";

export default function EntityLinkChip({ to, onClick, children, className = "", title }) {
  const hasRouter = useInRouterContext();
  const cls = `${styles.chip} ${className}`.trim();
  if (to && hasRouter) {
    return (
      <Link to={to} className={cls} onClick={(event) => event.stopPropagation()} title={title}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={cls}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(event);
      }}
      title={title}
    >
      {children}
    </button>
  );
}
