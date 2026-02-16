import { useRef, useMemo } from "react";
import styles from "./TaskPanel.module.css";
import TaskHeader from "./TaskHeader";
import TaskList from "./TaskList";
import TaskInput from "./TaskInput";
import { useTodoStorage } from "../../hooks/tasks/useTodoStorage";
import { useTodoPanelState } from "../../hooks/tasks/useTodoPanelState";
import { useTaskMenu } from "../../hooks/tasks/useTaskMenu";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import { useTaskOperations } from "../../hooks/tasks/useTaskOperations";
import { useTaskReorder } from "../../hooks/tasks/useTaskReorder";
import { partitionTasks } from "../../utils/tasks/taskListUtils";
/**
 * Main to-do list panel component that contains the header, list, and input components. 
 * Handles all state management and logic for the to-do list, utilising custom hooks for storage, operations, and UI state.
 */

function usePanelHandlers(operations, state, menu) {
  return {
    handleAddItem: (e) => { e.preventDefault(); operations.addItem(state.text, state.setText); },
    handleSaveEdit: (id) => operations.saveEdit(id, state.editText, state.setEditingId, state.setEditText),
    handleCancelEdit: () => { state.setEditingId(null); state.setEditText(""); },
    handleStartEdit: (item) => { state.setEditingId(item.id); state.setEditText(item.title); },
    handleDotsClick: (e, item) => {
      const r = e.currentTarget.getBoundingClientRect();
      menu.setTaskMenuAnchor({ x: r.left, y: r.top, w: r.width, h: r.height });
      menu.setTaskMenuId((cur) => (cur === item.id ? null : item.id));
    },
    handleClearCompleted: () => operations.clearCompleted(state.setMenuOpen),
  };
}

function usePanelSetup(setItems) {
  const state = useTodoPanelState();
  const menu = useTaskMenu();
  const operations = useTaskOperations(setItems, menu.setTaskMenuId);
  const { onReorderActive } = useTaskReorder(setItems);
  const handlers = usePanelHandlers(operations, state, menu);
  return { state, menu, operations, onReorderActive, handlers };
}

function buildListProps(partitions, state, menu, operations, handlers, onReorder) {
  return {
    isEmpty: partitions.isEmpty, activePinned: partitions.activePinned,
    urgentActive: partitions.urgentActive, otherActive: partitions.otherActive,
    doneItems: partitions.doneItems, onReorder,
    editingId: state.editingId, editText: state.editText, setEditText: state.setEditText,
    taskMenuId: menu.taskMenuId, taskMenuRef: menu.taskMenuRef, taskMenuPos: menu.taskMenuPos,
    onToggleDone: operations.toggleDone, onToggleUrgent: operations.toggleUrgent, onDelete: operations.deleteTask,
    onSaveEdit: handlers.handleSaveEdit, onCancelEdit: handlers.handleCancelEdit,
    onStartEdit: handlers.handleStartEdit, onDotsClick: handlers.handleDotsClick,
  };
}

function PanelContent({ open, panelRef, menuRef, state, menu, operations, onReorder, taskPartitions, handlers }) {
  return (
    <div ref={panelRef} className={`${styles.panel} ${open ? styles.open : styles.closed}`}>
      <TaskHeader menuOpen={state.menuOpen} setMenuOpen={state.setMenuOpen} menuRef={menuRef} anyCompleted={taskPartitions.anyCompleted} onClearCompleted={handlers.handleClearCompleted} />
      <TaskList {...buildListProps(taskPartitions, state, menu, operations, handlers, onReorder)} />
      <TaskInput text={state.text} setText={state.setText} onSubmit={handlers.handleAddItem} />
    </div>
  );
}

/** Main to-do panel — wires storage, state and UI together. */
export default function ToDoPanel({ open = true, onClose, fabRef }) {
  const [items, setItems] = useTodoStorage();
  const panelRef = useRef(null);
  const menuRef = useRef(null);
  const { state, menu, operations, onReorderActive, handlers } = usePanelSetup(setItems);
  const taskPartitions = useMemo(() => partitionTasks(items), [items]);
  useOutsideClick(open, panelRef, menuRef, menu.taskMenuRef, fabRef, onClose, state.setMenuOpen, menu.setTaskMenuId);
  return <PanelContent open={open} panelRef={panelRef} menuRef={menuRef} state={state} menu={menu} operations={operations} onReorder={onReorderActive} taskPartitions={taskPartitions} handlers={handlers} />;
}