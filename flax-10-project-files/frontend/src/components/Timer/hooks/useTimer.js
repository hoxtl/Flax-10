/*
 * Timer state hook.
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

function resolveSettingKey(type) {
  if (type === 'work') return 'workTime';
  if (type === 'break') return 'breakTime';
  return 'targetSessions';
}

function updateTimeLeft(dispatch, state, type, val, oldVal) {
  if (state.mode !== type || typeof val !== 'number') return;
  if (!state.isActive) return dispatch({ type: 'SET_TIME_LEFT', payload: val * 60 });
  if (!state.isPaused) return;
  dispatch({ type: 'SET_TIME_LEFT', payload: state.timeLeft + ((val - oldVal) * 60) });
}

function updateSettings(dispatch, state, type, val) {
  const key = resolveSettingKey(type);
  const oldVal = state[key];
  dispatch({ type: 'UPDATE_SETTINGS', payload: { [key]: val } });
  updateTimeLeft(dispatch, state, type, val, oldVal);
}

export function useTimer(initWork, initBreak, initSessions) {
  const [state, dispatch] = useReducer(timerReducer, initialState(initWork, initBreak, initSessions));
  useInterval(state.isActive, dispatch);

  return {
    ...state,
    updateTime: (type, val) => updateSettings(dispatch, state, type, val),
    updateSettings: (payload) => dispatch({ type: 'UPDATE_SETTINGS', payload }),
    resetTimer: () => dispatch({ type: 'RESET' }),
    setIsActive: (v) => dispatch({ type: 'SET_ACTIVE', payload: v }),
    togglePause: () => dispatch({ type: 'TOGGLE_PAUSE' }),
    setMode: (v) => dispatch({ type: 'SET_MODE', payload: v }),
    setTimeLeft: (v) => dispatch({ type: 'SET_TIME_LEFT', payload: v }),
    setCompletedSessions: (v) => dispatch({ type: 'SET_COMPLETED', payload: v }),
  };
}
