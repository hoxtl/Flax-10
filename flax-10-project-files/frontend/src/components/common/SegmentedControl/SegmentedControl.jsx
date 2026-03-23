/*
 * Segmented control with a sliding active indicator and icon/label support.
 */

import { useId } from 'react';
import { motion } from 'framer-motion';
import styles from './SegmentedControl.module.css';

function SegmentButton({ option, isActive, onClick, fill, indicatorId, variant }) {
  const { label, icon: Icon, title } = option;
  const cls = `${styles.button} ${isActive ? styles.active : ''} ${Icon && !label ? styles.iconOnly : ''} ${fill ? styles.fillBtn : ''}`;
  return (
    <button className={cls} onClick={onClick} title={title}>
      {isActive && (
        <motion.span layoutId={indicatorId}
          className={`${styles.activeIndicator} ${variant === 'solid' ? styles.activeIndicatorSolid : ''}`}
          transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.75 }} />
      )}
      {Icon && <Icon size={18} />}
      {label && <span>{label}</span>}
    </button>
  );
}

/** Segmented control with an animated pill indicator for the active option. */

export function SegmentedControl({ options, value, onChange, className = '', fill = false, variant = 'default' }) {
  const controlId = useId();
  return (
    <div className={`${styles.container} ${fill ? styles.fill : ''} ${variant === 'solid' ? styles.solid : ''} ${className}`}>
      {options.map((opt) => (
        <SegmentButton key={opt.value} option={opt} isActive={value === opt.value}
          onClick={() => onChange(opt.value)} fill={fill}
          indicatorId={`segmented-indicator-${controlId}`} variant={variant} />
      ))}
    </div>
  );
}
