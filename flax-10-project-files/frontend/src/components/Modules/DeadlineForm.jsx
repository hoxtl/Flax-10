import {use, useState} from 'react';
import styles from './ModuleForm.module.css';

const DEADLINE_TYPES = [ 
    { value: 'exam', label: 'Exam'}, 
    { value: 'coursework', label: 'Coursework'},
    { value: 'quiz', label: 'Quiz'},
    { value: 'presentation', label: 'Presentation' },
];

function TitleField({ value, onChange}) {
    return (
        <div className={styles.field}>
            <label className={styles.label}> Title </label>
            <input className={styles.input} type="text" value={value} 
            onChange={e => onChange('title', e.target.value)} required />
        </div>
    );
}

function StartDateField({ value, onChange}) {
    return (
        <div className={styles.field}>
            <label className={styles.label}> Start Date </label>
            <input className={styles.input} type="datetime-local" value={value} 
            onChange={e => onChange('start_due_date', e.target.value)} required />
        </div>
    );
}

function EndDateField({ value, onChange}) {
    return (
        <div className={styles.field}>
            <label className={styles.label}> End Date (optional) </label>
            <input className={styles.input} type="datetime-local" value={value} 
            onChange={e => onChange('end_due_date', e.target.value)} />
        </div>
    );
}

function TypeField({ value, onChange}) {
    return (
        <div className={styles.field}>
            <label className={styles.label}> Type </label>
            <select className={styles.input} value={value} onChange={e => onChange('deadline_type', e.target.value)}>
                {DEADLINE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
        </div>
    );
}

function  LocationField({ value, onChange}) {
    return (
        <div className={styles.field}>
            <label className={styles.label}> Location (optional) </label>
            <input className={styles.input} type="text" value={value} 
            onChange={e => onChange('location', e.target.value)} />
        </div>
    );
}

function DescriptionField({ value, onChange}) {
    return (
        <div className={styles.field}>
            <label className={styles.label}> Description (optional) </label>
            <textarea className={styles.textarea} value={value} 
            onChange={e => onChange('description', e.target.value)} rows={3} />
        </div>
    );
}

function FormBody({ form, onChange }) {
    return (
        <>
        <TitleField value={form.title} onChange={onChange} />
        <TypeField value={form.deadline_type} onChange={onChange} />
        <StartDateField value={form.start_due_date} onChange={onChange} />
        <EndDateField value={form.wnd_due_date} onChange={onChange} />
        <Location value={form.location} onChange={onChange} />
        <DescriptionField value={form.description} onChange={onChange} />
        </>
    );
}

function DeadlineFormActions({onCancel, isEditing}) {
    return (
            <div className={styles.actions}>
                <button type="button" className={styles.cancelButton} onClick={onCancel}>Cancel</button>
                <button type="submit" className={styles.submitButton}> {isEditing ? 'Update' : 'Add Deadline'}</button>
            </div>
        );
}

export default function DeadlineForm({initial, onSubmit, onCancel}) {
    const [form, setForm] = useState(initial || {
        title: '', deadline_type: 'coursework', start_due_date: '',
        end_due_date: '', location: '', description: ''
    });
    const onChange = (field, value) => setForm(prev => ({ ...prev, [field]:value}));
    const handleSubmit = (e) => {e.preventDefault(); onSubmit(form); };
    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <FormBody form={form} onChange={onChange}/>
            <DeadlineFormActions onCancel={onCancel} isEditing={isEditing}/>
        </form>
    );
}