<<<<<<< HEAD
/*
 * Task completion celebration toast context.
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { PartyPopper } from "lucide-react";
import AppToast from "../components/common/app_toast/AppToast";
=======
import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { PartyPopper } from "lucide-react";
import AppToast from "../components/common/AppToast/AppToast";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

const TaskCompletionContext = createContext(null);
const DEFAULT_MESSAGE = "Task complete.";
function playVictorySound(volume) {
  try {
    const audio = new Audio("/completion-pop.mp3");
    audio.volume = volume;
    audio.play().catch(() => playFallbackSound(volume));
  } catch {}
}

function playFallbackSound(volume) {
  const fallback = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
  fallback.volume = volume;
  fallback.play().catch(() => {});
}

function clearCompletionTimer(timeoutRef) {
  if (!timeoutRef.current) return;
  clearTimeout(timeoutRef.current);
  timeoutRef.current = null;
}

function useCompletionToast() {
  const [toast, setToast] = useState({ show: false, message: "", id: 0 });
  const timeoutRef = useRef(null);
<<<<<<< HEAD
  const closeToast = useCallback(() => { clearCompletionTimer(timeoutRef); setToast((current) => ({ ...current, show: false })); }, []);
  const showCompletionToast = useCallback((message = DEFAULT_MESSAGE, options = {}) => {
    clearCompletionTimer(timeoutRef);
    if (!options.isRoutine) playVictorySound(0.4);
    setToast((current) => ({ show: true, message, id: current.id + 1 }));
    timeoutRef.current = setTimeout(() => closeToast(), 2000);
  }, [closeToast]);
  useEffect(() => () => clearCompletionTimer(timeoutRef), []);
=======
  const closeToast = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setToast((prev) => ({ ...prev, show: false }));
  }, []);
  const showCompletionToast = useCallback((message, options = {}) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const { isRoutine } = options;
    if (!isRoutine) playVictorySound(0.4);
    setToast((prev) => ({ show: true, message: message ?? DEFAULT_MESSAGE, id: prev.id + 1 }));
    timeoutRef.current = setTimeout(() => {
      setToast((t) => ({ ...t, show: false }));
      timeoutRef.current = null;
    }, 2000);
  }, []);
  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  return { showCompletionToast, toast, closeToast };
}

function CompletionToastView({ toast, onClose }) {
  return (
    <AnimatePresence initial={false}>
<<<<<<< HEAD
      {toast.show && <AppToast key={toast.id} message={toast.message} onClose={onClose} variant="success" icon={<PartyPopper size={16} aria-hidden />} />}
=======
      {toast.show && (
        <AppToast
          key={toast.id}
          message={toast.message}
          onClose={onClose}
          variant="success"
          icon={<PartyPopper size={16} aria-hidden />}
        />
      )}
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    </AnimatePresence>
  );
}

export function TaskCompletionProvider({ children }) {
  const { showCompletionToast, toast, closeToast } = useCompletionToast();
  return (
    <TaskCompletionContext.Provider value={{ showCompletionToast }}>
      {children}
      <CompletionToastView toast={toast} onClose={closeToast} />
    </TaskCompletionContext.Provider>
  );
}

export function useTaskCompletion() {
  return useContext(TaskCompletionContext) || { showCompletionToast: () => {} };
}
