/*
 * GroupWork create project inputs.
 */

import FormField from "../../../components/common/FormField/FormField";
import TextInput from "../../../components/common/TextInput/TextInput";
import UserModuleDropdown from "../../../components/Modules/UserModuleDropdown";
import DateTimePicker from "../../../components/common/inputs/DateTimePicker";
import styles from "./CreateProjectForm.module.css";

export function CreateProjectInputs({ data, onChange, errors }) {
  return (
    <>
      <ProjectNameField value={data.name} onChange={onChange} error={errors?.name} />
      <ProjectModuleField value={data.course_code} onChange={onChange} error={errors?.course_code} />
      <ProjectDeadlineField value={data.deadline} onChange={onChange} error={errors?.deadline} />
    </>
  );
}

function ProjectNameField({ value, onChange, error }) {
  return (
    <FormField label={<RequiredLabel text="Project name" />} labelClassName={styles.fieldLabel} className={styles.inputName} error={error}>
      <TextInput value={value} onChange={(event) => onChange("name", event.target.value)} placeholder="e.g. Machine Learning Research..." required />
    </FormField>
  );
}

function ProjectModuleField({ value, onChange, error }) {
  return (
    <FormField label={<RequiredLabel text="Module" />} labelClassName={styles.fieldLabel} className={styles.inputField} error={error}>
      <UserModuleDropdown
        value={value}
        onChange={(nextValue) => onChange("course_code", nextValue)}
        placeholder="Select..."
        className={styles.dropdownWrap}
        triggerClassName={styles.dropdownTrigger}
        usePortal
        allowFlipUpward={false}
      />
    </FormField>
  );
}

function ProjectDeadlineField({ value, onChange, error }) {
  return (
    <FormField label={<RequiredLabel text="Due date" />} labelClassName={styles.fieldLabel} className={styles.inputField} error={error}>
      <DateTimePicker
        value={value}
        onChange={(nextValue) => onChange("deadline", nextValue)}
        placeholder="Select due date"
        dateOnly
        minDate={new Date()}
        wrapperClassName={styles.datePickerWrap}
      />
    </FormField>
  );
}

function RequiredLabel({ text }) {
  return <>{text} <span className={styles.requiredMark}>*</span></>;
}
