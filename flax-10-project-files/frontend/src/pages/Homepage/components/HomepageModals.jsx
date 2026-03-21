<<<<<<< HEAD
/**
 * Homepage modal collection.
 */

import { extractBaseEventId } from "../../../components/calendar/utils/eventUtils";
import { isToday } from "../../../components/calendar/utils/dateUtils";
import CreateTaskModal from "../../tasks/components/CreateTaskModal";
import CreateListModal from "../../tasks/components/CreateListModal";
import { EditTaskModal } from "../../tasks/components/TaskCard";
import { PlanReadDetailModal } from "./PlanReadDetailModal";

function findRoutineTag(tags, title) {
  return /breakfast|lunch|dinner|sleep|brunch|coffee|meal\s*prep/i.test((title || "").toLowerCase())
    ? (tags || []).find((tag) => (tag.label || tag.name) === "Routine")
    : null;
}

async function saveHomepageTask(props, data, opts) {
  const taskData = { ...data };
  const routineTag = findRoutineTag(props.tags, data.title);
  if (routineTag) taskData.tag = routineTag.id;
  const created = await props.createTask(taskData);
  props.refetchTasks();
  if (opts?.addToSchedule && created) await addTaskToSchedule(props, created, data);
  props.showToast(opts?.addToSchedule && created ? `"${created.title}" added to today's schedule` : "Task added");
}

async function addTaskToSchedule(props, created, data) {
  const start = new Date(props.selectedDate);
  const end = new Date(start.getTime() + (data.estimated_blocks || 1) * 25 * 60000);
  start.setHours(9, 0, 0, 0);
  await props.addEvent({ title: created.title, start_time: start.toISOString(), end_time: end.toISOString(), description: created.description || "" });
}

export function HomepageModals(props) {
  return (
    <>
      <CreateTaskSheet {...props} />
      <CreateListSheet {...props} />
      <EditTaskSheet {...props} />
      <PlanReadSheet {...props} />
    </>
  );
}

function CreateTaskSheet(props) {
  if (!props.showCreateTaskModal) return null;

  return (
    <CreateTaskModal
      lists={props.taskLists}
      modules={props.enrolledModules}
      onOpenCreateList={() => props.setShowCreateListFromTask(true)}
      newListIdCreated={props.lastCreatedListId}
      onSave={async (data, opts) => closeCreateTask(props, data, opts)}
      onClose={() => resetCreateTask(props)}
      showAddToScheduleToggle={isToday(props.selectedDate)}
      addToScheduleLabel="Add to today's schedule"
    />
  );
}

async function closeCreateTask(props, data, opts) {
  try {
    await saveHomepageTask(props, data, opts);
  } catch {
    props.showToast("Couldn't add task. Try again.");
  }
  props.setShowCreateTaskModal(false);
}

function resetCreateTask(props) {
  props.setShowCreateTaskModal(false);
  props.setLastCreatedListId(null);
}

function CreateListSheet(props) {
  if (!props.showCreateListFromTask) return null;

  return (
    <CreateListModal
      onSave={async (data) => saveTaskList(props, data)}
      onClose={() => props.setShowCreateListFromTask(false)}
    />
  );
}

async function saveTaskList(props, data) {
  const created = await props.createTaskList(data);
  const list = await props.fetchTaskLists();
  props.setTaskLists(Array.isArray(list) ? list : []);
  if (created?.id) props.setLastCreatedListId(created.id);
  props.setShowCreateListFromTask(false);
}

function EditTaskSheet(props) {
  if (!props.rescheduleTask) return null;

  return (
    <EditTaskModal
      task={props.rescheduleTask}
      onSave={async (data) => saveEditedTask(props, data)}
      onDelete={async () => deleteEditedTask(props)}
      onClose={() => props.setRescheduleTask(null)}
    />
  );
}

async function saveEditedTask(props, data) {
  try {
    await props.updateTask(props.rescheduleTask.id, data);
    props.refetchTasks();
    props.setRescheduleTask(null);
  } catch {}
}

async function deleteEditedTask(props) {
  try {
    await props.deleteTask(props.rescheduleTask.id);
    props.refetchTasks();
    props.setRescheduleTask(null);
  } catch {}
}

function PlanReadSheet(props) {
  if (!props.planTimelineReadItem) return null;

  return (
    <PlanReadDetailModal
      item={props.planTimelineReadItem}
      styles={props.styles}
      onClose={() => props.setPlanTimelineReadItem(null)}
      onEditTask={props.setRescheduleTask}
      onDeleteTask={async (task) => deletePlanTask(props, task)}
      onEditEvent={(event) => props.openModal({ ...event, id: extractBaseEventId(event.id) }, event.tag)}
      onDeleteEvent={async (event) => props.handleTimelineDelete(event)}
    />
  );
}

