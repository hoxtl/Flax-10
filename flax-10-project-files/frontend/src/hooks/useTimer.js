import { useReducer, useEffect, useRef } from 'react';
import { timerReducer, initialState } from './timerReducer';

const useInterval = (isActive, dispatch) => {
    const ref = useRef();
    useEffect(() => {
        if (!isActive) return;
        ref.current = setInterval(() => dispatch({ type: 'TICK' }), 1000);
        return () => clearInterval(ref.current);
    }, [isActive, dispatch]);
};

export function useTimer(initWork, initBreak, initSessions) {
    const [state, dispatch] = useReducer(timerReducer, initialState(initWork, initBreak, initSessions));
    useInterval(state.isActive, dispatch);

    const updateTime = (type, val) => {
        const key = type === 'work' ? 'workTime' : type === 'break' ? 'breakTime' : 'targetSessions';
        dispatch({ type: 'UPDATE_SETTINGS', payload: { [key]: val } });
        // Logic to update timeLeft immediately if inactive is moved to reducer or separate effect if needed
        // For strict refactor, we simplify or assume reducer handles it if we pass more data.
        // Actually, to keep it simple and small, let's just dispatch generic updates.
        if (state.mode === type && !state.isActive && typeof val === 'number')
            dispatch({ type: 'SET_TIME_LEFT', payload: val * 60 });
    };

    return {
        ...state,
        setIsActive: (v) => dispatch({ type: 'SET_ACTIVE', payload: v }),
        setMode: (v) => dispatch({ type: 'SET_MODE', payload: v }),
        setTimeLeft: (v) => dispatch({ type: 'SET_TIME_LEFT', payload: v }),
        setCompletedSessions: (v) => dispatch({ type: 'SET_COMPLETED', payload: v }),
        resetTimer: () => dispatch({ type: 'RESET' }),
        updateTime
    };
}
