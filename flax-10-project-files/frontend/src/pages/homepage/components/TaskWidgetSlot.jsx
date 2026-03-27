import { AnimatePresence, motion as Motion } from "framer-motion";
import { useMemo, useState } from "react";
import { CheckSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PrimaryButton from "../../../components/common/primary_button/PrimaryButton";
import WidgetHeader from "../../../components/common/widget_header/WidgetHeader";
import widgetStyles from "../../modules/styles/DashboardWidgets.module.css";
import rowStyles from "../../modules/styles/DashboardRows.module.css";
import { TaskContextMenu } from "../../tasks/components/TaskCard";
import { TaskWidgetRow } from "./TaskWidgetRow";
import { TaskWidgetAllDone, TaskWidgetCompletedSection, TaskWidgetEmpty } from "./TaskWidgetSections";
import { isReadingList } from "../../tasks/utils/readingListUtils";
import { ShowMoreButton } from "../../../components/modules/shared/widgetParts.jsx";
import { useTaskWidgetState } from "./useTaskWidgetState";
import {
  expandBodyVariants,
  listVariants,
} from "../../../components/modules/shared/widgetVariants.js";

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
      <TaskWidgetHeaderSection styles={props.styles} count={props.taskWidgetDueTodayCount} />
      <TaskWidgetList {...props} />
      <TaskWidgetCompletedSection {...props} />
      <TaskWidgetMenu {...props} />
    </div>
  );
}

function TaskWidgetHeaderSection({ styles: s, count }) {
  return (
    <WidgetHeader
      icon={CheckSquare}
      title="Today's Tasks"
      count={count}
      actions={<GoToTasksButton styles={s} />}
      className={s.taskWidgetWidgetHeader}
    />
  );
}

function GoToTasksButton({ styles: s }) {
  const navigate = useNavigate();
  return (
    <PrimaryButton
      type="button"
      size="small"
      pill
      onClick={() => navigate("/tasks?filter=today")}
      className={s.taskWidgetHeaderButton}
    >
      Go to all tasks
    </PrimaryButton>
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
  const list = (props.taskLists || []).find((l) => String(l.id) === String(props.task.task_list));
  const isReading = list && isReadingList(list);
  return (
    <TaskWidgetRow
      {...props}
      isReadingTask={isReading}
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
  const list = (taskLists || []).find((l) => String(l.id) === String(ctxMenu.task.task_list));
  const isReading = list && isReadingList(list);
  return (
    <TaskContextMenu
      task={ctxMenu.task}
      lists={taskLists}
      pos={{ x: ctxMenu.x, y: ctxMenu.y }}
      onClose={() => setCtxMenu(null)}
      onEditOpen={() => openEdit(ctxMenu, onEditTask, setCtxMenu)}
      onDelete={() => deleteTask(ctxMenu, onDeleteTask, setCtxMenu)}
      onEdit={(patch) => onInlineTaskEdit?.(ctxMenu.task, patch)}
      isReadingTask={isReading}
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