async function deletePlanTask(props, task) {
  await props.deleteTask(task.id);
  props.refetchTasks();
}
=======
import { extractBaseEventId } from "../../../components/Calendar/utils/eventUtils";
import { isToday } from "../../../components/Calendar/utils/dateUtils";

import CreateTaskModal from "../../Tasks/components/CreateTaskModal";
import CreateListModal from "../../Tasks/components/CreateListModal";
import { EditTaskModal } from "../../Tasks/components/TaskCard";
import { PlanReadDetailModal } from "./PlanReadDetailModal";

export function HomepageModals({
  showCreateTaskModal,
  setShowCreateTaskModal,
  showCreateListFromTask,
  setShowCreateListFromTask,
  taskLists,
  enrolledModules,
  tags,
  lastCreatedListId,
  setLastCreatedListId,
  createTask,
  refetchTasks,
  addEvent,
  showToast,
  selectedDate,
  rescheduleTask,
  setRescheduleTask,
  updateTask,
  deleteTask,
  planTimelineReadItem,
  setPlanTimelineReadItem,
  handleTimelineDelete,
  openModal,
  createTaskList,
  setTaskLists,
  fetchTaskLists,
  styles,
}) {
  return (
    <>
      {showCreateTaskModal && (
        <CreateTaskModal
          lists={taskLists}
          modules={enrolledModules}
          onOpenCreateList={() => setShowCreateListFromTask(true)}
          newListIdCreated={lastCreatedListId}
          onSave={async (data, opts) => {
            try {
              const dataToSend = { ...data };
              const titleLower = (data.title || "").toLowerCase();
              if (/breakfast|lunch|dinner|sleep|brunch|coffee|meal\s*prep/i.test(titleLower)) {
                const routineTag = (tags || []).find((t) => (t.label || t.name) === "Routine");
                if (routineTag) dataToSend.tag = routineTag.id;
              }
              const created = await createTask(dataToSend);
              refetchTasks();
              if (opts?.addToSchedule && created) {
                const start = new Date(selectedDate);
                start.setHours(9, 0, 0, 0);
                const mins = (data.estimated_blocks || 1) * 25;
                const end = new Date(start.getTime() + mins * 60000);
                await addEvent({
                  title: created.title,
                  start_time: start.toISOString(),
                  end_time: end.toISOString(),
                  description: created.description || "",
                });
              }
              showToast(opts?.addToSchedule && created ? `"${created.title}" added to today's schedule` : "Task added");
            } catch {
              showToast("Couldn't add task. Try again.");
            }
            setShowCreateTaskModal(false);
          }}
          onClose={() => { setShowCreateTaskModal(false); setLastCreatedListId(null); }}
          showAddToScheduleToggle={isToday(selectedDate)}
          addToScheduleLabel="Add to today's schedule"
        />
      )}

      {showCreateListFromTask && (
        <CreateListModal
          onSave={async (data) => {
            const created = await createTaskList(data);
            const list = await fetchTaskLists();
            setTaskLists(Array.isArray(list) ? list : []);
            if (created?.id) setLastCreatedListId(created.id);
            setShowCreateListFromTask(false);
          }}
          onClose={() => setShowCreateListFromTask(false)}
        />
      )}

      {rescheduleTask && (
        <EditTaskModal
          task={rescheduleTask}
          onSave={async (data) => {
            try {
              await updateTask(rescheduleTask.id, data);
              refetchTasks();
              setRescheduleTask(null);
            } catch (_) { }
          }}
          onDelete={async () => {
            try {
              await deleteTask(rescheduleTask.id);
              refetchTasks();
              setRescheduleTask(null);
            } catch (_) { }
          }}
          onClose={() => setRescheduleTask(null)}
        />
      )}

      {planTimelineReadItem && (
        <PlanReadDetailModal
          item={planTimelineReadItem}
          styles={styles}
          onClose={() => setPlanTimelineReadItem(null)}
          onEditTask={(task) => {
            setRescheduleTask(task);
          }}
          onDeleteTask={async (task) => {
            await deleteTask(task.id);
            refetchTasks();
          }}
          onEditEvent={(ev) => {
            openModal({ ...ev, id: extractBaseEventId(ev.id) }, ev.tag);
          }}
          onDeleteEvent={async (ev) => {
            await handleTimelineDelete(ev);
          }}
        />
      )}
    </>
  );
}
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
