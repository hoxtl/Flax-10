/**
 * Modal for creating and editing tasks. Uses useCreateTaskModal for state.
 */

import { createPortal } from "react-dom";

import DateTimePicker from "../../../components/common/inputs/DateTimePicker";
import AnimatedDropdown from "../../../components/common/AnimatedDropdown";
import FormField from "../../../components/common/FormField/FormField";
import PrimaryButton from "../../../components/common/PrimaryButton/PrimaryButton";
import { SleepWarningModal } from "../../../components/common/SleepWarningModal";
import StandardModal from "../../../components/common/StandardModal/StandardModal";
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
      <PrimaryButton type="button" variant="ghost" className={styles.closeBtn} onClick={onClose} aria-label="Close" pill>✕</PrimaryButton>
    </div>
  );
}

function CreateTaskModalFooter({ saveError, isEditMode, onDeleteTask, saving, onClose, handleSave, form, handleDelete }) {
  return (
    <div className={styles.footer}>
      {saveError && <p className={styles.saveError} role="alert">{saveError}</p>}
      {isEditMode && onDeleteTask && (
        <PrimaryButton type="button" className={styles.deleteBtn} variant="danger" onClick={handleDelete} disabled={saving} pill>Delete task</PrimaryButton>
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
      <FormField htmlFor="create-task-title" label={<>Task name <span className={styles.labelRequired}>*</span></>} className={styles.fieldGroup}>
        <TextInput id="create-task-title" className={styles.titleInput} placeholder="What do you need to do?" value={form.title} onChange={(e) => set("title", e.target.value)} autoFocus />
      </FormField>
      <FormField htmlFor="create-task-desc" label="Description" className={styles.fieldGroup}>
        <TextInput multiline id="create-task-desc" className={styles.desc} placeholder="Optional" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
      </FormField>
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

function CreateTaskModalDuration({ form, setForm }) {
  return (
    <div className={styles.durationRow}>
      <span className={styles.focusBlocksLabel}>Est. time</span>
      <div className={styles.chipGroup}>
        {STUDY_BLOCK_OPTIONS.map(({ value, label }) => (
          <button key={value} type="button" className={`${styles.chip} ${form.estimated_blocks === value ? styles.chipActive : ""}`} onClick={() => setForm((p) => ({ ...p, estimated_blocks: value }))}>{label}</button>
        ))}
      </div>
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

function CreateTaskModalCategoryPriority({ form, set, categoryOptions, selectedListColor, handleCategoryChange }) {
  return (
    <div className={styles.settingsStack}>
      <CreateTaskModalCategory form={form} categoryOptions={categoryOptions} selectedListColor={selectedListColor} handleCategoryChange={handleCategoryChange} />
      <CreateTaskModalPriority form={form} set={set} />
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
  const { form, set, setForm, categoryOptions, selectedListColor, askFlaxInitialMessage, sortedModules, handleCategoryChange, isEditMode, showAddToScheduleToggle, addToSchedule, setAddToSchedule } = state;
  return (
    <div className={styles.body}>
      <CreateTaskModalTitleDesc form={form} set={set} />
      <CreateTaskModalDateTime form={form} set={set} />
      <CreateTaskModalCategory form={form} categoryOptions={categoryOptions} selectedListColor={selectedListColor} handleCategoryChange={handleCategoryChange} />
      <CreateTaskModalModuleRow form={form} set={set} sortedModules={sortedModules} />
      <CreateTaskModalDuration form={form} setForm={setForm} />
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
      backdropClassName={styles.modalBackdrop}
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
  return createPortal(
    <>
      <CreateTaskModalView state={state} addToScheduleLabel={props.addToScheduleLabel ?? "Add to today's schedule"} onDeleteTask={props.onDeleteTask} />
      {state.sleepWarning && <SleepWarningModal {...state.sleepWarningProps} />}
    </>,
    document.body
  );
}
