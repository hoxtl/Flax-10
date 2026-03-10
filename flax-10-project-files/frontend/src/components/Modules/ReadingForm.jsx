import {useState} from 'react';
import styles from './DeadlineForm.module.css';

const EMPTY_FORM = { title: '', chapter: '', start_page: '', end_page:'', deadline: '', estimated_minutes: '',};

const buildFormData = (form) => ({
    ...form,
    start_page: Number(form.start_page),
    end_page: Number(form.end_page),
    estimated_minutes: form.estimated_minutes ? Number(form.estimated_minutes) : null,
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

function PageFields({value, onChange}) {
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
        <Field label="Chapter (optional)">
            <input className = {styles.input} type="text" value={value}
                onChange={e => onChange('chapter', e.target.value)}
                placeholder="e.g. Chapter 13" />
        </Field>
    );
}

