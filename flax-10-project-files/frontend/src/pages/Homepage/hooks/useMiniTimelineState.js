import { useState, useEffect, useRef } from "react";
import { getUserSettings } from "../../../api/userService";

export function useMiniTimelineState() {
  const [conflictPopoverRowId, setConflictPopoverRowId] = useState(null);
  const [slotPopoverRowId, setSlotPopoverRowId] = useState(null);
  const [eventCtxMenu, setEventCtxMenu] = useState(null);
  const [sleepWindow, setSleepWindow] = useState({ sleepTime: "23:00", wakeTime: "07:00" });
  
  const conflictPopoverRef = useRef(null);
  const slotPopoverRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (conflictPopoverRef.current && !conflictPopoverRef.current.contains(e.target)) setConflictPopoverRowId(null);
      if (slotPopoverRef.current && !slotPopoverRef.current.contains(e.target)) setSlotPopoverRowId(null);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    getUserSettings().then(data => setSleepWindow({
      sleepTime: data?.sleep_time?.slice(0, 5) || "23:00",
      wakeTime: data?.wake_time?.slice(0, 5) || "07:00",
    })).catch(() => {});
  }, []);

  return {
    conflictPopoverRowId, setConflictPopoverRowId, conflictPopoverRef,
    slotPopoverRowId, setSlotPopoverRowId, slotPopoverRef,
    eventCtxMenu, setEventCtxMenu, sleepWindow
  };
}
