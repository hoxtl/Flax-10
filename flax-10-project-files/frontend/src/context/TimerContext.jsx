import { createContext, useContext, useState } from 'react';
import { useTimerLogic } from '../components/Timer/hooks/useTimerLogic';

const TimerContext = createContext();

export function useTimerContext() {
  const context = useContext(TimerContext);
  if (!context) throw new Error('useTimerContext must be used within TimerProvider');
  return context;
}

export function persistTimerTask(id, meta, options = {}) {
  const hasWindow = options.hasWindow ?? (typeof window !== 'undefined');
  const storage = options.storage ?? (typeof sessionStorage !== 'undefined' ? sessionStorage : null);
  if (!hasWindow || !storage) return;

  if (id != null) {
    storage.setItem('timerTaskId', String(id));
    if (meta?.title != null) storage.setItem('timerTaskTitle', String(meta.title));
    if (meta?.categoryColor != null) storage.setItem('timerTaskCategoryColor', String(meta.categoryColor));
  } else {
    storage.removeItem('timerTaskId');
    storage.removeItem('timerTaskTitle');
    storage.removeItem('timerTaskCategoryColor');
  }
}

export function TimerProvider({ children }) {
  const [activeTaskId, setActiveTaskIdState] = useState(null);
  const [activeTaskMeta, setActiveTaskMeta] = useState(null);

  const setActiveTaskId = (id, meta = null) => {
    setActiveTaskIdState(id);
    setActiveTaskMeta(meta && typeof meta === 'object' ? meta : null);
    try {
      persistTimerTask(id, meta);
    } catch (_) {}
  };

  const timerData = useTimerLogic(activeTaskId, setActiveTaskId, activeTaskMeta);
  return (
    <TimerContext.Provider value={{ ...timerData, setActiveTaskId }}>
      {children}
    </TimerContext.Provider>
  );
}
