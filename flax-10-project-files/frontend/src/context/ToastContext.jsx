/*
 * App-wide imperative toast API.
 */

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import AppToast from "../components/common/app_toast/AppToast";

const ToastContext = createContext(null);

function clearToastTimer(timeoutRef) {
  if (!timeoutRef.current) return;
  clearTimeout(timeoutRef.current);
  timeoutRef.current = null;
}

function buildToastState(message, options) {
  return {
    message,
    title: options.title || null,
    description: options.description || null,
    actionLabel: options.actionLabel || null,
    onAction: typeof options.onAction === "function" ? options.onAction : null,
    variant: options.variant || "success",
    icon: options.icon || null,
  };
}

function getToastDuration(options) {
  return Number.isFinite(options.durationMs) ? options.durationMs : 3200;
}

function useToastState() {
  const [toast, setToast] = useState(null);
  const timeoutRef = useRef(null);
  const closeToast = useCallback(() => { clearToastTimer(timeoutRef); setToast(null); }, []);
  const showToast = useCallback((message, options = {}) => {
    clearToastTimer(timeoutRef);
    setToast(buildToastState(message, options));
    timeoutRef.current = setTimeout(() => closeToast(), getToastDuration(options));
  }, [closeToast]);
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
            title={toast.title}
            message={toast.message}
            description={toast.description}
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
