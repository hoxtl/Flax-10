import styles from "./EventDetailPopup.module.css";

export function PopupActions({ actions }) {
    if (!actions || actions.length === 0) return null;

    return (
        <div className={styles.actions}>
            {actions.map((action, i) => (
                <ActionButton key={i} action={action} />
            ))}
        </div>
    );
}

function ActionButton({ action }) {
    const className = action.variant === 'danger' ? styles.dangerBtn : styles.actionBtn;
    return (
        <button className={className} onClick={action.onClick}>
            {action.label}
        </button>
    );
}
