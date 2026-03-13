import { createContext, useContext, useState, useCallback, useRef } from 'react';
import styles from './Toast.module.css';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toast, setToast] = useState(null);
    const timeoutRef = useRef(null);

    const closeToast = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setToast(null);
    }, []);

    const showToast = useCallback((msg, opts = {}) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setToast({
            message: msg,
            actionLabel: opts.actionLabel || null,
            onAction: typeof opts.onAction === 'function' ? opts.onAction : null,
        });
        const duration = Number.isFinite(opts.durationMs) ? opts.durationMs : 3200;
        timeoutRef.current = setTimeout(() => {
            setToast(null);
            timeoutRef.current = null;
        }, duration);
    }, []);

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

function ToastUI({ toast, onClose }) {
    return (
        <div className={styles.toast}>
            <div className={styles.content}>
                <span className={styles.icon}>✓</span>
                <span className={styles.message}>{toast.message}</span>
            </div>
            {toast.actionLabel && toast.onAction && (
                <button
                    type="button"
                    className={styles.action}
                    onClick={async () => {
                        const action = toast.onAction;
                        onClose();
                        await action();
                    }}
                >
                    {toast.actionLabel}
                </button>
            )}
            <button type="button" className={styles.close} onClick={onClose}>✕</button>
        </div>
    );
}
