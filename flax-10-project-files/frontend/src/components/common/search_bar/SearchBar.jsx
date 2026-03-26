/*
 * Search input with optional slash-key shortcut to focus.
 */

import { forwardRef, useEffect, useRef } from "react";
import { Search } from "lucide-react";

import styles from "./SearchBar.module.css";
import TextInput from "../text_input/TextInput";
import { registerTarget, unregisterTarget } from "./slashShortcutRegistry";

function mergeRefs(externalRef, value) {
  if (!externalRef) return;
  if (typeof externalRef === "function") { externalRef(value); return; }
  externalRef.current = value;
}

function withShortcutHint(placeholder, enabled, hint) {
  if (!enabled) return placeholder;
  if (String(placeholder).includes("/")) return placeholder;
  return `${placeholder} ${hint}`;
}

function useSlashShortcutRegistration(internalRef, enableSlashShortcut) {
  useEffect(() => {
    const node = internalRef.current;
    if (!enableSlashShortcut || !node) return undefined;
    registerTarget(node);
    return () => unregisterTarget(node);
  }, [enableSlashShortcut, internalRef]);
}

/** Search input that optionally focuses on the "/" key press. */

const SearchBar = forwardRef(function SearchBar({
  value, onChange, placeholder = "Search...", className = "", onFocus, onBlur, inputClassName = "",
  enableSlashShortcut = true, showShortcutHint = true, shortcutHint = "( / )", ...inputProps
}, ref) {
  const internalRef = useRef(null);
  useSlashShortcutRegistration(internalRef, enableSlashShortcut);
  const setRef = (node) => { internalRef.current = node; mergeRefs(ref, node); };
  return (
    <TextInput ref={setRef}
      className={className ? `${styles.container} ${className}` : styles.container}
      inputClassName={inputClassName ? `${styles.input} ${inputClassName}` : styles.input}
      leading={<Search size={16} strokeWidth={2} />}
      value={value} onChange={(e) => onChange?.(e.target.value)}
      placeholder={withShortcutHint(placeholder, showShortcutHint, shortcutHint)}
      onFocus={onFocus} onBlur={onBlur} {...inputProps} />
  );
});

export default SearchBar;
