import { useId } from 'react';
import { motion } from 'framer-motion';
import styles from './SegmentedControl.module.css';

/**
 * Reusable segmented control with pill styling.
 * @param {Array} options - Array of { value, label, icon: LucideIcon, title } objects
 * @param {string} value - Currently selected value
 * @param {function} onChange - Callback when selection changes
 * @param {string} className - Optional additional class name
 * @param {string} variant - "default" or "solid" (charcoal inversion style)
 */
export function SegmentedControl({ options, value, onChange, className = '', fill = false, variant = 'default' }) {
    const controlId = useId();
    const variantClass = variant === 'solid' ? styles.solid : '';
    return (
        <div className={`${styles.container} ${fill ? styles.fill : ''} ${variantClass} ${className}`}>
            {options.map((opt) => (
                <SegmentButton
                    key={opt.value}
                    option={opt}
                    isActive={value === opt.value}
                    onClick={() => onChange(opt.value)}
                    fill={fill}
                    indicatorId={`segmented-indicator-${controlId}`}
                    variant={variant}
                />
            ))}
        </div>
    );
}

function SegmentButton({ option, isActive, onClick, fill, indicatorId, variant }) {
    const { label, icon: Icon, title } = option;
    const cls = `${styles.button} ${isActive ? styles.active : ''} ${Icon && !label ? styles.iconOnly : ''} ${fill ? styles.fillBtn : ''}`;
    return (
        <button className={cls} onClick={onClick} title={title}>
            {isActive && (
                <motion.span
                    layoutId={indicatorId}
                    className={`${styles.activeIndicator} ${variant === 'solid' ? styles.activeIndicatorSolid : ''}`}
                    transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.75 }}
                />
            )}
            {Icon && <Icon size={18} />}
            {label && <span>{label}</span>}
        </button>
    );
}
