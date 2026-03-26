/*
 * Timer page side effects.
 */

import { useCallback, useEffect } from 'react';

const APP_TITLE = 'StudyFlax';

function setDefaultTitle() {
  document.title = APP_TITLE;
}

function isTextInput(target) {
  return target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';
}

function toggleTimerPlayback(t) {
  if (t.isActive) return t.togglePause();
  return t.setIsActive(true);
}

function handleTimerShortcut(event, state) {
  if (event.key === '?') return state.setShowShortcuts((value) => !value);
  if (event.key === ' ') return toggleTimerPlayback(state.t);
  if (event.key === 'r' || event.key === 'R') return state.t.resetTimer();
  if (event.key === 'f' || event.key === 'F') return state.focusMode ? state.setFocusMode(false) : state.openFocusMode();
  if (event.key === 'Escape') return state.closeOverlays();
  return null;
}

export function useFocusAccent(focusAccent) {
  useEffect(() => {
    document.documentElement.style.setProperty('--timer-focus-accent', focusAccent);
    return () => document.documentElement.style.removeProperty('--timer-focus-accent');
  }, [focusAccent]);
}

export function useTimerDocumentTitle(t) {
  useEffect(() => {
    if (!t.isActive || t.isPaused) return setDefaultTitle;
    const mm = String(Math.floor(t.timeLeft / 60)).padStart(2, '0');
    const ss = String(t.timeLeft % 60).padStart(2, '0');
    document.title = `${mm}:${ss} ${t.mode === 'break' ? '☕' : '🔥'} — ${APP_TITLE}`;
    return setDefaultTitle;
  }, [t.isActive, t.isPaused, t.timeLeft, t.mode]);
}

export function useTimerShortcuts(state) {
  const handleKeyDown = useCallback((event) => {
    if (isTextInput(event.target)) return;
    const result = handleTimerShortcut(event, state);
    if (result === null) return;
    event.preventDefault();
  }, [state]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

function useTimeoutFlag(active, setActive, delay) {
  useEffect(() => {
    if (!active) return undefined;
    const id = setTimeout(() => setActive(false), delay);
    return () => clearTimeout(id);
  }, [active, delay, setActive]);
}

export function useTransientFlags(flags) {
  useTimeoutFlag(flags.showFocusTransition, flags.setShowFocusTransition, 5000);
  useTimeoutFlag(flags.showPageSkeleton, flags.setShowPageSkeleton, flags.minFocusSkeletonMs);
}

export function useFocusFullscreen(state) {
  useEffect(() => {
    if (state.focusMode && state.focusFullscreenPending) return queueFullscreen(state);
    if (!state.focusMode) exitFullscreen(state.setFocusFullscreenPending);
    return undefined;
  }, [state.focusMode, state.focusFullscreenPending, state.setFocusFullscreenPending]);
}

function queueFullscreen(state) {
  const id = window.setTimeout(() => {
    requestFullscreen(document.documentElement);
    state.setFocusFullscreenPending(false);
  }, 220);

  return () => clearTimeout(id);
}

function requestFullscreen(root) {
  if (document.fullscreenElement || !root?.requestFullscreen) return;
  root.requestFullscreen().catch(() => {});
}

function exitFullscreen(setPending) {
  setPending(false);
  if (!document.fullscreenElement || !document.exitFullscreen) return;
  document.exitFullscreen().catch(() => {});
}
