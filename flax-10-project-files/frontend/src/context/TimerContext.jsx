import { createContext, useContext } from 'react';
import { useTimerLogic } from '../hooks/useTimerLogic';

const TimerContext = createContext(null);

export function TimerProvider({ children }) {
    const timerData = useTimerLogic();

    return (
        <TimerContext.Provider value={timerData}>
            {children}
        </TimerContext.Provider>
    );
}

export function useTimerContext() {
    const context = useContext(TimerContext);
    if (!context) {
        throw new Error('useTimerContext must be used within a TimerProvider');
    }
    return context;
}
