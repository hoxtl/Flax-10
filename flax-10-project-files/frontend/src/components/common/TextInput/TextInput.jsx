import { forwardRef } from "react";
import styles from "./TextInput.module.css";

function joinClassNames(...values) {
  return values.filter(Boolean).join(" ");
}

const TextInput = forwardRef(function TextInput({
  className = "",
  inputClassName = "",
  leading = null,
  trailing = null,
  multiline = false,
  ...props
}, ref) {
  const Component = multiline ? "textarea" : "input";
  const hasLeading = Boolean(leading);
  const hasTrailing = Boolean(trailing);

  return (
    <div
      className={joinClassNames(
        styles.root,
        hasLeading ? styles.hasLeading : "",
        hasTrailing ? styles.hasTrailing : "",
        className,
      )}
    >
      {hasLeading && <span className={styles.leading}>{leading}</span>}
      <Component ref={ref} className={joinClassNames(styles.input, inputClassName, multiline ? styles.multiline : "")} {...props} />
      {hasTrailing && <span className={styles.trailing}>{trailing}</span>}
    </div>
  );
});

export default TextInput;
