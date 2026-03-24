/*
 * Task widget slot.
 */
import { AnimatePresence, motion as Motion } from "framer-motion";
import { useMemo, useState } from "react";
import { CheckSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PrimaryButton from "../../../components/Common/PrimaryButton/PrimaryButton";
import widgetStyles from "../../Modules/DashboardWidgets.module.css";
import rowStyles from "../../Modules/DashboardRows.module.css";
import { TaskContextMenu } from "../../Tasks/components/TaskCard";
import { TaskWidgetRow } from "./TaskWidgetRow";
import { TaskWidgetAllDone, TaskWidgetCompletedSection, TaskWidgetEmpty } from "./TaskWidgetSections";
import { ShowMoreButton } from "../../../components/Modules/shared/widgetParts.jsx";
import {
  expandBodyVariants,
  listVariants,
} from "../../../components/Modules/shared/widgetVariants.js";

const styles = { ...widgetStyles, ...rowStyles };

export function TaskWidgetSlot(props) {
  const data = useTaskWidgetState(props);
  return (
    <AnimatePresence mode="wait" initial={false}>
      {data.allTasksDone
        ? <TaskWidgetAllDone itemCount={props.taskWidgetItemsOnly.length} styles={props.styles} />
        : <TaskWidgetCard {...props} {...data} />}
    </AnimatePresence>
  );
}

function TaskWidgetCard(props) {
  const { styles: taskStyles, taskWidgetItemsOnly, taskWidgetRef, ...contentProps } = props;
  return (
    <Motion.div
      key="tasks"
      ref={taskWidgetRef}
      className={taskStyles.taskWidgetSlotRoot}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {taskWidgetItemsOnly.length > 0 ? (
        <TaskWidgetContent styles={taskStyles} taskWidgetItemsOnly={taskWidgetItemsOnly} {...contentProps} />
      ) : (
        <TaskWidgetEmpty styles={taskStyles} />
      )}
    </Motion.div>
  );
}

function TaskWidgetContent(props) {
  return (
    <div className={props.styles.taskWidgetContent}>
      <TaskWidgetHeader count={props.taskWidgetDueTodayCount} taskStyles={props.styles} />
      <TaskWidgetList {...props} />
      <TaskWidgetCompletedSection {...props} />
      <TaskWidgetMenu {...props} />
    </div>
  );
}

function TaskWidgetHeader({ count, taskStyles }) {
  const navigate = useNavigate();
  return (
    <div className={`${styles.widgetHeader} ${taskStyles.taskWidgetWidgetHeader}`}>
      <div className={styles.widgetIconWrap}><CheckSquare size={17} strokeWidth={1.85} aria-hidden /></div>
      <span className={styles.widgetTitle}>Today&apos;s Tasks</span>
      <PrimaryButton type="button" size="small" pill onClick={() => navigate("/tasks?filter=today")} className={taskStyles.taskWidgetHeaderButton}>Go to all tasks</PrimaryButton>
      {count > 0 && <span className={`${styles.widgetCount} ${taskStyles.taskWidgetHeaderCount}`}>{count}</span>}
    </div>
  );
}

function ExpandedTaskRows({ extraTasks, ...props }) {
  return (
    <Motion.div className={styles.expandableRows} variants={expandBodyVariants} initial="collapsed" animate="expanded" exit="collapsed">
      <Motion.div className={styles.expandableRowsInner} initial="hidden" animate="visible" variants={listVariants}>
        {extraTasks.map((task) => <TaskListRow key={task.id} task={task} {...props} />)}
      </Motion.div>
    </Motion.div>
  );
}

function TaskWidgetList(props) {
  return (
    <Motion.div className={`${styles.widgetList} ${props.styles.taskWidgetWidgetList}`} initial="hidden" animate="visible" variants={listVariants}>
      {props.initialTasks.map((task, index) => <TaskListRow key={task.id} task={task} index={index} {...props} />)}
      <AnimatePresence initial={false}>
        {props.expanded && <ExpandedTaskRows extraTasks={props.extraTasks} {...props} />}
      </AnimatePresence>
      {props.extraTasks.length > 0 && <ShowMoreButton expanded={props.expanded} hiddenCount={props.extraTasks.length} onToggle={() => props.setExpanded((prev) => !prev)} styles={styles} />}
    </Motion.div>
  );
}

function TaskListRow(props) {
  const isLeadTask = props.index === 0;
  return (
    <TaskWidgetRow
      {...props}
      isOverdue={props.task.taskWidgetStatus === "overdue"}
      rowAccent={getRowAccent(props.task, isLeadTask)}
      urgentGlow={isLeadTask || props.task.taskWidgetUrgentGlow}
    />
  );
}

function getRowAccent(task, isLeadTask = false) {
  const priority = String(task?.priority || "").toLowerCase();
  if (isLeadTask || task.taskWidgetStatus === "overdue" || priority === "urgent") return "var(--home-urgency-danger)";
  if (priority === "high" || priority === "medium") return "var(--home-urgency-warning)";
  return "var(--home-urgency-neutral)";
}

function TaskWidgetMenu({ ctxMenu, onDeleteTask, onEditTask, onInlineTaskEdit, setCtxMenu, taskLists }) {
  if (!ctxMenu) return null;
  return (
    <TaskContextMenu
      task={ctxMenu.task}
      lists={taskLists}
      pos={{ x: ctxMenu.x, y: ctxMenu.y }}
      onClose={() => setCtxMenu(null)}
      onEditOpen={() => openEdit(ctxMenu, onEditTask, setCtxMenu)}
      onDelete={() => deleteTask(ctxMenu, onDeleteTask, setCtxMenu)}
      onEdit={(patch) => onInlineTaskEdit?.(ctxMenu.task, patch)}
    />
  );
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
  const [expanded, setExpanded] = useState(false);
  const taskGroups = useMemo(() => getTaskGroups(props.taskWidgetList, props.row), [props.row, props.taskWidgetList]);
  return { ...taskGroups, ctxMenu, setCtxMenu, expanded, setExpanded, showCompleted, setShowCompleted };
}

function getTaskGroups(taskWidgetList, row) {
  const incompleteTasks = taskWidgetList.filter((task) => !task.completed);
  const completedTasks = taskWidgetList.filter((task) => task.completed);
  const visibleLimit = row === 1 ? 5 : 6;
  return {
    allTasksDone: taskWidgetList.length > 0 && taskWidgetList.every((task) => task.completed),
    completedTasks,
    initialTasks: incompleteTasks.slice(0, visibleLimit),
    extraTasks: incompleteTasks.slice(visibleLimit),
    visibleCompleted: completedTasks,
  };
}
