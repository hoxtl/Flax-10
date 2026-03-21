/*
 * Task card with quick actions, contextual menu, and detail modals.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { Clock, Pencil, FolderInput, CalendarDays, Trash2, ChevronLeft } from "lucide-react";

import { useTimerContext } from "../../../context/TimerContext";
import { useTaskCompletion } from "../../../context/TaskCompletionContext";
import { getCompletionMessage, isRoutineTask } from "../../../lib/completionMessages";
import { getUserSettings } from "../../../api/userService";
import { SleepWarningModal } from "../../../components/common/SleepWarningModal";
import { useSleepWarning } from "../../../components/Settings/hooks/useSleepWarning";
import DateTimePicker from "../../../components/common/inputs/DateTimePicker";
import { CheckBurst } from "../../../components/TaskCelebration/CheckBurst";
import CreateTaskModal from "./CreateTaskModal";
import { TaskInfoModal } from "./TaskInfoModal";
import TaskCardMeta from "./TaskCardMeta";
import AnimatedDropdown from "../../../components/common/AnimatedDropdown";
import { formatDueDate, getCompletedDueLabel, splitEstimatedBlocks, PRIORITY_LABELS, PRIORITY_MARKS } from "../utils/taskCardUtils";

import cardStyles from "./TaskCard.module.css";
import ctxMenuStyles from "./TaskCardContextMenu.module.css";
const styles = { ...cardStyles, ...ctxMenuStyles };

function useActiveTimerTaskId() {
  const [id, setId] = useState(() => {
    try { return typeof window !== "undefined" ? sessionStorage.getItem("timerTaskId") : null; } catch { return null; }
  });
  useEffect(() => {
    const onStorage = (e) => { if (e.key === "timerTaskId") setId(e.newValue); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return id;
}

const IconPlay = () => (
  <svg className={styles.actionIcon} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
);

function HighlightText({ text, query }) {
  if (!query || !text) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className={styles.searchHighlight}>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function useTaskContextMenuState(task) {
  const [view, setView] = useState("main");
  const [dueValue, setDueValue] = useState(task.due_date ? task.due_date.slice(0, 16) : "");
  const [sleepSettings, setSleepSettings] = useState(null);
  const { sleepWarning, checkSleepAndRun, sleepWarningProps } = useSleepWarning(sleepSettings);
  return { view, setView, dueValue, setDueValue, sleepSettings, setSleepSettings, sleepWarning, checkSleepAndRun, sleepWarningProps };
}

function useTaskContextMenuEffects(menuRef, onClose, setSleepSettings) {
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuRef, onClose]);
  useEffect(() => {
    let cancelled = false;
    getUserSettings()
      .then((data) => { if (!cancelled) setSleepSettings({ sleep_time: data?.sleep_time?.slice(0, 5) || "23:00", wake_time: data?.wake_time?.slice(0, 5) || "07:00" }); })
      .catch(() => { if (!cancelled) setSleepSettings({ sleep_time: "23:00", wake_time: "07:00" }); });
    return () => { cancelled = true; };
  }, [setSleepSettings]);
}

function ContextMenuMainView({ onEditOpen, onDelete, onClose, lists, setView }) {
  return (
    <>
      <button className={styles.ctxItem} onClick={() => { onEditOpen(); onClose(); }}><Pencil size={14} strokeWidth={2} /> Edit</button>
      {lists?.length > 0 && <button className={styles.ctxItem} onClick={() => setView("move")}><FolderInput size={14} strokeWidth={2} /> Move to list</button>}
      <button className={styles.ctxItem} onClick={() => setView("due")}><CalendarDays size={14} strokeWidth={2} /> Set due date</button>
      <div className={styles.ctxDivider} />
      <button className={`${styles.ctxItem} ${styles.ctxItemDanger}`} onClick={() => { onClose(); onDelete(); }}><Trash2 size={14} strokeWidth={2} /> Delete</button>
    </>
  );
}

function ContextMenuMoveView({ task, lists, onEdit, onClose, setView }) {
  const safeList = lists || [];
  const fromListName = safeList.find((x) => String(x.id) === String(task.task_list))?.name || null;
  const options = safeList.map(l => ({ value: String(l.id), label: l.name }));
  const handleMove = (listId) => {
    const l = safeList.find(x => String(x.id) === listId);
    if (!l) return;
    onEdit({ task_list: l.id }, { source: "context-menu", action: "move-list", listId: l.id, listName: l.name, fromListId: task.task_list, fromListName });
    onClose();
  };
  return (
    <>
      <button className={styles.ctxBack} onClick={() => setView("main")}><ChevronLeft size={14} strokeWidth={2} /> Back</button>
      <div className={styles.ctxDivider} />
      <div className={styles.ctxMoveDropdownWrap}>
        <AnimatedDropdown value={String(task.task_list || "")} onChange={handleMove} options={options} menuMaxHeight={200} usePortal allowFlipUpward />
      </div>
    </>
  );
}

function ContextMenuDueView({ dueValue, setDueValue, onEdit, onClose, checkSleepAndRun, setView }) {
  const handleDueDateChange = (val) => {
    const dueDate = val || null;
    setDueValue(val);
    if (!dueDate) { onEdit({ due_date: null }, { source: "context-menu", action: "set-due-date", dueDate: null }); onClose(); return; }
    checkSleepAndRun(dueDate, () => { onEdit({ due_date: dueDate }, { source: "context-menu", action: "set-due-date", dueDate }); onClose(); });
  };
  return (
    <>
      <button className={styles.ctxBack} onClick={() => setView("main")}><ChevronLeft size={14} strokeWidth={2} /> Back</button>
      <div className={styles.ctxDivider} />
      <div className={styles.ctxDateWrap}><DateTimePicker value={dueValue} onChange={handleDueDateChange} placeholder="Pick date & time" /></div>
    </>
  );
}

export function TaskContextMenu({ task, onEditOpen, onDelete, onEdit, lists, pos, onClose }) {
  const menuRef = useRef(null);
  const state = useTaskContextMenuState(task);
  useTaskContextMenuEffects(menuRef, onClose, state.setSleepSettings);
  const menu = (
    <>
      <div ref={menuRef} className={styles.ctxMenu} style={{ top: pos.y, left: pos.x }} onMouseDown={(e) => e.stopPropagation()}>
        {state.view === "main" && <ContextMenuMainView onEditOpen={onEditOpen} onDelete={onDelete} onClose={onClose} lists={lists} setView={state.setView} />}
        {state.view === "move" && <ContextMenuMoveView task={task} lists={lists} onEdit={onEdit} onClose={onClose} setView={state.setView} />}
        {state.view === "due" && <ContextMenuDueView dueValue={state.dueValue} setDueValue={state.setDueValue} onEdit={onEdit} onClose={onClose} checkSleepAndRun={state.checkSleepAndRun} setView={state.setView} />}
      </div>
      {state.sleepWarning && <SleepWarningModal {...state.sleepWarningProps} />}
    </>
  );
  return createPortal(menu, document.body);
}

function buildCheckClickHandler(opts) {
  const { task, due, isOverdue, onToggle, setBurstPop, setCheckBounce, burstTimeoutRef, showCompletionToast } = opts;
  return function handleCheckClick() {
    const wasIncomplete = !task.completed;
    const routine = isRoutineTask(task);
    if (!wasIncomplete) { onToggle(); return; }
    if (!routine) { setBurstPop(true); setCheckBounce(true); setTimeout(() => setCheckBounce(false), 400); }
    const messageContext = { isOverdue, dueStatus: due?.status };
    showCompletionToast(getCompletionMessage(task, messageContext), { isRoutine: routine });
    if (!routine && burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current);
    if (!routine) burstTimeoutRef.current = setTimeout(() => { setBurstPop(false); burstTimeoutRef.current = null; }, 500);
    onToggle();
  };
}

export function EditTaskModal({ task, onSave, onDelete, onClose, lists = [] }) {
  return (
    <CreateTaskModal
      mode="edit"
      initialTask={task}
      defaultListId={task.task_list}
      lists={lists}
      onSave={onSave}
      onDeleteTask={onDelete}
      onClose={onClose}
    />
  );
}

function getTaskCardAccentClass(task) {
  if (task.completed) return "";
  if (task.priority === "urgent") return styles.cardAccentUrgent;
  if (task.priority === "high") return styles.cardAccentHigh;
  if (task.priority === "medium") return styles.cardAccentMedium;
  return "";
}

function getTaskCardDerived(task) {
  const due = formatDueDate(task.due_date);
  const priorityKey = (task.priority || "").toLowerCase();
  const showPriorityText = ["medium", "high", "urgent"].includes(priorityKey) && !task.completed;
  return { due, priorityKey, showPriorityText };
}

function useTaskCardHandlers(props) {
  const { task, due, isOverdue, onToggle, setCtxMenu, burstTimeoutRef } = props;
  const { showCompletionToast } = useTaskCompletion();
  const setBurstPop = props.setBurstPop;
  const setCheckBounce = props.setCheckBounce;
  const handleCheckClick = useCallback(() => buildCheckClickHandler({ task, due, isOverdue, onToggle, setBurstPop, setCheckBounce, burstTimeoutRef, showCompletionToast })(), [task, due, isOverdue, onToggle, setBurstPop, setCheckBounce, burstTimeoutRef, showCompletionToast]);
  useEffect(() => () => { if (burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current); }, [burstTimeoutRef]);
  const handleContextMenu = useCallback((event) => { event.preventDefault(); setCtxMenu({ x: event.clientX, y: event.clientY }); }, [setCtxMenu]);
  return { handleCheckClick, handleContextMenu };
}

function useTaskCard(props) {
  const { task, onToggle, onDelete, onEdit, listName, listColor, lists, hideDueBadge, hideListBadge, isOverdue, searchQuery, isCompletedSection } = props;
  const [showInfo, setShowInfo] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [ctxMenu, setCtxMenu] = useState(null);
  const [burstPop, setBurstPop] = useState(false);
  const [checkBounce, setCheckBounce] = useState(false);
  const burstTimeoutRef = useRef(null);
  const nav = useNavigate();
  const { setActiveTaskId } = useTimerContext();
  const activeTimerTaskId = useActiveTimerTaskId();
  const isActiveInTimer = activeTimerTaskId != null && String(task.id) === String(activeTimerTaskId);
  const { due, priorityKey, showPriorityText } = getTaskCardDerived(task);
  const { handleCheckClick, handleContextMenu } = useTaskCardHandlers({ task, due, isOverdue, onToggle, setCtxMenu, burstTimeoutRef, setBurstPop, setCheckBounce });
  const accentCls = getTaskCardAccentClass(task);
  return { task, listName, listColor, lists, hideDueBadge, hideListBadge, isCompletedSection, searchQuery, showInfo, setShowInfo, showEdit, setShowEdit, ctxMenu, setCtxMenu, burstPop, checkBounce, handleCheckClick, handleContextMenu, accentCls, due, priorityKey, showPriorityText, isActiveInTimer, isOverdue, nav, setActiveTaskId, onDelete, onEdit };
}

function CardTitleRow({ task, searchQuery, showPriorityText, priorityKey, hideDueBadge, due, isCompletedSection }) {
  const dueLabel = task.completed && isCompletedSection ? getCompletedDueLabel(task.due_date) : due?.label;
  const dueCls = due ? `${styles.dueLabel} ${task.completed && isCompletedSection ? styles.dueLabelCompleted : ""} ${styles[`due_${due.status}`] || ""}` : "";
  return (
    <div className={styles.titleRow}>
      <span className={`${styles.title} ${styles.titleClickable} ${task.completed ? styles.titleDone : ""}`}><HighlightText text={task.title} query={searchQuery} /></span>
      <span className={styles.titleMetaRight}>
        {showPriorityText && <span className={`${styles.priorityText} ${styles[`priorityText_${priorityKey}`]}`}><span className={styles.priorityMarks}>{PRIORITY_MARKS[priorityKey] || ""}</span><span className={styles.priorityLabel}>{PRIORITY_LABELS[priorityKey] || "Priority"}</span></span>}
        {due && !hideDueBadge && <span className={dueCls}>{(due.status === "tomorrow" || due.status === "today" || due.status === "overdue") && !(task.completed && isCompletedSection) && <Clock size={11} className={styles.duePillIcon} />}{dueLabel}</span>}
      </span>
    </div>
  );
}

function CardContentArea({ card, task, listName, listColor, hideDueBadge, hideListBadge, isCompletedSection, searchQuery, due, priorityKey, showPriorityText }) {
  const openInfo = (e) => { if (!e.target.closest?.("button") && !e.target.closest?.("a")) card.setShowInfo(true); };
  return (
    <div className={styles.content} role="button" tabIndex={0} onClick={openInfo} onKeyDown={(e) => { if (e.key === "Enter") card.setShowInfo(true); }}>
      <CardTitleRow task={task} searchQuery={searchQuery} showPriorityText={showPriorityText} priorityKey={priorityKey} hideDueBadge={hideDueBadge} due={due} isCompletedSection={isCompletedSection} />
      <TaskCardMeta task={task} listName={listName} hideListBadge={hideListBadge} listColour={listColor} isCompleted={task.completed} />
    </div>
  );
}

function CardPlayButton({ task, listColor, setActiveTaskId, nav }) {
  const onPlay = () => {
    const split = splitEstimatedBlocks(task.estimated_blocks);
    setActiveTaskId(task.id, { title: task.title, categoryColor: listColor || undefined, estimatedBlocks: Number(task.estimated_blocks || 1), estimatedSessionCount: split.sessionCount, estimatedWorkMinutes: split.workMinutes });
    nav("/timer", { state: { fromTaskPlay: true } });
  };
  return (
    <div className={styles.actionBar}><button type="button" className={`${styles.actionBarBtn} ${styles.actionBarBtnPlay}`} onClick={onPlay} aria-label="Study now"><IconPlay /></button></div>
  );
}

function TaskCardView(card) {
  const { task, listName, listColor, hideDueBadge, hideListBadge, isCompletedSection, searchQuery, burstPop, checkBounce, handleCheckClick, handleContextMenu, accentCls, due, priorityKey, showPriorityText, isActiveInTimer, setActiveTaskId, nav } = card;
  const cardCls = `${styles.card} ${task.completed ? styles.cardDone : ""} ${task.completed && isCompletedSection ? styles.cardCompletedRow : ""} ${card.isOverdue ? styles.cardOverdue : ""} ${isActiveInTimer ? styles.cardActiveTimer : ""} ${accentCls}`;
  return (
    <div className={cardCls} style={{ "--list-color": listColor || "#a89890" }} onContextMenu={handleContextMenu} title="Right-click for more options">
      <CheckBurst active={burstPop}>
        <button className={`${styles.check} ${task.completed ? styles.checkDone : ""} ${task.completed && isCompletedSection ? styles.checkDoneCompleted : ""} ${checkBounce ? styles.checkBounce : ""}`} onClick={handleCheckClick} aria-label={task.completed ? "Mark incomplete" : "Mark complete"}>
          {task.completed && <span className={styles.checkMark}>✓</span>}
        </button>
      </CheckBurst>
      <CardContentArea card={card} task={task} listName={listName} listColor={listColor} hideDueBadge={hideDueBadge} hideListBadge={hideListBadge} isCompletedSection={isCompletedSection} searchQuery={searchQuery} due={due} priorityKey={priorityKey} showPriorityText={showPriorityText} />
      {!task.completed && <CardPlayButton task={task} listColor={listColor} setActiveTaskId={setActiveTaskId} nav={nav} />}
    </div>
  );
}

export default function TaskCard(props) {
  const card = useTaskCard(props);
  return (
    <>
      <TaskCardView {...card} />
      {card.ctxMenu && <TaskContextMenu task={card.task} onEditOpen={() => card.setShowEdit(true)} onDelete={card.onDelete} onEdit={card.onEdit} lists={card.lists} pos={card.ctxMenu} onClose={() => card.setCtxMenu(null)} />}
      {card.showInfo && <TaskInfoModal task={card.task} listName={card.listName} onClose={() => card.setShowInfo(false)} />}
      {card.showEdit && <EditTaskModal task={card.task} onSave={(data) => card.onEdit(data)} onDelete={card.onDelete} lists={card.lists} onClose={() => card.setShowEdit(false)} />}
    </>
  );
}
