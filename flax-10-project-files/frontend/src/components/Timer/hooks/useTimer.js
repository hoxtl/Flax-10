/*
 * Timer feature file.
 */

import { useReducer, useEffect, useRef } from 'react';
import { timerReducer, initialState } from '../utils/timerReducer';

const useInterval = (isActive, dispatch) => {
    const ref = useRef();
    useEffect(() => {
        if (!isActive) return;
        ref.current = setInterval(() => dispatch({ type: 'TICK' }), 1000);
        return () => clearInterval(ref.current);
    }, [isActive, dispatch]);
};

/** Helper to update settings and potentially reset time left */
const updateSettings = (dispatch, mode, isActive, type, val) => {
    const key = type === 'work' ? 'workTime' : type === 'break' ? 'breakTime' : 'targetSessions';
    dispatch({ type: 'UPDATE_SETTINGS', payload: { [key]: val } });
    if (mode === type && !isActive && typeof val === 'number')
        dispatch({ type: 'SET_TIME_LEFT', payload: val * 60 });
};

export function useTimer(initWork, initBreak, initSessions) {
    const [state, dispatch] = useReducer(timerReducer, initialState(initWork, initBreak, initSessions));
    useInterval(state.isActive, dispatch);

    return {
        ...state,
        updateTime: (type, val) => updateSettings(dispatch, state.mode, state.isActive, type, val),
        updateSettings: (payload) => dispatch({ type: 'UPDATE_SETTINGS', payload }),
        resetTimer: () => dispatch({ type: 'RESET' }),
        setIsActive: (v) => dispatch({ type: 'SET_ACTIVE', payload: v }),
        togglePause: () => dispatch({ type: 'TOGGLE_PAUSE' }),
        setMode: (v) => dispatch({ type: 'SET_MODE', payload: v }),
        setTimeLeft: (v) => dispatch({ type: 'SET_TIME_LEFT', payload: v }),
        setCompletedSessions: (v) => dispatch({ type: 'SET_COMPLETED', payload: v })
    };
}
