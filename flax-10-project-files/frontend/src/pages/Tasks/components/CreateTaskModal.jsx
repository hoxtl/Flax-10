/*
 * Modal for creating and editing tasks.
 */

import DateTimePicker from "../../../components/common/inputs/DateTimePicker";
import AnimatedDropdown from "../../../components/common/AnimatedDropdown";
import PrimaryButton from "../../../components/common/PrimaryButton/PrimaryButton";
import { SleepWarningModal } from "../../../components/common/SleepWarningModal";
import StandardModal from "../../../components/common/StandardModal/StandardModal";
import { Trash2, X } from "lucide-react";
import TextInput from "../../../components/common/TextInput/TextInput";

import { useCreateTaskModal } from "../hooks/useCreateTaskModal";

import layoutStyles from "./CreateTaskModalLayout.module.css";
import formStyles from "./CreateTaskModalForm.module.css";
const styles = { ...layoutStyles, ...formStyles };

const PRIORITY_OPTIONS = [
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];
const STUDY_BLOCK_OPTIONS = [
  { value: 1, label: "25m" },
  { value: 2, label: "50m" },
  { value: 3, label: "1h 15m" },
  { value: 4, label: "1h 40m" },
];

function CreateTaskModalHeader({ isEditMode, onClose }) {
  return (
    <div className={styles.header}>
      <h2 className={styles.title}>{isEditMode ? "Edit task" : "New task"}</h2>
      <PrimaryButton type="button" variant="ghost" className={styles.closeBtn} onClick={onClose} aria-label="Close" pill>
        <X size={18} strokeWidth={2.5} />
      </PrimaryButton>
    </div>
  );
}

function CreateTaskModalFooter({ saveError, isEditMode, onDeleteTask, saving, onClose, handleSave, form, handleDelete }) {
  return (
    <div className={styles.footer}>
      {saveError && <p className={styles.saveError} role="alert">{saveError}</p>}
      {isEditMode && onDeleteTask && (
        <PrimaryButton type="button" className={styles.deleteBtn} variant="danger" size="small" onClick={handleDelete} disabled={saving} pill>
          <Trash2 size={15} strokeWidth={2.1} aria-hidden />
          Delete task
        </PrimaryButton>
      )}
      <PrimaryButton type="button" className={styles.cancelBtn} variant="ghost" onClick={onClose} pill>Cancel</PrimaryButton>
      <PrimaryButton type="button" className={styles.saveBtn} onClick={handleSave} disabled={saving || !form.title.trim() || !form.due_date} pill>
        {saving ? "Saving…" : (isEditMode ? "Save" : "Add task")}
      </PrimaryButton>
    </div>
  );
}

function CreateTaskModalTitleDesc({ form, set }) {
  return (
    <div className={styles.canvas}>
      <div className={styles.fieldGroup}>
        <label className={styles.gridLabel} htmlFor="create-task-title">Task name <span className={styles.labelRequired}>*</span></label>
        <TextInput id="create-task-title" className={styles.titleInput} placeholder="What do you need to do?" value={form.title} onChange={(e) => set("title", e.target.value)} autoFocus />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.gridLabel} htmlFor="create-task-desc">Description <span className={styles.labelOptional}>(optional)</span></label>
        <TextInput multiline id="create-task-desc" className={styles.desc} placeholder="Add a description…" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
      </div>
    </div>
  );
}

function CreateTaskModalDateTime({ form, set }) {
  return (
    <div className={styles.timeRow}>
      <div className={styles.dateTimeWrap}>
        <label className={styles.gridLabel}>Due date <span className={styles.labelRequired}>*</span></label>
        <DateTimePicker value={form.due_date} onChange={(val) => set("due_date", val)} placeholder="Select due date" />
      </div>
    </div>
  );
}

function StudyBlockOptions({ form, setForm }) {
  return (
    <div className={styles.chipGroup}>
        {STUDY_BLOCK_OPTIONS.map(({ value, label }) => (
          <button key={value} type="button" className={`${styles.chip} ${form.estimated_blocks === value ? styles.chipActive : ""}`}
            onClick={() => setForm((p) => ({ ...p, estimated_blocks: value }))}
          >
            {label}
          </button>
        ))}
      </div>
  );
}

function CreateTaskModalDuration({ form, setForm, isReadingList }) {
  if (isReadingList) return null;
  return (
    <div className={styles.durationRow}>
      <span className={styles.focusBlocksLabel}>Est. time</span>
        <StudyBlockOptions form={form} setForm={setForm} />
    </div>
  );
}


