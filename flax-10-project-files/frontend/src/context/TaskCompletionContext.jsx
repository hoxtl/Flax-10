/*
 * Task completion celebration toast context.
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { PartyPopper } from "lucide-react";
import AppToast from "../components/common/app_toast/AppToast";

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
  const closeToast = useCallback(() => { clearCompletionTimer(timeoutRef); setToast((current) => ({ ...current, show: false })); }, []);
  const showCompletionToast = useCallback((message = DEFAULT_MESSAGE, options = {}) => {
    clearCompletionTimer(timeoutRef);
    if (!options.isRoutine) playVictorySound(0.4);
    setToast((current) => ({ show: true, message, id: current.id + 1 }));
    timeoutRef.current = setTimeout(() => closeToast(), 2000);
  }, [closeToast]);
  useEffect(() => () => clearCompletionTimer(timeoutRef), []);
  return { showCompletionToast, toast, closeToast };
}

function CompletionToastView({ toast, onClose }) {
  return (
    <AnimatePresence initial={false}>
      {toast.show && <AppToast key={toast.id} message={toast.message} onClose={onClose} variant="success" icon={<PartyPopper size={16} aria-hidden />} />}
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
