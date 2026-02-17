import { useState, useEffect, useRef } from "react";

export function useTaskMenu() {
  const [taskMenuId, setTaskMenuId] = useState(null);
  const [taskMenuPos, setTaskMenuPos] = useState({ top: 0, left: 0 });
  const [taskMenuAnchor, setTaskMenuAnchor] = useState(null);
  const taskMenuRef = useRef(null);
  useEffect(() => {
    if (!taskMenuId || !taskMenuAnchor) return;
    positionMenu(taskMenuRef.current, taskMenuAnchor, setTaskMenuPos);
  }, [taskMenuId, taskMenuAnchor]);
  return { taskMenuId, setTaskMenuId, taskMenuPos, taskMenuRef, setTaskMenuAnchor };
}

function positionMenu(menuEl, anchor, setPosition) {
  if (!menuEl) return;
  const pad = 8;
  const menuW = menuEl.offsetWidth;
  const menuH = menuEl.offsetHeight;
  let left = calculateLeft(anchor, menuW, pad);
  let top = calculateTop(anchor, menuH, pad);
  setPosition({ top, left });
}

function calculateLeft(anchor, menuW, pad) {
  let left = anchor.x + anchor.w - menuW;
  return Math.max(pad, Math.min(left, window.innerWidth - menuW - pad));
}

function calculateTop(anchor, menuH, pad) {
  let top = anchor.y + anchor.h + 8;
  if (top + menuH + pad > window.innerHeight) {
    top = anchor.y - menuH - 8;
  }
  return Math.max(pad, Math.min(top, window.innerHeight - menuH - pad));
}