/**
 * Right-click context menu for a task card.
 * Supports Edit, Move to list, Set due date, and Delete actions.
 */

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Pencil, FolderInput, CalendarDays, Trash2, ChevronLeft } from "lucide-react";

import DateTimePicker from "./DateTimePicker";
import { SleepWarningModal } from "../../../components/common/SleepWarningModal";
import { useSleepWarning } from "../../../components/Settings/hooks/useSleepWarning";
import { getUserSettings } from "../../../api/userService";

import styles from "./TaskCard.module.css";

function useMenuSleepSettings() {
  const [sleepSettings, setSleepSettings] = useState(null);
  useEffect(() => {
    let cancelled = false;
    getUserSettings()
      .then(d => { if (!cancelled) setSleepSettings({ sleep_time: d?.sleep_time?.slice(0, 5) || "23:00", wake_time: d?.wake_time?.slice(0, 5) || "07:00" }); })
      .catch(() => { if (!cancelled) setSleepSettings({ sleep_time: "23:00", wake_time: "07:00" }); });
    return () => { cancelled = true; };
  }, []);
  return sleepSettings;
}

function MainMenuView({ onEditOpen, onClose, lists, onMoveView, onDueView, onDelete }) {
  return (
    <>
      <button className={styles.ctxItem} onClick={() => { onEditOpen(); onClose(); }}><Pencil size={14} strokeWidth={2} /> Edit</button>
      {lists?.length > 0 && <button className={styles.ctxItem} onClick={onMoveView}><FolderInput size={14} strokeWidth={2} /> Move to list</button>}
      <button className={styles.ctxItem} onClick={onDueView}><CalendarDays size={14} strokeWidth={2} /> Set due date</button>
      <div className={styles.ctxDivider} />
      <button className={`${styles.ctxItem} ${styles.ctxItemDanger}`} onClick={() => { onDelete(); onClose(); }}><Trash2 size={14} strokeWidth={2} /> Delete</button>
    </>
  );
}

function MoveListItem({ l, task, onEdit, onClose }) {
  const fromList = null;
  return (
    <button key={l.id} className={`${styles.ctxItem} ${String(task.task_list) === String(l.id) ? styles.ctxItemActive : ""}`}
      onClick={() => { onEdit({ task_list: l.id }, { source: "context-menu", action: "move-list", listId: l.id, listName: l.name, fromListId: task.task_list, fromListName: fromList?.name || null }); onClose(); }}>
      <span className={styles.ctxListDot} style={{ background: l.color }} />{l.name}
    </button>
  );
}

function MoveListView({ task, lists, onEdit, onClose, onBack }) {
  return (
    <>
      <button className={styles.ctxBack} onClick={onBack}><ChevronLeft size={14} strokeWidth={2} /> Back</button>
      <div className={styles.ctxDivider} />
      {(lists || []).map(l => <MoveListItem key={l.id} l={l} task={task} onEdit={onEdit} onClose={onClose} />)}
    </>
  );
}

function DueDateView({ dueValue, onChange, onBack }) {
  return (
    <>
      <button className={styles.ctxBack} onClick={onBack}><ChevronLeft size={14} strokeWidth={2} /> Back</button>
      <div className={styles.ctxDivider} />
      <div className={styles.ctxDateWrap}><DateTimePicker value={dueValue} onChange={onChange} placeholder="Pick date & time" /></div>
    </>
  );
}

function MenuBody({ view, task, lists, onEdit, onClose, onEditOpen, onDelete, dueValue, onDueDateChange, setView }) {
  if (view === "move") return <MoveListView task={task} lists={lists} onEdit={onEdit} onClose={onClose} onBack={() => setView("main")} />;
  if (view === "due")  return <DueDateView dueValue={dueValue} onChange={onDueDateChange} onBack={() => setView("main")} />;
  return <MainMenuView onEditOpen={onEditOpen} onClose={onClose} lists={lists} onMoveView={() => setView("move")} onDueView={() => setView("due")} onDelete={onDelete} />;
}

/**
 * Context menu rendered via portal for task row actions.
 *
 * @param {object} props
 */
export function TaskContextMenu({ task, onEditOpen, onDelete, onEdit, lists, pos, onClose }) {
  const menuRef = useRef(null);
  const [view,     setView]     = useState("main");
  const [dueValue, setDueValue] = useState(task.due_date ? task.due_date.slice(0, 16) : "");
  const sleepSettings = useMenuSleepSettings();
  const { sleepWarning, checkSleepAndRun, sleepWarningProps } = useSleepWarning(sleepSettings);
  useEffect(() => {
    const handler = e => { if (menuRef.current && !menuRef.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  const handleDueDateChange = (val) => {
    setDueValue(val);
    if (!val) { onEdit({ due_date: null }, { source: "context-menu", action: "set-due-date", dueDate: null }); onClose(); return; }
    checkSleepAndRun(val, () => { onEdit({ due_date: val }, { source: "context-menu", action: "set-due-date", dueDate: val }); onClose(); });
  };
  return createPortal(
    <>
      <div ref={menuRef} className={styles.ctxMenu} style={{ top: pos.y, left: pos.x }} onMouseDown={e => e.stopPropagation()}>
        <MenuBody view={view} task={task} lists={lists} onEdit={onEdit} onClose={onClose} onEditOpen={onEditOpen} onDelete={onDelete} dueValue={dueValue} onDueDateChange={handleDueDateChange} setView={setView} />
      </div>
      {sleepWarning && <SleepWarningModal {...sleepWarningProps} />}
    </>,
    document.body
  );
}
