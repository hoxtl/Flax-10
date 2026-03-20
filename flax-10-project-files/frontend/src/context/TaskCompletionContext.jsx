import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { PartyPopper } from "lucide-react";
import AppToast from "../components/common/AppToast/AppToast";

const TaskCompletionContext = createContext(null);

const DEFAULT_MESSAGE = "Task complete.";
const COMPLETION_MESSAGES = [
  DEFAULT_MESSAGE,
  "Well done. Keep the momentum.",
  "Focus rewarded. Nice work.",
];

function playVictorySound(volume = 0.4) {
  try {
    const audio = new Audio("/completion-pop.mp3");
    audio.volume = volume;
    audio.play().catch(() => {
      const fallback = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
      fallback.volume = volume;
      fallback.play().catch(() => {});
    });
  } catch (_) {}
}

function useCompletionToast() {
  const [toast, setToast] = useState({ show: false, message: "", id: 0 });
  const timeoutRef = useRef(null);
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
  return { showCompletionToast, toast, closeToast };
}

function CompletionToastView({ toast, onClose }) {
  return (
    <AnimatePresence initial={false}>
      {toast.show && (
        <AppToast
          key={toast.id}
          message={toast.message}
          onClose={onClose}
          variant="success"
          icon={<PartyPopper size={16} aria-hidden />}
        />
      )}
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
  const ctx = useContext(TaskCompletionContext);
  if (!ctx) return { showCompletionToast: () => {} };
  return ctx;
}
