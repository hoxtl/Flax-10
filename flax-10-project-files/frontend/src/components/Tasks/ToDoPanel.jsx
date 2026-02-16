import { useRef, useMemo } from "react";
import styles from "./TaskPanel.module.css";
import TaskHeader from "./TaskHeader";
import TaskList from "./TaskList";
import TaskInput from "./TaskInput";
import { useTodoStorage } from "./hooks/useTodoStorage";
import { useTodoPanelState } from "./hooks/useTodoPanelState";
import { useTaskMenu } from "./hooks/useTaskMenu";
import { useOutsideClick } from "./hooks/useOutsideClick";
import { useTaskOperations } from "./hooks/useTaskOperations";
import { useTaskReorder } from "./hooks/useTaskReorder";
import { partitionTasks } from "./utils/taskListUtils";

/**
 * Main to-do list panel component that contains the header, list, and input components. 
 * Handles all state management and logic for the to-do list, utilising custom hooks for storage, operations, and UI state.
 */

export default function ToDoPanel({ open = true, onClose, fabRef }) {
  const [items, setItems] = useTodoStorage();
  const panelRef = useRef(null);
  const menuRef = useRef(null);

  const {
    text,
    setText,
    editingId,
    setEditingId,
    editText,
    setEditText,
    menuOpen,
    setMenuOpen,
  } = useTodoPanelState();

  const {
    taskMenuId,
    setTaskMenuId,
    taskMenuPos,
    taskMenuRef,
    setTaskMenuAnchor,
  } = useTaskMenu();

  useOutsideClick(
    open,
    panelRef,
    menuRef,
    taskMenuRef,
    fabRef,
    onClose,
    setMenuOpen,
    setTaskMenuId
  );

  const operations = useTaskOperations(setItems, setTaskMenuId);
  const { onReorderActive } = useTaskReorder(setItems);

  const taskPartitions = useMemo(() => partitionTasks(items), [items]);

  const handleAddItem = (e) => {
    e.preventDefault();
    operations.addItem(text, setText);
  };

  const handleSaveEdit = (id) => {
    operations.saveEdit(id, editText, setEditingId, setEditText);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditText(item.title);
  };

  const handleDotsClick = (e, item) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTaskMenuAnchor({ x: r.left, y: r.top, w: r.width, h: r.height });
    setTaskMenuId((cur) => (cur === item.id ? null : item.id));
  };

  const handleClearCompleted = () => {
    operations.clearCompleted(setMenuOpen);
  };

  return (
    <div
      ref={panelRef}
      className={`${styles.panel} ${open ? styles.open : styles.closed}`}
    >
      <TaskHeader
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        menuRef={menuRef}
        anyCompleted={taskPartitions.anyCompleted}
        onClearCompleted={handleClearCompleted}
      />

      <TaskList
        isEmpty={taskPartitions.isEmpty}
        activePinned={taskPartitions.activePinned}
        urgentActive={taskPartitions.urgentActive}
        otherActive={taskPartitions.otherActive}
        doneItems={taskPartitions.doneItems}
        onReorder={onReorderActive}
        editingId={editingId}
        editText={editText}
        setEditText={setEditText}
        taskMenuId={taskMenuId}
        onToggleDone={operations.toggleDone}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
        onStartEdit={handleStartEdit}
        onDotsClick={handleDotsClick}
        onToggleUrgent={operations.toggleUrgent}
        onDelete={operations.deleteTask}
        taskMenuRef={taskMenuRef}
        taskMenuPos={taskMenuPos}
      />

      <TaskInput text={text} setText={setText} onSubmit={handleAddItem} />
    </div>
  );
}