import React from "react";
import FormField from "../../../components/common/FormField/FormField";
import TextInput from "../../../components/common/TextInput/TextInput";
import UserModuleDropdown from "../../../components/Modules/UserModuleDropdown";
import DateTimePicker from "../../../components/common/inputs/DateTimePicker";
import styles from "./CreateProjectForm.module.css";

export function CreateProjectInputs({ data, onChange }) {
  return (
    <>
      <FormField label="Project Name" className={styles.inputName}>
        <TextInput 
          value={data.name} 
          onChange={(e) => onChange('name', e.target.value)} 
          placeholder="e.g. Machine Learning Research..." 
          required 
        />
      </FormField>
      <FormField label={<>Module <span className={styles.optionalText}>(Optional)</span></>} className={styles.inputField}>
        <UserModuleDropdown
          value={data.course_code}
          onChange={(val) => onChange('course_code', val)}
          placeholder="Select..."
          usePortal={true}
        />
      </FormField>
      <FormField label="Deadline" className={styles.inputField}>
        <DateTimePicker
          value={data.deadline}
          onChange={(val) => onChange('deadline', val)}
          placeholder="dd / mm / yyyy"
          dateOnly={true}
          hideIcon={true}
          triggerClassName={styles.datePickerTrigger}
          wrapperClassName={styles.datePickerWrap}
        />
      </FormField>
    </>
  );
}