function CreateTaskModalCategory({ form, categoryOptions, selectedListColor, handleCategoryChange }) {
  return (
    <div className={styles.settingRow}>
      <div className={styles.listWrap}>
        <span className={styles.listWrapLabel}>Category</span>
        {selectedListColor && <span className={styles.listDot} style={{ background: selectedListColor }} />}
        <div className={styles.listDropdownTriggerWrap}>
          <AnimatedDropdown value={form.task_list ? String(form.task_list) : ""} onChange={handleCategoryChange} placeholder="Select list" options={categoryOptions} menuMaxHeight={420} className={styles.listAnimatedDropdown} />
        </div>
      </div>
    </div>
  );
}

function CreateTaskModalPriority({ form, set }) {
  return (
    <div className={styles.settingRow}>
      <div className={styles.rowBlock}>
        <span className={styles.rowLabel}>Priority</span>
        <div className={`${styles.chipGroup} ${styles.chipGroupSingleRow}`}>
          {PRIORITY_OPTIONS.map(({ value, label }) => (
            <button key={value} type="button" className={`${styles.chip} ${form.priority === value ? styles.chipActive : ""}`} onClick={() => set("priority", form.priority === value ? "" : value)}>{label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CreateTaskModalModuleRow({ form, set, sortedModules }) {
  if (sortedModules.length === 0) return null;
  const options = [{ value: "", label: "No module" }, ...sortedModules.map((m) => ({ value: String(m.id), label: `${m.module_code} – ${m.module_name || m.title || ""}` }))];
  return (
    <div className={styles.settingRow}>
      <div className={styles.listWrap}>
        <span className={styles.listWrapLabel}>Module</span>
        <div className={styles.listDropdownTriggerWrap}>
          <AnimatedDropdown value={form.module ? String(form.module) : ""} onChange={(val) => set("module", val)} placeholder="No module" options={options} menuMaxHeight={420} className={styles.listAnimatedDropdown} />
        </div>
      </div>
    </div>
  );
}

function CreateTaskModalScheduleRow({ isEditMode, showAddToScheduleToggle, addToSchedule, setAddToSchedule, addToScheduleLabel }) {
  if (isEditMode || !showAddToScheduleToggle) return null;
  return (
    <div className={styles.scheduleRow}>
      <label className={styles.scheduleLabel}>
        <input type="checkbox" checked={addToSchedule} onChange={(e) => setAddToSchedule(e.target.checked)} className={styles.scheduleCheckbox} />
        <span>{addToScheduleLabel}</span>
      </label>
    </div>
  );
}

function CreateTaskModalBody({ state, addToScheduleLabel }) {
  const { form, set, setForm, categoryOptions, selectedListColor, sortedModules, handleCategoryChange, isEditMode, showAddToScheduleToggle, addToSchedule, setAddToSchedule, isReadingList } = state;
  return (
    <div className={styles.body}>
      <CreateTaskModalTitleDesc form={form} set={set} />
      <CreateTaskModalDateTime form={form} set={set} />
      <CreateTaskModalCategory form={form} categoryOptions={categoryOptions} selectedListColor={selectedListColor} handleCategoryChange={handleCategoryChange} />
      <CreateTaskModalModuleRow form={form} set={set} sortedModules={sortedModules} />
<CreateTaskModalDuration form={form} setForm={setForm} isReadingList={isReadingList}/>
      <CreateTaskModalPriority form={form} set={set} />
      <CreateTaskModalScheduleRow isEditMode={isEditMode} showAddToScheduleToggle={showAddToScheduleToggle} addToSchedule={addToSchedule} setAddToSchedule={setAddToSchedule} addToScheduleLabel={addToScheduleLabel} />
    </div>
  );
}

function CreateTaskModalView({ state, addToScheduleLabel, onDeleteTask }) {
  const { handleKey, onClose, isEditMode, handleSave, handleDelete, saveError, saving, form } = state;
  return (
    <StandardModal
      onClose={onClose}
      hideHeader
      size="xl"
      modalClassName={styles.modalShell}
      contentClassName={styles.modalContent}
    >
      <div onKeyDown={handleKey}>
        <CreateTaskModalHeader isEditMode={isEditMode} onClose={onClose} />
        <CreateTaskModalBody state={state} addToScheduleLabel={addToScheduleLabel} />
        <CreateTaskModalFooter saveError={saveError} isEditMode={isEditMode} onDeleteTask={onDeleteTask} saving={saving} onClose={onClose} handleSave={handleSave} form={form} handleDelete={handleDelete} />
      </div>
    </StandardModal>
  );
}

export default function CreateTaskModal(props) {
  const state = useCreateTaskModal(props);
  return (
    <>
      <CreateTaskModalView state={state} addToScheduleLabel={props.addToScheduleLabel ?? "Add to today's schedule"} onDeleteTask={props.onDeleteTask} />
      {state.sleepWarning && <SleepWarningModal {...state.sleepWarningProps} />}
    </>
  );
}
