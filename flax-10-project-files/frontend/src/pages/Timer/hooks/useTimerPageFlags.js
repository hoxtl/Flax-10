/*
 * Timer page local UI flags.
 */

import { useState } from 'react';

export function useTimerPageFlags(location) {
  const [showHistory, setShowHistory] = useState(false);
  const [showFocusTransition, setShowFocusTransition] = useState(() => Boolean(location.state?.fromTaskPlay));
  const [showPageSkeleton, setShowPageSkeleton] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [focusFullscreenPending, setFocusFullscreenPending] = useState(false);
  const [streakData, setStreakData] = useState(null);
  const [dismissedWarning, setDismissedWarning] = useState(false);

  return { showHistory, setShowHistory, showFocusTransition, setShowFocusTransition, showPageSkeleton, setShowPageSkeleton, showShortcuts, setShowShortcuts, focusMode, setFocusMode, focusFullscreenPending, setFocusFullscreenPending, streakData, setStreakData, dismissedWarning, setDismissedWarning };
}
