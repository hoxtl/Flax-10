/**
 * Quick-add task bar: input row and expandable options (est. time, module, list).
 * Uses useCreateTaskBar for state and subcomponents for UI.
 */

import AnimatedDropdown from "../../../components/ui/AnimatedDropdown";
import { SleepWarningModal } from "../../../components/common/SleepWarningModal";
import useCreateTaskBar from "../hooks/useCreateTaskBar";
import styles from "./CreateTaskBar.module.css";

const DURATION_OPTIONS = [
  { value: 1, label: "25m", ariaLabel: "25 minutes (1 Pomodoro block)" },
  { value: 2, label: "50m", ariaLabel: "50 minutes (2 Pomodoro blocks)" },
];

function CreateTaskBarInput({ styles: s, title, setTitle, saving, inputRef, externalInputRef, setInputFocused, onBlur, onKeyDown }) {
  return (
    <div className={s.inputRow}>
      <input ref={externalInputRef ?? inputRef} type="text" className={s.input} placeholder="Quick add: what needs to be done?" value={title} onChange={(e) => setTitle(e.target.value)} onFocus={() => setInputFocused(true)} onBlur={onBlur} onKeyDown={onKeyDown} aria-label="Quick add task" />
      {title.trim() && <button type="submit" className={s.addBtn} disabled={saving || !title.trim()} aria-label="Add task">{saving ? "…" : "Add"}</button>}
    </div>
  );
}

function DurationGroup({ styles: s, estimatedBlocks, setEstimatedBlocks }) {
  return (
    <>
      <span className={s.optionsRowLabel}>Est. time</span>
      <div className={s.durationGroup} role="group" aria-label="Estimated duration">
        {DURATION_OPTIONS.map(({ value, label, ariaLabel }) => (
          <button key={value} type="button" className={`${s.durationBtn} ${estimatedBlocks === value ? s.durationBtnActive : ""}`} onClick={() => setEstimatedBlocks(value)} aria-label={ariaLabel} aria-pressed={estimatedBlocks === value}>{label}</button>
        ))}
      </div>
    </>
  );
}

function CreateTaskBarOptions({ styles: s, showOptions, estimatedBlocks, setEstimatedBlocks, moduleId, setModuleId, taskListId, setTaskListId, sortedLists, moduleOptions, listOptions }) {
  return (
    <div className={s.optionsRowWrapper}>
      <div className={`${s.optionsRow} ${showOptions ? s.optionsRowOpen : ""}`}>
        <DurationGroup styles={s} estimatedBlocks={estimatedBlocks} setEstimatedBlocks={setEstimatedBlocks} />
        <span className={s.optionsRowDivider} aria-hidden />
        <span className={s.optionsRowLabel}>Module</span>
        <div className={`${s.dropdownWrap} ${s.moduleDropdownWrap}`}>
          <AnimatedDropdown value={moduleId ?? ""} onChange={(v) => setModuleId(v === "" ? null : v)} placeholder="Module" options={moduleOptions} className={s.moduleListDropdown} />
        </div>
        <span className={s.optionsRowDivider} aria-hidden />
        <span className={s.optionsRowLabel}>List</span>
        <div className={`${s.dropdownWrap} ${s.listDropdownWrap}`}>
          <AnimatedDropdown value={taskListId || ""} onChange={(v) => setTaskListId(v || (sortedLists[0]?.id ?? ""))} placeholder="Select list" options={listOptions} className={s.moduleListDropdown} />
        </div>
      </div>
    </div>
  );
}

export default function CreateTaskBar(props) {
  const bar = useCreateTaskBar(props);
  return (
    <>
      <form className={styles.card} onSubmit={bar.handleSubmit} ref={bar.cardRef} data-create-task-bar-card>
        <CreateTaskBarInput styles={styles} title={bar.title} setTitle={bar.setTitle} saving={bar.saving} inputRef={bar.inputRef} externalInputRef={props.inputRef} setInputFocused={bar.setInputFocused} onBlur={bar.handleInputBlur} onKeyDown={bar.handleInputKeyDown} />
        <CreateTaskBarOptions styles={styles} showOptions={bar.showOptions} estimatedBlocks={bar.estimatedBlocks} setEstimatedBlocks={bar.setEstimatedBlocks} moduleId={bar.moduleId} setModuleId={bar.setModuleId} taskListId={bar.taskListId} setTaskListId={bar.setTaskListId} sortedLists={bar.sortedLists} moduleOptions={bar.moduleOptions} listOptions={bar.listOptions} />
      </form>
      {bar.sleepWarning && <SleepWarningModal {...bar.sleepWarningProps} />}
    </>
  );
}
