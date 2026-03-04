import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { PartyPopper } from "lucide-react";
import styles from "../components/TaskCelebration/CompletionToast.module.css";

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

const EVOLUTION_SAPLING_SEEN_KEY = "evolution_sapling_seen";

export function TaskCompletionProvider({ children }) {
  const [toast, setToast] = useState({ show: false, message: "", id: 0 });
  const [levelUpOverlay, setLevelUpOverlay] = useState(false);
  const timeoutRef = useRef(null);

  const showCompletionToast = useCallback((message, options = {}) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const { isRoutine } = options;
    if (!isRoutine) playVictorySound(0.4);
    setToast((prev) => ({
      show: true,
      message: message ?? DEFAULT_MESSAGE,
      id: prev.id + 1,
    }));
    timeoutRef.current = setTimeout(() => {
      setToast((t) => ({ ...t, show: false }));
      timeoutRef.current = null;
    }, 2000);
  }, []);

  const showLevelUpToast = useCallback((message) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    try {
      if (localStorage.getItem(EVOLUTION_SAPLING_SEEN_KEY) === "1") return;
    } catch (_) {}
    setToast((prev) => ({ show: true, message: message ?? "Level up!", id: prev.id + 1 }));
    setLevelUpOverlay(true);
    timeoutRef.current = setTimeout(() => {
      setToast((t) => ({ ...t, show: false }));
      timeoutRef.current = null;
    }, 3500);
  }, []);

  const dismissLevelUpOverlay = useCallback(() => {
    try {
      localStorage.setItem(EVOLUTION_SAPLING_SEEN_KEY, "1");
    } catch (_) {}
    setLevelUpOverlay(false);
  }, []);

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  return (
    <TaskCompletionContext.Provider value={{ showCompletionToast, showLevelUpToast, dismissLevelUpOverlay }}>
      {children}
      {toast.show && (
        <div key={toast.id} className={styles.toast} role="status" aria-live="polite">
          <PartyPopper size={20} className={styles.toastPartyPopper} aria-hidden />
          <span className={styles.toastMessage}>{toast.message}</span>
        </div>
      )}
      {levelUpOverlay && (
        <div className={styles.levelUpOverlay} aria-hidden>
          <div className={styles.confettiBurst} />
          <button
            type="button"
            className={styles.levelUpOverlayClose}
            onClick={dismissLevelUpOverlay}
            aria-label="Close celebration"
          >
            Close
          </button>
        </div>
      )}
    </TaskCompletionContext.Provider>
  );
}

export function useTaskCompletion() {
  const ctx = useContext(TaskCompletionContext);
  if (!ctx) return { showCompletionToast: () => {}, showLevelUpToast: () => {}, dismissLevelUpOverlay: () => {} };
  return ctx;
}
