import styles from './SegmentedControl.module.css';

/**
 * Reusable segmented control with pill styling.
 * @param {Array} options - Array of { value, label, icon: LucideIcon, title } objects
 * @param {string} value - Currently selected value
 * @param {function} onChange - Callback when selection changes
 * @param {string} className - Optional additional class name
 */
export function SegmentedControl({ options, value, onChange, className = '', fill = false }) {
    return (
        <div className={`${styles.container} ${fill ? styles.fill : ''} ${className}`}>
            {options.map((opt) => (
                <SegmentButton
                    key={opt.value}
                    option={opt}
                    isActive={value === opt.value}
                    onClick={() => onChange(opt.value)}
                    fill={fill}
                />
            ))}
        </div>
    );
}

function SegmentButton({ option, isActive, onClick, fill }) {
    const { label, icon: Icon, title } = option;
    const cls = `${styles.button} ${isActive ? styles.active : ''} ${Icon && !label ? styles.iconOnly : ''} ${fill ? styles.fillBtn : ''}`;
    return (
        <button className={cls} onClick={onClick} title={title}>
            {Icon && <Icon size={18} />}
            {label && <span>{label}</span>}
        </button>
    );
}
