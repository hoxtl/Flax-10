import { createContext, useContext, useState } from 'react';
import { useTimerLogic } from '../components/Timer/hooks/useTimerLogic';

const TimerContext = createContext();

export function useTimerContext() {
  const context = useContext(TimerContext);
  if (!context) throw new Error('useTimerContext must be used within TimerProvider');
  return context;
}

export function TimerProvider({ children }) {
  const [activeTaskId, setActiveTaskIdState] = useState(null);
  const [activeTaskMeta, setActiveTaskMeta] = useState(null);

  const setActiveTaskId = (id, meta = null) => {
    setActiveTaskIdState(id);
    setActiveTaskMeta(meta && typeof meta === 'object' ? meta : null);
    try {
      if (typeof window !== 'undefined') {
        if (id != null) {
          sessionStorage.setItem('timerTaskId', String(id));
          if (meta?.title != null) sessionStorage.setItem('timerTaskTitle', String(meta.title));
          if (meta?.categoryColor != null) sessionStorage.setItem('timerTaskCategoryColor', String(meta.categoryColor));
        } else {
          sessionStorage.removeItem('timerTaskId');
          sessionStorage.removeItem('timerTaskTitle');
          sessionStorage.removeItem('timerTaskCategoryColor');
        }
      }
    } catch (_) {}
  };

  const timerData = useTimerLogic(activeTaskId, setActiveTaskId, activeTaskMeta);
  return (
    <TimerContext.Provider value={{ ...timerData, setActiveTaskId }}>
      {children}
    </TimerContext.Provider>
  );
}
