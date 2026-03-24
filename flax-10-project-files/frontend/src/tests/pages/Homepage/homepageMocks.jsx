// Shared mock components for Homepage tests

export const IntelligenceRowMock = ({ displayName, slot1TodayTasks, slot3Urgent, slot6Timeline }) => (
  <div data-testid="intelligence-row">
    <div data-testid="display-name">{displayName || 'anon'}</div>
    <div data-testid="slot1">{slot1TodayTasks}</div>
    <div data-testid="slot3">{slot3Urgent}</div>
    <div data-testid="slot6">{slot6Timeline}</div>
  </div>
);

export const TaskWidgetSlotMock = ({ handleTaskWidgetComplete, onStartFocus, getTaskCategoryPill, getTaskCategoryColor, onEditTask, onDeleteTask, onInlineTaskEdit }) => (
  <div data-testid="task-widget-slot">
    <button type="button" onClick={() => handleTaskWidgetComplete({ id: 'task-1', title: 'Task A', completed: false, task_list: 123, tag: 1 })}>complete-task</button>
    <button type="button" onClick={() => onStartFocus?.()}>start-focus</button>
    <button type="button" onClick={() => onEditTask?.({ id: 1 })}>edit-task</button>
    <button type="button" onClick={() => onDeleteTask?.({ id: 1 })}>delete-task</button>
    <button type="button" onClick={() => onInlineTaskEdit?.({ id: 1 }, { title: 'X' })}>inline-edit</button>
    <div data-testid="pill">{getTaskCategoryPill?.({ task_list: 123, tag: 1 })}</div>
    <div data-testid="pill-null">{getTaskCategoryPill?.({ task_list: 999 }) ?? 'null'}</div>
    <div data-testid="pill-module-code">{getTaskCategoryPill?.({ module_code: 'XY1' }) ?? 'null'}</div>
    <div data-testid="pill-module-id">{getTaskCategoryPill?.({ module_id: 10 }) ?? 'null'}</div>
    <div data-testid="color">{getTaskCategoryColor?.({ tag: 1 })}</div>
    <div data-testid="color-flax">{getTaskCategoryColor?.({})}</div>
    <div data-testid="color-module">{getTaskCategoryColor?.({ module_code: 'CS101' })}</div>
  </div>
);

export const DeadlinesWidgetMock = ({ deadlines, onSelectDeadline, onSelectModule }) => (
  <div data-testid="deadlines-count">deadlines:{(deadlines || []).length}
    <button type="button" onClick={() => onSelectDeadline?.({ id: 1, assessment_title: 'Essay', start_due_date: new Date().toISOString(), module_code: 'AB1', deadline_type: 'assignment', description: 'D', location: 'Room 1', module_id: 10 })}>select-deadline</button>
    <button type="button" onClick={() => onSelectDeadline?.({ id: 2, assessment_title: 'Exam', start_due_date: new Date().toISOString(), module_code: 'XY' })}>select-deadline-code-only</button>
    <button type="button" onClick={() => onSelectModule?.({ code: 'AB1', id: 10, name: 'Module A' })}>select-module</button>
  </div>
);

export const EditTaskModalMock = ({ task, onSave, onDelete, onClose }) => (
  <div data-testid="edit-task-modal">
    <button type="button" onClick={() => onSave?.({ title: task?.title })}>edit-modal-save</button>
    <button type="button" onClick={() => onDelete?.()}>edit-modal-delete</button>
    <button type="button" onClick={onClose}>edit-modal-close</button>
  </div>
);

