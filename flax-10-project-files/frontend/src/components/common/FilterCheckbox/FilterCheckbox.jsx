/*
 * Styled checkbox for use in filter panels.
 */

import styles from './FilterCheckbox.module.css';

/** Checkbox input with the filter styling applied. */
export default function FilterCheckbox({ className = '', ...props }) {
  return <input type="checkbox" className={[styles.filterCheckbox, className].filter(Boolean).join(' ')} {...props} />;
}
