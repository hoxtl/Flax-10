/*
 * Quick-add task bar with optional reading and module details.
 */

import { AnimatePresence, motion } from "framer-motion";
import AnimatedDropdown from "../../../components/common/animated_dropdown";
import { SleepWarningModal } from "../../../components/common/sleep_warning_modal";
import PrimaryButton from "../../../components/common/primary_button/PrimaryButton";
import EstimatedDurationControl from "../../../components/common/estimated_duration_control/EstimatedDurationControl";
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

function ListDropdown({ s, taskListId, setTaskListId, sortedLists, listOptions, listError }) {
  return (
    <>
      <span className={s.optionsRowDivider} aria-hidden />
      <span className={s.optionsRowLabel}>List <span className={s.requiredMark}>*</span></span>
      <div className={`${s.dropdownWrap} ${s.listDropdownWrap} ${listError ? s.listDropdownError : ""}`}>
        <AnimatedDropdown value={taskListId || ""} onChange={(v) => setTaskListId(v || "")} placeholder="Select list" options={listOptions} className={s.moduleListDropdown} />
      </div>
    </>
  );
}

const optionsPanelVariants = {
  hidden: { height: 0, opacity: 0, marginTop: 0 },
  visible: { height: "auto", opacity: 1, marginTop: 8 },
};

function OptionsRowContent(props) {
  const primaryField = props.isReadingList
    ? <PageCountField styles={props.styles} pageCount={props.pageCount} setPageCount={props.setPageCount} />
    : <EstimatedDurationField minutes={props.estimatedMinutes} setMinutes={props.setEstimatedMinutes} styles={props.styles} />;
  return (
    <div className={props.styles.optionsRow}>
      {primaryField}
      <TaskBarDropdownFields {...props} />
    </div>
  );
}

function CreateTaskBarOptions(props) {
  return (
    <div className={props.styles.optionsRowWrapper}>
      <AnimatePresence initial={false}>
        {props.showOptions && (
          <motion.div key="options-panel" variants={optionsPanelVariants} initial="hidden" animate="visible" exit="hidden" transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} style={{ overflow: "visible" }}>
            <OptionsRowContent {...props} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TaskBarDropdownFields(props) {
  return (
    <>
      <ModuleDropdownField
        moduleId={props.moduleId}
        setModuleId={props.setModuleId}
        moduleOptions={props.moduleOptions}
        styles={props.styles}
      />
      <ListDropdown
        s={props.styles}
        taskListId={props.taskListId}
        setTaskListId={props.setTaskListId}
        sortedLists={props.sortedLists}
        listOptions={props.listOptions}
        listError={props.listError}
      />
    </>
  );
}

function EstimatedDurationField({ minutes, setMinutes, styles: s }) {
  return (
    <>
      <span className={s.optionsRowLabel}>Est. time</span>
      <EstimatedDurationControl
        valueMinutes={minutes}
        onChangeMinutes={setMinutes}
        presets={DURATION_PRESETS}
        ariaLabel="Estimated duration"
        classes={buildDurationClasses(s)}
      />
    </>
  );
}

function buildDurationClasses(s) {
  return {
    root: s.durationGroup,
    button: s.durationBtn,
    buttonActive: s.durationBtnActive,
    customInput: s.customDurationInput,
    customInputActive: s.customDurationActive,
    customInputField: s.customDurationInputField,
    leading: s.customDurationLeading,
    trailing: s.customDurationTrailing,
  };
}

function ModuleDropdownField({ moduleId, setModuleId, moduleOptions, styles: s }) {
  return (
    <>
      <span className={s.optionsRowDivider} aria-hidden />
      <span className={s.optionsRowLabel}>Module</span>
      <div className={`${s.dropdownWrap} ${s.moduleDropdownWrap}`}>
        <AnimatedDropdown
          value={moduleId ?? ""}
          onChange={(value) => setModuleId(value === "" ? null : value)}
          placeholder="Module"
          options={moduleOptions}
          className={s.moduleListDropdown}
        />
      </div>
    </>
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
         listError={bar.listError}
        />
      </form>
      {sleepWarning && <SleepWarningModal {...sleepWarningProps} />}
    </>
  );
}
