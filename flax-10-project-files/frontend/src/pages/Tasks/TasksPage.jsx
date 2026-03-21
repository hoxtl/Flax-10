/*
 * Tasks page shell with sidebar, feed, modals, and toast feedback.
 */

import TaskFeed from "./components/TaskFeed";
import ListSidebar from "./components/ListSidebar";
import CreateTaskModal from "./components/CreateTaskModal";
import CreateListModal from "./components/CreateListModal";
import { AnimatePresence } from "framer-motion";
import { BackToTop } from "../../components/Pagination/Pagination";
import useTasksPage from "./hooks/useTasksPage";
import AppToast from "../../components/common/AppToast/AppToast";
import styles from "./TasksPage.module.css";

function ToastUndo({ onUndo, onClose }) {
  return (
    <AppToast
      message="Task added."
      actionLabel="Undo"
      onAction={onUndo}
      onClose={onClose}
      variant="success"
    />
  );
}

function ToastDelete({ onClose }) {
  return (
    <AppToast message="Task deleted." onClose={onClose} variant="success" />
  );
}

function ToastInfo({ message, onClose }) {
  const variant = typeof message === "string" && message.toLowerCase().includes("deleted")
    ? "success"
    : "info";
  return (
    <AppToast message={message} onClose={onClose} variant={variant} />
  );
}

function TasksPageToasts({ toastUndo, toastDelete, toastInfo, handleUndoAddTask, setToastUndo, setToastDelete, setToastInfo }) {
  return (
    <AnimatePresence initial={false}>
      {toastUndo && <ToastUndo onUndo={handleUndoAddTask} onClose={() => setToastUndo(null)} />}
      {toastDelete && <ToastDelete onClose={() => setToastDelete(false)} />}
      {toastInfo && <ToastInfo message={toastInfo} onClose={() => setToastInfo(null)} />}
    </AnimatePresence>
  );
}

function SkeletonRows({ count, className, step }) {
  return [...Array(count)].map((_, index) => <div key={index} className={`${styles.skel} ${className}`} style={{ animationDelay: `${index * step}s` }} />);
}

function TasksSkeleton() {
  return (
    <div className={styles.page} data-testid="tasks-skeleton">
      <div className={styles.skelSidebar}>
        <div className={`${styles.skel} ${styles.skelSidebarTitle}`} />
        <SkeletonRows count={3} className={styles.skelSidebarRow} step={0.08} />
        <div className={styles.skelDivider} />
        <SkeletonRows count={4} className={styles.skelSidebarRow} step={0.08} />
      </div>
      <div className={styles.skelFeed}>
        <div className={`${styles.skel} ${styles.skelFeedHeader}`} />
        <SkeletonRows count={5} className={styles.skelTaskRow} step={0.06} />
      </div>
    </div>
  );
}

export default function TasksPage() {
  const p = useTasksPage();
  if (p.loading) return <TasksSkeleton />;
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
