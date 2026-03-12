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
