/**
 * Task widget slot.
 */

import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { CheckSquare } from "lucide-react";
import baseStyles from "../styles/WidgetBase.module.css";
import { TaskContextMenu } from "../../Tasks/components/TaskCard";
import { getCategoryStyle, getEstTime, getUrgencyMeta } from "./TaskWidgetUtils";
import { TaskWidgetRow, itemVariants } from "./TaskWidgetRow";
import { TaskWidgetAllDone, TaskWidgetCompletedSection, TaskWidgetEmpty, TaskWidgetHiddenLink } from "./TaskWidgetSections";

export function TaskWidgetSlot(props) {
  const data = useTaskWidgetState(props);
  return (
    <AnimatePresence mode="wait" initial={false}>
      {data.allTasksDone ? <TaskWidgetAllDone itemCount={props.taskWidgetItemsOnly.length} styles={props.styles} /> : <TaskWidgetCard {...props} {...data} />}
    </AnimatePresence>
  );
}

function TaskWidgetCard(props) {
  return (
    <motion.div key="tasks" ref={props.taskWidgetRef} className={props.styles.taskWidgetSlotRoot} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      {props.taskWidgetItemsOnly.length > 0 ? <TaskWidgetContent {...props} /> : <TaskWidgetEmpty styles={props.styles} />}
    </motion.div>
  );
}

function TaskWidgetContent(props) {
  return (
    <>
      <TaskWidgetHeader styles={props.styles} />
      <TaskWidgetList {...props} />
      <TaskWidgetCompletedSection {...props} />
      <TaskWidgetMenu {...props} />
    </>
  );
}

function TaskWidgetHeader({ styles }) {
  return (
    <div className={baseStyles.widgetHeader}>
      <div className={baseStyles.headerIconWrap}><CheckSquare className={baseStyles.headerIcon} size={16} strokeWidth={1.75} aria-hidden /></div>
      <h3 className={baseStyles.headerTitle}>Today&apos;s Tasks</h3>
      <Link to="/tasks?filter=today" className={styles.taskWidgetMoreText}>View all</Link>
    </div>
  );
}

function TaskWidgetList(props) {
  return (
    <motion.ul className={props.styles.taskWidgetTaskList} variants={listVariants} initial="initial" animate="animate" layout>
      {props.visibleIncomplete.map((task, idx) => <TaskListRow key={task.id} idx={idx} task={task} {...props} />)}
      <TaskWidgetHiddenLink hiddenCount={props.hiddenCount} styles={props.styles} />
    </motion.ul>
  );
}

function TaskListRow(props) {
  return <TaskWidgetRow {...props} categoryLabel={props.getTaskCategoryPill?.(props.task)} categoryStyle={getCategoryStyle(props.getTaskCategoryPill?.(props.task))} isOverdue={props.task.taskWidgetStatus === "overdue"} rowAccent={getRowAccent(props.task)} urgency={getUrgencyMeta(props.task)} />;
}

function getRowAccent(task) {
  return task.taskWidgetStatus === "overdue" ? "var(--home-urgency-danger)" : "var(--home-urgency-neutral)";
}

function TaskWidgetMenu({ ctxMenu, onDeleteTask, onEditTask, onInlineTaskEdit, setCtxMenu, taskLists }) {
  if (!ctxMenu) return null;
  return <TaskContextMenu task={ctxMenu.task} lists={taskLists} pos={{ x: ctxMenu.x, y: ctxMenu.y }} onClose={() => setCtxMenu(null)} onEditOpen={() => openEdit(ctxMenu, onEditTask, setCtxMenu)} onDelete={() => deleteTask(ctxMenu, onDeleteTask, setCtxMenu)} onEdit={(patch) => onInlineTaskEdit?.(ctxMenu.task, patch)} />;
}

function openEdit(ctxMenu, onEditTask, setCtxMenu) {
  onEditTask?.(ctxMenu.task);
  setCtxMenu(null);
}

async function deleteTask(ctxMenu, onDeleteTask, setCtxMenu) {
  await onDeleteTask?.(ctxMenu.task);
  setCtxMenu(null);
}

function useTaskWidgetState(props) {
  const [ctxMenu, setCtxMenu] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const taskGroups = useMemo(() => getTaskGroups(props.taskWidgetList, props.row), [props.row, props.taskWidgetList]);
  return { ...taskGroups, ctxMenu, setCtxMenu, showCompleted, setShowCompleted, estimatedLeft: getEstTime(props.taskWidgetList) };
}

function getTaskGroups(taskWidgetList, row) {
  const incompleteTasks = taskWidgetList.filter((task) => !task.completed);
  const completedTasks = taskWidgetList.filter((task) => task.completed);
  const visibleLimit = row === 1 ? 3 : 6;
  return {
    allTasksDone: taskWidgetList.length > 0 && taskWidgetList.every((task) => task.completed),
    completedTasks,
    hiddenCount: Math.max(0, incompleteTasks.length - visibleLimit),
    visibleCompleted: completedTasks.slice(0, 3),
    visibleIncomplete: incompleteTasks.slice(0, visibleLimit),
  };
}

const listVariants = {
  animate: { transition: { staggerChildren: 0.04, delayChildren: 0.04 } },
};
