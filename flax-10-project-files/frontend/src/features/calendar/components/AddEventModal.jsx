import { useMemo, useState } from "react";
import styles from "./AddEventModal.module.css";
import { toYmd } from "../lib/eventsStore";

// Modal for adding a new event
function Field({ label, children }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {children}
    </label>
  );
}

// Simple row layout for grouping related fields (e.g. start and end time)
function Row({ children }) {
  return <div className={styles.row}>{children}</div>;
}

// Builds the initial form state, using the provided date and type or defaults
function makeInitialForm(initialDate, initialType) {
  return {
    title: "",
    desc: "",
    type: initialType || "class",
    date: toYmd(initialDate || new Date()),
    start: "09:00",
    end: "10:00",
    location: "",
  };
}

// Prevents clicks inside the modal from closing it by stopping propagation to the backdrop
function stopMouseDown(e) {
  e.stopPropagation();
}

// Checks if a value is blank (empty or whitespace only)
function isBlank(v) {
  return !String(v || "").trim();
}

// Handles form submission. Validates required fields and calls onSave with the form data if valid
function submitEvent(e, form, onSave) {
  e.preventDefault();
  if (isBlank(form.title)) return;
  onSave(form);
}

// Utility for updating a specific field in the form state
function setFieldValue(setForm, k, v) {
  setForm((s) => ({ ...s, [k]: v }));
}

//Individual field components for each form input
function TitleField({ form, onChange }) {
  return (
    <Field label="Title *">
      <input
        className={styles.input}
        name="title"
        value={form.title}
        onChange={onChange}
        placeholder="e.g. Software Engineering"
      />
    </Field>
  );
}

//Descriptio n field
function DescField({ form, onChange }) {
  return (
    <Field label="Description">
      <input
        className={styles.input}
        name="desc"
        value={form.desc}
        onChange={onChange}
        placeholder="e.g. API Design & REST"
      />
    </Field>
  );
}

//Dropdown for selecting the event type (class, study, task, other)
function TypeField({ form, onChange }) {
  return (
    <Field label="Type *">
      <select
        className={styles.input}
        name="type"
        value={form.type}
        onChange={onChange}
      >
        <option value="class">Class</option>
        <option value="study">Study</option>
        <option value="task">Task</option>
        <option value="other">Other</option>
      </select>
    </Field>
  );
}

// Date input field for selecting the event date
function DateField({ form, onChange }) {
  return (
    <Field label="Date *">
      <input
        className={styles.input}
        type="date"
        name="date"
        value={form.date}
        onChange={onChange}
      />
    </Field>
  );
}

// Row containing the start and end time inputs, allowing them to be displayed side by side
function TimeRow({ form, onChange }) {
  return (
    <Row>
      <Field label="Start Time *">
        <input
          className={styles.input}
          type="time"
          name="start"
          value={form.start}
          onChange={onChange}
        />
      </Field>
      <Field label="End Time *">
        <input
          className={styles.input}
          type="time"
          name="end"
          value={form.end}
          onChange={onChange}
        />
      </Field>
    </Row>
  );
}

function LocationField({ form, onChange }) {
  return (
    <Field label="Location">
      <input
        className={styles.input}
        name="location"
        value={form.location}
        onChange={onChange}
        placeholder="e.g. Room 214"
      />
    </Field>
  );
}

// Submit button for the form
function SubmitButton() {
  return (
    <button className={styles.submit} type="submit">
      Add Event
    </button>
  );
}

// Component that renders all the form fields together
function AddEventFields({ form, onChange }) {
  return (
    <>
      <TitleField form={form} onChange={onChange} />
      <DescField form={form} onChange={onChange} />
      <TypeField form={form} onChange={onChange} />
      <DateField form={form} onChange={onChange} />
      <TimeRow form={form} onChange={onChange} />
      <LocationField form={form} onChange={onChange} />
      <SubmitButton />
    </>
  );
}

// Main form component that wraps the fields in a <form> element and handles submission
function AddEventForm({ form, onSubmit, onChange }) {
  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <AddEventFields form={form} onChange={onChange} />
    </form>
  );
}

// Header component for the modal, displaying the title and a close button
function ModalHeader({ onClose }) {
  return (
    <div className={styles.header}>
      <h2 className={styles.title}>Add Event</h2>
      <button className={styles.close} onClick={onClose} type="button">
        ×
      </button>
    </div>
  );
}

// Shell component for the modal, providing the backdrop and layout
function ModalShell({ onClose, children }) {
  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div className={styles.modal} onMouseDown={stopMouseDown}>
        <ModalHeader onClose={onClose} />
        {children}
      </div>
    </div>
  );
}

// Main component for the Add Event modal. Manages the form state and handles interactions
export default function AddEventModal({ onClose, onSave, initialDate, initialType }) {
  const initialForm = useMemo(() => makeInitialForm(initialDate, initialType), [initialDate, initialType]);
  const [form, setForm] = useState(initialForm);

  function onSubmit(e) {
    submitEvent(e, form, onSave);
  }

  function onChange(e) {
    setFieldValue(setForm, e.target.name, e.target.value);
  }

  return (
    <ModalShell onClose={onClose}>
      <AddEventForm form={form} onSubmit={onSubmit} onChange={onChange} />
    </ModalShell>
  );
}
