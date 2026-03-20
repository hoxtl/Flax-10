/*
 * UI state for the homepage mini timeline.
 */

import { useCallback, useRef, useState } from "react";
import { usePopoverDismiss } from "./miniTimeline/usePopoverDismiss";
import { useSleepWindow } from "./miniTimeline/useSleepWindow";

export function useMiniTimelineState() {
  const [conflictPopoverRowId, setConflictPopoverRowId] = useState(null);
  const [slotPopoverRowId, setSlotPopoverRowId] = useState(null);
  const [eventCtxMenu, setEventCtxMenu] = useState(null);
  const conflictPopoverRef = useRef(null);
  const slotPopoverRef = useRef(null);
  const nowRowElementRef = useRef(null);
  const sleepWindow = useSleepWindow();
  const closeConflictPopover = useCallback(() => setConflictPopoverRowId(null), []);
  const closeSlotPopover = useCallback(() => setSlotPopoverRowId(null), []);
  const attachNowRow = useCallback((element) => {
    nowRowElementRef.current = element;
  }, []);

  usePopoverDismiss(conflictPopoverRowId, conflictPopoverRef, closeConflictPopover);
  usePopoverDismiss(slotPopoverRowId, slotPopoverRef, closeSlotPopover);

  return {
    conflictPopoverRowId,
    setConflictPopoverRowId,
    conflictPopoverRef,
    slotPopoverRowId,
    setSlotPopoverRowId,
    slotPopoverRef,
    eventCtxMenu,
    setEventCtxMenu,
    attachNowRow,
    sleepWindow,
  };
}
