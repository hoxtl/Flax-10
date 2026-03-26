/*
 * Timer page controller.
 */

import { useCallback } from 'react';
import useBreakpoint from '../../../hooks/useBreakpoint';
import { useNotificationPermission } from '../../../components/timer/utils/timerUtils';
import { useTimerPageFlags } from './useTimerPageFlags';
import {
  useFocusAccent,
  useTimerDocumentTitle,
  useTimerShortcuts,
  useTransientFlags,
  useFocusFullscreen,
} from './useTimerPageEffects';

const MIN_FOCUS_SKELETON_MS = 500;
const FLAX_FOCUS_ACCENT = 'var(--timer-focus-accent)';

export function useTimerPageController(t, location) {
  const flags = useTimerPageFlags(location);
  const isMobile = useBreakpoint();
  const notifications = useNotificationPermission();
  const openFocusMode = useCallback(() => openFocus(flags), [flags]);
  const closeOverlays = useCallback(() => closeTimerOverlays(flags), [flags]);
  const state = { ...flags, ...notifications, t, isMobile, focusAccent: FLAX_FOCUS_ACCENT, fromTaskPlay: Boolean(location.state?.fromTaskPlay), minFocusSkeletonMs: MIN_FOCUS_SKELETON_MS, openFocusMode, closeOverlays };

  useFocusAccent(state.focusAccent);
  useTimerDocumentTitle(t);
  useTimerShortcuts(state);
  useTransientFlags(state);
  useFocusFullscreen(state);
  return state;
}

function openFocus(flags) {
  flags.setShowHistory(false);
  flags.setFocusMode(true);
  flags.setFocusFullscreenPending(true);
}

function closeTimerOverlays(flags) {
  flags.setShowHistory(false);
  flags.setFocusMode(false);
  flags.setShowShortcuts(false);
}
