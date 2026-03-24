/*
 * Quick-add task bar with optional reading and module details.
 */

import AnimatedDropdown from "../../../components/common/AnimatedDropdown";
import { SleepWarningModal } from "../../../components/common/SleepWarningModal";
import PrimaryButton from "../../../components/common/PrimaryButton/PrimaryButton";
import EstimatedDurationControl from "../../../components/common/EstimatedDurationControl/EstimatedDurationControl";
import useCreateTaskBar from "../hooks/useCreateTaskBar";
import styles from "./CreateTaskBar.module.css";

const DURATION_PRESETS = [
  { value: 25, label: "25m", ariaLabel: "25 minutes (1 Pomodoro block)" },
  { value: 50, label: "50m", ariaLabel: "50 minutes (2 Pomodoro blocks)" },
];

function CreateTaskBarInput({ styles: s, title, setTitle, saving, inputRef, externalInputRef, setInputFocused, onBlur, onKeyDown }) {
  return (
    <div className={s.inputRow}>
      <input ref={externalInputRef ?? inputRef} type="text" className={s.input} placeholder="Quick add: what needs to be done?" value={title} onChange={(e) => setTitle(e.target.value)} onFocus={() => setInputFocused(true)} onBlur={onBlur} onKeyDown={onKeyDown} aria-label="Quick add task" />
      {title.trim() && <PrimaryButton type="submit" className={s.addBtn} disabled={saving || !title.trim()} aria-label="Add task">{saving ? "…" : "Add"}</PrimaryButton>}
    </div>
  );
}

function PageCountField({ styles: s, pageCount, setPageCount }) {
  return (
    <>
      <span className={s.optionsRowDivider} aria-hidden />
      <span className={s.optionsRowLabel}>Pages</span>
      <input
        type="number" min="1" placeholder="e.g. 48" value={pageCount ?? ""} 
        onChange={(e) => setPageCount(e.target.value ? Number(e.target.value) : null)}
        className={`${s.input} ${s.pageCountInput}`} aria-label="Page count"
      />
    </>
  );
}

function ListDropdown({ s, taskListId, setTaskListId, sortedLists, listOptions }) {
  return (
    <>
      <span className={s.optionsRowDivider} aria-hidden />
      <span className={s.optionsRowLabel}>List</span>
      <div className={`${s.dropdownWrap} ${s.listDropdownWrap}`}>
        <AnimatedDropdown value={taskListId || ""} onChange={(v) => setTaskListId(v || (sortedLists[0]?.id ?? ""))} placeholder="Select list" options={listOptions} className={s.moduleListDropdown} />
      </div>
    </>
  );
}

function CreateTaskBarOptions({ styles: s, showOptions, estimatedMinutes, setEstimatedMinutes, moduleId, setModuleId, taskListId, setTaskListId, sortedLists, moduleOptions, listOptions, isReadingList, pageCount, setPageCount }) {
  return (
    <div className={s.optionsRowWrapper}>
      <div className={`${s.optionsRow} ${showOptions ? s.optionsRowOpen : ""}`}>
        {!isReadingList && (
          <>
            <span className={s.optionsRowLabel}>Est. time</span>
            <EstimatedDurationControl
              valueMinutes={estimatedMinutes}
              onChangeMinutes={setEstimatedMinutes}
              presets={DURATION_PRESETS}
              ariaLabel="Estimated duration"
              classes={{
                root: s.durationGroup,
                button: s.durationBtn,
                buttonActive: s.durationBtnActive,
                customInput: s.customDurationInput,
                customInputActive: s.customDurationActive,
                customInputField: s.customDurationInputField,
                leading: s.customDurationLeading,
                trailing: s.customDurationTrailing,
              }}
            />
          </>
        )}
        {isReadingList && (
          <PageCountField styles={s} pageCount={pageCount} setPageCount={setPageCount} />
        )}
        <span className={s.optionsRowDivider} aria-hidden />
        <span className={s.optionsRowLabel}>Module</span>
        <div className={`${s.dropdownWrap} ${s.moduleDropdownWrap}`}>
          <AnimatedDropdown value={moduleId ?? ""} onChange={(v) => setModuleId(v === "" ? null : v)} placeholder="Module" options={moduleOptions} className={s.moduleListDropdown} />
        </div>
        <ListDropdown s={s} taskListId={taskListId} setTaskListId={setTaskListId} sortedLists={sortedLists} listOptions={listOptions}/>
        </div>
    </div>
  );
}

export default function CreateTaskBar(props) {
  const { cardRef, handleSubmit, handleInputBlur, handleInputKeyDown, inputRef, sleepWarning, sleepWarningProps, ...bar } = useCreateTaskBar(props);
  return (
    <>
      <form className={styles.card} onSubmit={handleSubmit} ref={cardRef} data-create-task-bar-card>
        <CreateTaskBarInput styles={styles} title={bar.title} setTitle={bar.setTitle} saving={bar.saving} inputRef={inputRef} externalInputRef={props.inputRef} setInputFocused={bar.setInputFocused} onBlur={handleInputBlur} onKeyDown={handleInputKeyDown} />
        <CreateTaskBarOptions styles={styles} showOptions={bar.showOptions} estimatedMinutes={bar.estimatedMinutes} setEstimatedMinutes={bar.setEstimatedMinutes} moduleId={bar.moduleId} setModuleId={bar.setModuleId} taskListId={bar.taskListId} setTaskListId={bar.setTaskListId} 
         sortedLists={bar.sortedLists} moduleOptions={bar.moduleOptions} listOptions={bar.listOptions}
         isReadingList={bar.isReadingList} pageCount={bar.pageCount} setPageCount={bar.setPageCount}
        />
      </form>
      {sleepWarning && <SleepWarningModal {...sleepWarningProps} />}
    </>
  );
}