export const MiniTimelineMock = ({ sortedEvents, onQuickStart, onTaskToggle, onCardClick, onEdit, onConflictAutoMove, onPushTomorrow, onDelete, onReschedule, onToggleComplete }) => (
  <div data-testid="mini-timeline">events:{(sortedEvents || []).length}
    <button type="button" onClick={() => onQuickStart?.(new Date(), 25, { id: 1, title: 'T', estimated_blocks: 1 })}>quick-start</button>
    <button type="button" onClick={() => onQuickStart?.(new Date(), 25, null)}>quick-start-no-task</button>
    <button type="button" onClick={() => onTaskToggle?.({ id: 1 }, true)}>task-toggle</button>
    <button type="button" onClick={() => onCardClick?.({ id: 1, title: 'E' })}>card-click</button>
    <button type="button" onClick={() => onCardClick?.(null)}>card-click-null</button>
    <button type="button" onClick={() => onEdit?.({ id: 1 })}>timeline-edit</button>
    <button type="button" onClick={() => onConflictAutoMove?.({ id: 1 }, new Date(), new Date())}>conflict-auto-move</button>
    <button type="button" onClick={() => onPushTomorrow?.({ id: 1, start_time: new Date().toISOString(), end_time: new Date().toISOString(), title: 'E' })}>push-tomorrow</button>
    <button type="button" onClick={() => onPushTomorrow?.({ id: 1 })}>push-tomorrow-no-time</button>
    <button type="button" onClick={() => onDelete?.({ id: 1, title: 'E' })}>timeline-delete</button>
    <button type="button" onClick={() => onDelete?.({ id: 'ev-1', source: 'task', external_id: 99, title: 'Task Event' })}>timeline-delete-task</button>
    <button type="button" onClick={() => onReschedule?.({ id: 1, start_time: new Date().toISOString(), end_time: new Date().toISOString(), title: 'E' })}>reschedule</button>
    <button type="button" onClick={() => onToggleComplete?.(1)}>toggle-complete</button>
  </div>
);

export const HomepageTimelineSectionMock = ({ sortedEvents, handleReplanDay, missedItems, overdueTasksForNow, replanLoading, handleQuickStartGap, handleTaskToggle, openTimelinePopup, openModal, handleConflictAutoMove, handleConflictPushTomorrow, handleTimelineDelete, handleReschedule, setCompletedEventIds }) => (
  <div data-testid="homepage-timeline-section">
    {handleReplanDay && (
      <button
        type="button"
        aria-label="Re-plan overdue and missed items into free windows"
        onClick={handleReplanDay}
        disabled={replanLoading || (!missedItems?.length && !overdueTasksForNow?.length)}
      >
        {replanLoading ? 'Re-planning...' : 'Re-plan'}
      </button>
    )}
    <MiniTimelineMock
      sortedEvents={sortedEvents}
      onQuickStart={handleQuickStartGap}
      onTaskToggle={handleTaskToggle}
      onCardClick={openTimelinePopup}
      onEdit={(event) => openModal?.(event, event?.tag)}
      onConflictAutoMove={handleConflictAutoMove}
      onPushTomorrow={handleConflictPushTomorrow}
      onDelete={handleTimelineDelete}
      onReschedule={handleReschedule}
      onToggleComplete={(eventId) => setCompletedEventIds?.((prev) => {
        const next = new Set(prev);
        if (next.has(eventId)) next.delete(eventId); else next.add(eventId);
        return next;
      })}
    />
  </div>
);

export const CreateTaskModalMock = ({ onSave, onClose, onOpenCreateList }) => (
  <div data-testid="create-task-modal">
    <button type="button" onClick={() => onSave({ title: 'New Task' }, {})}>create-task-save</button>
    <button type="button" onClick={() => onSave({ title: 'breakfast' }, {})}>create-task-routine</button>
    <button type="button" onClick={() => onSave({ title: 'Task', estimated_blocks: 2 }, { addToSchedule: true })}>create-task-with-schedule</button>
    <button type="button" onClick={onOpenCreateList}>create-task-open-list</button>
    <button type="button" onClick={onClose}>create-task-close</button>
  </div>
);

export const CreateListModalMock = ({ onSave, onClose }) => (
  <div data-testid="create-list-modal">
    <button type="button" onClick={() => onSave({ name: 'My List' })}>create-list-save</button>
    <button type="button" onClick={onClose}>create-list-close</button>
  </div>
);

export const PlanReadDetailModalMock = ({ item, onClose, onEditTask, onDeleteTask, onEditEvent, onDeleteEvent }) => (
  <div data-testid="plan-read-detail-modal">
    <button type="button" onClick={onClose}>plan-read-close</button>
    <button type="button" onClick={() => item?.task && onEditTask?.(item.task)}>plan-read-edit-task</button>
    <button type="button" onClick={() => item?.task && onDeleteTask?.(item.task)}>plan-read-delete-task</button>
    <button type="button" onClick={() => item?.event && onEditEvent?.(item.event)}>plan-read-edit-event</button>
    <button type="button" onClick={() => item?.event && onDeleteEvent?.(item.event)}>plan-read-delete-event</button>
  </div>
);
