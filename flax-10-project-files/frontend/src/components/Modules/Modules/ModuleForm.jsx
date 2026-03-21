/* Form for creating and editing modules with department and course selection. */
import { useState, useMemo } from 'react';
import { createModule, updateModule } from '../../../api/moduleApi';
import { serialiseModule } from '../utils/moduleUtils';
import { validateForm, getFormData, updateForm } from '../utils/moduleHelpers';
import { KCL_DEPARTMENTS } from '../../../lib/kclCourses';
import AnimatedDropdown from '../../common/AnimatedDropdown/AnimatedDropdown';
import styles from './ModuleForm.module.css';
import DateTimePicker from '../../common/inputs/DateTimePicker';

function saveModule(is_editing, module, form_data) {
    const data = serialiseModule(form_data);
    return is_editing ? updateModule(module.id, data) : createModule(data);
}

function handleNewForm(field, value, setFormData, setErrors, errors) {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
}

function getInput(error, s) {
    return error ? `${s.input} ${s.inputError}` : s.input;
}

async function handleSubmit(e, is_editing, module, form_data, setErrors, setSubmitting, onSuccess) {
    e.preventDefault();
    const new_errors = validateForm(form_data);
    if (Object.keys(new_errors).length > 0) {
        setErrors(new_errors);
        return;
    }
    setSubmitting(true);
    try {
        onSuccess(await saveModule(is_editing, module, form_data), !is_editing);
    } catch (err) {
        setErrors({ submit: err.message });
    } finally {
        setSubmitting(false);
    }
}

function FormBody({ form_data, errors, submitting, is_editing, onChange, onSubmit, onCancel }) {
    return (
        <form onSubmit={onSubmit} className={styles.form}>
            <DepartmentCourseFields form_data={form_data} errors={errors} onChange={onChange} />
            <NameFields form_data={form_data} errors={errors} is_editing={is_editing} onChange={onChange} />
            <DescriptionLocationFields form_data={form_data} onChange={onChange} />
            <TimeFields form_data={form_data} errors={errors} onChange={onChange} />
            <RecurringCheckbox checked={form_data.is_recurring} onChange={(v) => onChange('is_recurring', v)} />
            {errors.submit && <div className={styles.submitError}>{errors.submit}</div>}
            <FormActions submitting={submitting} is_editing={is_editing} onCancel={onCancel} />
        </form>
    );
}
const DEPARTMENT_OPTIONS = Object.keys(KCL_DEPARTMENTS).map(d => ({ value: d, label: d }));

function getInitialFormData(module) {
    return module ? updateForm(module) : getFormData();
}

function useCourseOptions(department) {
    return useMemo(() => {
        if (!department) return [];
        return (KCL_DEPARTMENTS[department] || []).map(c => ({ value: c, label: c }));
    }, [department]);
}

function DepartmentDropdown({ value, error, onChange }) {
    const handleChange = (dept) => { onChange('department', dept); onChange('course', ''); };
    return (
        <FormGroup label="Department" error={error} required>
            <AnimatedDropdown value={value} onChange={handleChange} options={DEPARTMENT_OPTIONS} searchable placeholder="Select a department..." searchPlaceholder="Search departments" emptyMessage="No departments found" />
        </FormGroup>
    );
}

function CourseDropdown({ value, error, department, onChange }) {
    const courseOptions = useCourseOptions(department);
    const placeholder = department ? "Select a course..." : "Select a department first";
    return (
        <FormGroup label="Course" error={error} required>
            <AnimatedDropdown value={value} onChange={(v) => onChange('course', v)} options={courseOptions} searchable placeholder={placeholder} searchPlaceholder="Search courses" emptyMessage="No courses found" />
        </FormGroup>
    );
}

function DepartmentCourseFields({ form_data, errors, onChange }) {
    return (<><DepartmentDropdown value={form_data.department} error={errors.department} onChange={onChange} /><CourseDropdown value={form_data.course} error={errors.course} department={form_data.department} onChange={onChange} /></>);
}

function NameFields({ form_data, errors, is_editing, onChange }) {
    return (
        <>
            <FormGroup label="Module Code" error={errors.module_code} required>
                <input type="text" className={getInput(errors.module_code, styles)} value={form_data.module_code} onChange={(e) => onChange('module_code', e.target.value)} placeholder="e.g., 5CCS2SEG" disabled={is_editing} />
            </FormGroup>
            <FormGroup label="Module Name" error={errors.module_name} required>
                <input type="text" className={getInput(errors.module_name, styles)} value={form_data.module_name} onChange={(e) => onChange('module_name', e.target.value)} placeholder="e.g., Software Engineering" />
            </FormGroup>
        </>
    );
}
function DescriptionLocationFields({ form_data, onChange }) {
    return (
        <>
            <FormGroup label="Description">
                <textarea className={styles.textarea} value={form_data.description} onChange={(e) => onChange('description', e.target.value)} placeholder="Brief description of the module..." rows={4} />
            </FormGroup>
            <FormGroup label="Location">
                <input type="text" className={styles.input} value={form_data.location} onChange={(e) => onChange('location', e.target.value)} placeholder="e.g., Bush House, 2.09" />
            </FormGroup>
        </>
    );
}

function TimeFields({ form_data, errors, onChange }) {
    return (
        <>
            <FormGroup label="First Lecture Date & Time" error={errors.start_time} required>
                <DateTimePicker value={form_data.start_time} onChange={val => onChange('start_time', val)} placeholder="Pick date & time" />
            </FormGroup>
            <FormGroup label="Lecture End Time" error={errors.end_time} required>
                <DateTimePicker value={form_data.end_time} onChange={val => onChange('end_time', val)} placeholder="Pick date & time" />
            </FormGroup>
        </>
    );
}
function FormHeader({ is_editing }) {
    return (
        <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>{is_editing ? 'Edit Module' : 'Create New Module'}</h2>
            <p className={styles.formSubtitle}>{is_editing ? 'Update the module details below' : 'Fill in the details to create a new module'}</p>
        </div>
    );
}
function FormGroup({ label, error, required = false, children }) {
    return (
        <div className={styles.formGroup}>
            <label className={styles.label}>{label}{required && <span className={styles.required}> *</span>}</label>
            {children}
            {error && <span className={styles.error}>{error}</span>}
        </div>
    );
}
function RecurringCheckbox({ checked, onChange }) {
    return (
        <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
                <span>Repeat weekly</span>
            </label>
            <p className={styles.helperText}>When enabled, this lecture repeats every week at the same time</p>
        </div>
    );
}
function FormActions({ submitting, is_editing, onCancel }) {
    const submit_text = submitting ? 'Saving...' : (is_editing ? 'Update Module' : 'Create Module');
    return (
        <div className={styles.formActions}>
            <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={submitting}>Cancel</button>
            <button type="submit" className={styles.submitButton} disabled={submitting}>{submit_text}</button>
        </div>
    );
}

export default function ModuleForm({ module, onSuccess, onCancel }) {
    const is_editing = !!module;
    const [form_data, setFormData] = useState(() => getInitialFormData(module));
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const on_change = (f, v) => handleNewForm(f, v, setFormData, setErrors, errors);
    const on_submit = (e) => handleSubmit(e, is_editing, module, form_data, setErrors, setSubmitting, onSuccess);
    return (
        <div className={styles.formContainer}>
            <FormHeader is_editing={is_editing} />
            <FormBody form_data={form_data} errors={errors} submitting={submitting} is_editing={is_editing} onChange={on_change} onSubmit={on_submit} onCancel={onCancel} />
        </div>
    );
}
