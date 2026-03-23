/*
 * Form for creating and editing module readings.
 */

import {useState} from 'react';
import styles from '../Deadlines/DeadlineForm.module.css';
import DateTimePicker from '../../common/inputs/DateTimePicker';

const EMPTY_FORM = { title: '', chapter: '', start_page: '', end_page:'', deadline: '', estimated_minutes: '',};

const buildFormData = (form) => ({
    ...form,
    start_page: Number(form.start_page),
    end_page: Number(form.end_page),
    estimated_minutes: form.estimated_minutes ? Number(form.estimated_minutes) : null,
    deadline: form.deadline ? new Date(form.deadline).toISOString() : '',
})

function Field({label, children}) {
    return (
        <div className = {styles.field}>
            <label className={styles.label}>{label}</label>
            {children}
        </div>
    );
}

function TitleField({value, onChange}) {
    return (
        <Field label="Title">
            <input className = {styles.input} type="text" value={value}
                onChange={e => onChange('title', e.target.value)} required
                placeholder="e.g. Software Engineering Module Handbook" />
        </Field>
    );
}

function ChapterField({value, onChange}) {
    return (
        <Field label="Chapter (optional)">
            <input className = {styles.input} type="text" value={value}
                onChange={e => onChange('chapter', e.target.value)}
                placeholder="e.g. Chapter 13" />
        </Field>
    );
}

function PageFields({start, end, onChange}) {
    return (
        <>
            <Field label="Start Page">
                <input className = {styles.input} type="number" min="1" value={start}
                    onChange={e => onChange('start_page', e.target.value)} required />
            </Field>
            <Field label="End Page">
                <input className = {styles.input} type="number" min="1" value={end}
                    onChange={e => onChange('end_page', e.target.value)} required/>
            </Field>
        </>
    );
}

function DeadlineField({value, onChange}) {
    return (
        <Field label="Due Date">
            <DateTimePicker
                value={value} onChange={val => onChange('deadline', val)} placeholder='Pick due date & time'/>
        </Field>
    );
}

function EstimatedMinutesField({value, onChange}) {
    return (
        <Field label="Estimated Minutes (optional) - leave blank to auto-calculate">
            <input className = {styles.input} type="number" min="1" value={value}
                onChange={e => onChange('estimated_minutes', e.target.value)}
                placeholder="Auto-calculated from page count" />
        </Field>
    );
}

function FormActions({ onCancel, isEditing }) {
    return (
        <div className={styles.actions}>
            <button type="button" className={styles.cancelButton} onClick={onCancel}>Cancel</button>
            <button type="submit" className={styles.submitButton}>{isEditing ? 'Update' : 'Add Reading'}</button>
        </div>
    );
}

function useReadingFormValidation() {
    const [error, setError] = useState('');
    const validate = (form) => {
        if (!form.deadline) {
            setError("Due date cannot be empty.");
            return false;
        }
        if (form.chapter && form.chapter.trim().startsWith('-')) {
            setError("Chapter cannot be negative."); 
            return false
        }
        if (Number(form.end_page) < Number(form.start_page)) {
            setError("End page must be greater than or equal to start page.")
            return false;
        }
        setError('');
        return true;
    };
    return {error, validate};
}

export default function ReadingForm({ initial, onSubmit, onCancel }) {
    const [form, setForm] = useState(initial || EMPTY_FORM);
    const {error, validate} =  useReadingFormValidation();
    const onChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
    const handleSubmit = (e) => { e.preventDefault(); if (validate(form)) onSubmit(buildFormData(form)); };
    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <TitleField value={form.title} onChange={onChange} />
            <ChapterField value={form.chapter} onChange={onChange} />
            <PageFields start={form.start_page} end={form.end_page} onChange={onChange} />
            <DeadlineField value={form.deadline} onChange={onChange} />
            <EstimatedMinutesField value={form.estimated_minutes} onChange={onChange} />
            {error && <div className={styles.error}>{error}</div>}
            <FormActions onCancel={onCancel} isEditing={!!initial} />
        </form>
    );
}
