/**
 * Tasks page: list sidebar, task feed, create modals, toasts.
 * Uses useTasksPage for state and subcomponents for layout.
 */

import TaskFeed from "./components/TaskFeed";
import ListSidebar from "./components/ListSidebar";
import CreateTaskModal from "./components/CreateTaskModal";
import CreateListModal from "./components/CreateListModal";
import { BackToTop } from "../../components/Pagination/Pagination";
import useTasksPage from "./hooks/useTasksPage";
import styles from "./TasksPage.module.css";

function TasksPageLoading() {
  return (
    <div className={styles.loading}>
      <div className={styles.loadingSpinner} aria-hidden />
      <p className={styles.loadingText}>Loading tasks...</p>
    </div>
  );
}

function ToastUndo({ onUndo, onClose }) {
  return (
    <div className={styles.toast}>
      <span>Task added.</span>
      <button type="button" className={styles.toastUndoBtn} onClick={onUndo}>Undo</button>
      <button type="button" className={styles.toastClose} onClick={onClose}>✕</button>
    </div>
  );
}

function ToastDelete({ onClose }) {
  return (
    <div className={`${styles.toast} ${styles.toastDelete}`}>
      <span>🗑 Task deleted.</span>
      <button type="button" className={styles.toastClose} onClick={onClose}>✕</button>
    </div>
  );
}

function ToastInfo({ message, onClose }) {
  return (
    <div className={`${styles.toast} ${styles.toastDelete}`}>
      <span>{message}</span>
      <button type="button" className={styles.toastClose} onClick={onClose}>✕</button>
    </div>
  );
}

function TasksPageToasts({ toastUndo, toastDelete, toastInfo, handleUndoAddTask, setToastUndo, setToastDelete, setToastInfo }) {
  return (
    <>
      {toastUndo && <ToastUndo onUndo={handleUndoAddTask} onClose={() => setToastUndo(null)} />}
      {toastDelete && <ToastDelete onClose={() => setToastDelete(false)} />}
      {toastInfo && <ToastInfo message={toastInfo} onClose={() => setToastInfo(null)} />}
    </>
  );
}

export default function TasksPage() {
  const p = useTasksPage();
  if (p.loading) return <TasksPageLoading />;
  return (
    <div className={styles.page}>
      <ListSidebar {...p.sidebarProps} />
      <TaskFeed {...p.feedProps} />
      {p.showTaskModal && <CreateTaskModal {...p.taskModalProps} />}
      <TasksPageToasts toastUndo={p.toastUndo} toastDelete={p.toastDelete} toastInfo={p.toastInfo} handleUndoAddTask={p.handleUndoAddTask} setToastUndo={p.setToastUndo} setToastDelete={p.setToastDelete} setToastInfo={p.setToastInfo} />
      {p.showListModal && <CreateListModal {...p.listModalProps} />}
      {p.showCreateListFromTask && <CreateListModal {...p.createListFromTaskProps} />}
      <BackToTop />
    </div>
  );
}
