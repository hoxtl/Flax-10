/**
 * Homepage toast hook with fallback UI state.
 */

import { useEffect, useMemo, useRef, useState } from "react";

function clearToastTimer(timeoutRef) {
  if (!timeoutRef.current) return;
  clearTimeout(timeoutRef.current);
  timeoutRef.current = null;
}

function setFallbackMessage(setFallbackToast, message, opts) {
  setFallbackToast({
    message,
    actionLabel: opts.actionLabel || null,
    onAction: typeof opts.onAction === "function" ? opts.onAction : null,
  });
}

function scheduleFallbackClear(timeoutRef, setFallbackToast, durationMs) {
  timeoutRef.current = setTimeout(() => {
    setFallbackToast(null);
    timeoutRef.current = null;
  }, durationMs);
}

export function useHomepageToast(toastApi) {
  const timeoutRef = useRef(null);
  const [fallbackToast, setFallbackToast] = useState(null);

  useEffect(() => () => clearToastTimer(timeoutRef), []);

  const showToast = useMemo(() => {
    if (typeof toastApi === "function") return toastApi;
    if (typeof toastApi?.showToast === "function") return toastApi.showToast;
    return (message, opts = {}) => {
      clearToastTimer(timeoutRef);
      setFallbackMessage(setFallbackToast, message, opts);
      scheduleFallbackClear(timeoutRef, setFallbackToast, Number.isFinite(opts.durationMs) ? opts.durationMs : 3200);
    };
  }, [toastApi]);

  return { fallbackToast, setFallbackToast, showToast };
}
