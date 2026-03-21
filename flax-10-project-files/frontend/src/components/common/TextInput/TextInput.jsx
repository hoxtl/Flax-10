/*
 * Text input with optional leading and trailing adornments.
 */

import { forwardRef } from "react";
import styles from "./TextInput.module.css";

function joinClassNames(...values) {
  return values.filter(Boolean).join(" ");
}

/** Input or textarea with optional leading/trailing adornment slots. */
const TextInput = forwardRef(function TextInput({ className = "", inputClassName = "", leading = null, trailing = null, multiline = false, ...props }, ref) {
  const Component = multiline ? "textarea" : "input";
  return (
    <div className={joinClassNames(styles.root, leading ? styles.hasLeading : "", trailing ? styles.hasTrailing : "", className)}>
      {leading && <span className={styles.leading}>{leading}</span>}
      <Component ref={ref} className={joinClassNames(styles.input, inputClassName, multiline ? styles.multiline : "")} {...props} />
      {trailing && <span className={styles.trailing}>{trailing}</span>}
    </div>
  );
});

export default TextInput;
