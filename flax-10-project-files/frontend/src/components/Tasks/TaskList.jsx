import { Reorder, AnimatePresence } from "framer-motion";
import panelStyles from "./TaskPanel.module.css";
import sectionStyles from "./TaskSection.module.css";
import { UrgentSection, OthersSection, DoneSection } from "./TaskSection";

export default function TaskList({
  isEmpty,
  activePinned,
  urgentActive,
  otherActive,
  doneItems,
  onReorder,
  editingId,
  editText,
  setEditText,
  taskMenuId,
  onToggleDone,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onDotsClick,
  onToggleUrgent,
  onDelete,
  taskMenuRef,
  taskMenuPos,
}) {
  return (
    <div className={panelStyles.list}>
      {isEmpty && <EmptyState />}

      <Reorder.Group
        axis="y"
        values={activePinned}
        onReorder={onReorder}
        className={sectionStyles.reorderGroup}
      >
        <AnimatePresence>
          <UrgentSection
            items={urgentActive}
            editingId={editingId}
            editText={editText}
            setEditText={setEditText}
            taskMenuId={taskMenuId}
            onToggleDone={onToggleDone}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            onStartEdit={onStartEdit}
            onDotsClick={onDotsClick}
            onToggleUrgent={onToggleUrgent}
            onDelete={onDelete}
            taskMenuRef={taskMenuRef}
            taskMenuPos={taskMenuPos}
          />

          <OthersSection
            items={otherActive}
            editingId={editingId}
            editText={editText}
            setEditText={setEditText}
            taskMenuId={taskMenuId}
            onToggleDone={onToggleDone}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            onStartEdit={onStartEdit}
            onDotsClick={onDotsClick}
            onToggleUrgent={onToggleUrgent}
            onDelete={onDelete}
            taskMenuRef={taskMenuRef}
            taskMenuPos={taskMenuPos}
          />
        </AnimatePresence>
      </Reorder.Group>

      <DoneSection
        items={doneItems}
        taskMenuId={taskMenuId}
        onToggleDone={onToggleDone}
        onDotsClick={onDotsClick}
        onToggleUrgent={onToggleUrgent}
        onDelete={onDelete}
        taskMenuRef={taskMenuRef}
        taskMenuPos={taskMenuPos}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className={panelStyles.emptyState}>
      No tasks yet. Add one below!
    </div>
  );
}