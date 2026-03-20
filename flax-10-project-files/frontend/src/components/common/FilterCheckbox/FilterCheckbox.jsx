import styles from './FilterCheckbox.module.css';

export default function FilterCheckbox({ className = '', ...props }) {
  const mergedClassName = [styles.filterCheckbox, className].filter(Boolean).join(' ');
  return <input type="checkbox" className={mergedClassName} {...props} />;
}
