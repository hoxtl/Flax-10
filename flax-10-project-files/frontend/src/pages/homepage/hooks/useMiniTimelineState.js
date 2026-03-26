/* UI state for the homepage mini timeline. */

import { useCallback, useRef, useState } from "react";
import { usePopoverDismiss } from "./mini_timeline/usePopoverDismiss";
import { useSleepWindow } from "./mini_timeline/useSleepWindow";

function useConflictPopover() {
  const [rowId, setRowId] = useState(null);
  const ref = useRef(null);
  const close = useCallback(() => setRowId(null), []);
  usePopoverDismiss(rowId, ref, close);
  return { rowId, setRowId, ref };
}

function useSlotPopover() {
  const [rowId, setRowId] = useState(null);
  const ref = useRef(null);
  const close = useCallback(() => setRowId(null), []);
  usePopoverDismiss(rowId, ref, close);
  return { rowId, setRowId, ref };
}

export function useMiniTimelineState() {
  const conflict = useConflictPopover();
  const slot = useSlotPopover();
  const [eventCtxMenu, setEventCtxMenu] = useState(null);
  const nowRowElementRef = useRef(null);
  const attachNowRow = useCallback((el) => { nowRowElementRef.current = el; }, []);

  return {
    conflictPopoverRowId: conflict.rowId,
    setConflictPopoverRowId: conflict.setRowId,
    conflictPopoverRef: conflict.ref,
    slotPopoverRowId: slot.rowId,
    setSlotPopoverRowId: slot.setRowId,
    slotPopoverRef: slot.ref,
    eventCtxMenu,
    setEventCtxMenu,
    attachNowRow,
    sleepWindow: useSleepWindow(),
  };
}
