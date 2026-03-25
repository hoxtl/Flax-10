/*
 * Segmented control with a sliding active indicator and icon/label support.
 */

import { useId } from 'react';
import { motion } from 'framer-motion';
import styles from './SegmentedControl.module.css';
import Tooltip from '../Tooltip/Tooltip';

function SegmentButton({ option, isActive, onClick, fill, indicatorId, variant, tooltipPosition }) {
  const { label, icon: Icon, title } = option;
  const cls = `${styles.button} ${isActive ? styles.active : ''} ${Icon && !label ? styles.iconOnly : ''} ${fill ? styles.fillBtn : ''}`;
  const btn = (
    <button className={cls} onClick={onClick}>
      {isActive && (
        <motion.span layoutId={indicatorId}
          className={`${styles.activeIndicator} ${variant === 'solid' ? styles.activeIndicatorSolid : ''}`}
          transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.75 }} />
      )}
      {Icon && <Icon size={18} />}
      {label && <span>{label}</span>}
    </button>
  );
  if (!title) return btn;
  return <Tooltip content={title} position={tooltipPosition}>{btn}</Tooltip>;
}

/** Segmented control with an animated pill indicator for the active option. */

export function SegmentedControl({ options, value, onChange, className = '', fill = false, variant = 'default', tooltipPosition = 'top' }) {
  const controlId = useId();
  return (
    <div className={`${styles.container} ${fill ? styles.fill : ''} ${variant === 'solid' ? styles.solid : ''} ${className}`}>
      {options.map((opt) => (
        <SegmentButton key={opt.value} option={opt} isActive={value === opt.value}
          onClick={() => onChange(opt.value)} fill={fill}
          indicatorId={`segmented-indicator-${controlId}`} variant={variant} tooltipPosition={tooltipPosition} />
      ))}
    </div>
  );
}
