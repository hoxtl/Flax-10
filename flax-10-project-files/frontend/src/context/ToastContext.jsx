import { createContext, useContext, useState, useCallback, useRef } from 'react';
import styles from './Toast.module.css';

const ToastContext = createContext(null);

function useToastState() {
    const [toast, setToast] = useState(null);
    const timeoutRef = useRef(null);

    const closeToast = useCallback(() => {
        if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
        setToast(null);
    }, []);

    const showToast = useCallback((msg, opts = {}) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setToast({ message: msg, actionLabel: opts.actionLabel || null,
            onAction: typeof opts.onAction === 'function' ? opts.onAction : null });
        const duration = Number.isFinite(opts.durationMs) ? opts.durationMs : 3200;
        timeoutRef.current = setTimeout(() => { setToast(null); timeoutRef.current = null; }, duration);
    }, []);

    return { toast, closeToast, showToast };
}

export function ToastProvider({ children }) {
    const { toast, closeToast, showToast } = useToastState();
    return (
        <ToastContext.Provider value={showToast}>
            {children}
            {toast && <ToastUI toast={toast} onClose={closeToast} />}
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}

function ToastActionButton({ label, action, onClose }) {
    return (
        <button type="button" className={styles.action}
            onClick={async () => { onClose(); await action(); }}>
            {label}
        </button>
    );
}

function ToastUI({ toast, onClose }) {
    return (
        <div className={styles.toast}>
            <div className={styles.content}>
                <span className={styles.icon}>✓</span>
                <span className={styles.message}>{toast.message}</span>
            </div>
            {toast.actionLabel && toast.onAction && (
                <ToastActionButton label={toast.actionLabel} action={toast.onAction} onClose={onClose} />
            )}
            <button type="button" className={styles.close} onClick={onClose}>✕</button>
        </div>
    );
}
