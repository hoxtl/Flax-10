/*
 * General-purpose card container with variant, padding, and interactive mode options.
 */

import styles from "./Card.module.css";

function joinClassNames(...values) {
  return values.filter(Boolean).join(" ");
}

/** Card container with configurable variant, padding, and optional interactive state. */
<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
export default function Card({ as: Component = "div", children, className = "", variant = "default", padding = "md", interactive = false, ...props }) {
  return (
    <Component className={joinClassNames(
      styles.card, styles[variant],
      styles[`padding${padding.charAt(0).toUpperCase()}${padding.slice(1)}`],
      interactive ? styles.interactive : "", className,
    )} {...props}>
      {children}
    </Component>
  );
}
