/*
 * Form for creating and editing module deadlines.
 */

import { useState } from 'react';
import { DEADLINE_TYPES, TYPES_WITH_END_DATE, TYPES_WITH_LOCATION } from '../utils/deadlineUtils.js';
import AnimatedDropdown from '../../common/animated_dropdown';
import styles from './DeadlineForm.module.css';
import DateTimePicker from '../../common/inputs/DateTimePicker';
import LocationAutocomplete from '../../common/inputs/LocationAutocomplete';
import { buildValidationState, failValidation, finishValidation, ModuleFormField, ModuleFormFooter, requireFieldValue } from '../shared/moduleFormParts';
const EMPTY_FORM = { title: '', deadline_type: 'coursework', start_due_date: '', end_due_date: '', location: '', description: '' };

function Field({ label, children }) {
    return <ModuleFormField label={label} styles={styles}>{children}</ModuleFormField>;
}

function TitleField({ value, onChange }) {
    return <Field label="Title"><input className={styles.input} type="text" value={value} onChange={e => onChange('title', e.target.value)} required /></Field>;
}

function TypeField({ value, onChange }) {
    return (
        <Field label="Type">
            <AnimatedDropdown value={value} onChange={(val) => onChange('deadline_type', val)} options={DEADLINE_TYPES} placeholder="Select type" />
        </Field>
    );
}

function StartDateField({ value, onChange, deadlineType }) {
    const label = deadlineType === 'exam' ? 'Start Time' : 'Due Date';
    return (
        <Field label={label}>
            <DateTimePicker
                value={value} onChange={val => onChange('start_due_date', val)} placeholder="Pick date & time" 
            />
        </Field>
    );
}

function EndDateField({ value, onChange, minDate }) {
    return (
        <Field label="End Time">
            <DateTimePicker
                value={value} onChange={val => onChange('end_due_date', val)} placeholder="Pick date & time"
                minDate={minDate}
            />
        </Field>
    );
}

function LocationField({ value, onChange }) {
    return <Field label="Location"><LocationAutocomplete value={value} onChange={(val) => onChange('location', val)} inputClassName={styles.input} /></Field>;
}

function DescriptionField({ value, onChange }) {
    return <Field label="Description (optional)"><textarea className={styles.textarea} value={value} onChange={e => onChange('description', e.target.value)} rows={3} /></Field>;
}

function useDeadlineFormValidation() {
    const [error, setError] = useState('');
    const validate = (form) => {
        if (!requireFieldValue(
            form.start_due_date,
            form.deadline_type === 'exam' ? "Start time cannot be empty." : "Due date cannot be empty.",
            setError,
        )) {
            return false;
        }
        if (TYPES_WITH_END_DATE.includes(form.deadline_type) && !form.end_due_date) {
            return failValidation(setError, "End time cannot be empty.");
        }
        if (form.end_due_date && new Date(form.end_due_date) <= new Date(form.start_due_date)) {
            return failValidation(setError, "End time must be after start time.");
        }
        return finishValidation(setError);
    };
    return buildValidationState(error, validate);
}

const buildFormData = (form) => ({
    ...form,
    start_due_date: form.start_due_date ? new Date(form.start_due_date).toISOString() : '',
    end_due_date: form.end_due_date ? new Date(form.end_due_date).toISOString() : null,
})

export default function DeadlineForm({ initial, onSubmit, onCancel }) {
    const [form, setForm] = useState(initial || EMPTY_FORM);
    const {error, validate} = useDeadlineFormValidation();
    const onChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
    const handleSubmit = (e) => { e.preventDefault(); if (validate(form)) onSubmit(buildFormData(form)); };
    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <TitleField value={form.title} onChange={onChange} />
            <TypeField value={form.deadline_type} onChange={onChange} />
            <StartDateField value={form.start_due_date} onChange={onChange} deadlineType={form.deadline_type} />
            {TYPES_WITH_END_DATE.includes(form.deadline_type) && <EndDateField value={form.end_due_date} onChange={onChange} minDate={form.start_due_date ? new Date(form.start_due_date) : undefined} />}
            {TYPES_WITH_LOCATION.includes(form.deadline_type) && <LocationField value={form.location} onChange={onChange} />}
            <DescriptionField value={form.description} onChange={onChange} />
            <ModuleFormFooter createLabel="Add Deadline" error={error} isEditing={!!initial} onCancel={onCancel} styles={styles} />
        </form>
    );
}
