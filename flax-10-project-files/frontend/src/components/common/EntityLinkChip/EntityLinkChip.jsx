/*
 * Chip that renders as a router Link when a path is given, or a button otherwise.
 */

import { Link, useInRouterContext } from "react-router-dom";
import styles from "./EntityLinkChip.module.css";

/** Chip that links to a route or triggers an onClick callback. */

export default function EntityLinkChip({ to, onClick, children, className = "", title }) {
  const hasRouter = useInRouterContext();
  const cls = `${styles.chip} ${className}`.trim();
  if (to && hasRouter) {
    return (
      <Link to={to} className={cls} onClick={(e) => e.stopPropagation()} title={title}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} onClick={(e) => { e.stopPropagation(); onClick?.(e); }} title={title}>
      {children}
    </button>
  );
}
