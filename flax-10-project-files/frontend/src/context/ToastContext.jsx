import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import AppToast from '../components/Common/AppToast/AppToast';

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
        setToast({
            message: msg,
            actionLabel: opts.actionLabel || null,
            onAction: typeof opts.onAction === 'function' ? opts.onAction : null,
            variant: opts.variant || 'success',
            icon: opts.icon || null,
        });
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
            <AnimatePresence initial={false}>
                {toast && (
                    <AppToast
                        message={toast.message}
                        actionLabel={toast.actionLabel}
                        onAction={toast.onAction}
                        variant={toast.variant}
                        icon={toast.icon}
                        onClose={closeToast}
                    />
                )}
            </AnimatePresence>
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}
