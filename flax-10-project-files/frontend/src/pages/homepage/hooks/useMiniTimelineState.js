/* UI state for the homepage mini timeline. */

import { useCallback, useRef, useState } from "react";
import { usePopoverDismiss } from "./mini_timeline/usePopoverDismiss";
import { useSleepWindow } from "./mini_timeline/useSleepWindow";

function useRowPopoverState() {
  const [rowId, setRowId] = useState(null);
  const ref = useRef(null);
  const close = useCallback(() => setRowId(null), []);
  usePopoverDismiss(rowId, ref, close);
  return { rowId, setRowId, ref };
}

export function useMiniTimelineState() {
  const conflict = useRowPopoverState();
  const slot = useRowPopoverState();
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
