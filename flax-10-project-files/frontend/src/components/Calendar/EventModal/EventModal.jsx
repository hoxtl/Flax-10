import { useEventForm } from './useEventForm';
import './EventModal.css';

export function EventModal({ event, onClose }) {
    const logic = useEventForm(event, onClose);
    return (
        <div className="modal-overlay" onClick={onClose}>
            <ModalContent onClose={onClose} {...logic} onSubmit={logic.handleSubmit} onDelete={logic.handleDelete} />
        </div>
    );
}

function ModalContent(props) {
    return (
        <div className="modal-content" onClick={e => e.stopPropagation()}>
            <ModalHeader isEditing={props.isEditing} onClose={props.onClose} />
            {props.error && <div className="form-error">{props.error}</div>}
            <EventFormBody {...props} />
        </div>
    );
}

function ModalHeader({ isEditing, onClose }) {
    return (
        <div className="modal-header">
            <h3>{isEditing ? 'Edit Event' : 'New Event'}</h3>
            <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
    );
}

function EventFormBody({ isEditing, form, setForm, onSubmit, onDelete }) {
    const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));
    return (
        <form onSubmit={onSubmit}>
            <FormField label="Title" value={form.title} onChange={update('title')} required />
            <FormField label="Description" type="textarea" value={form.description} onChange={update('description')} />
            <RecurrenceField value={form.recurrence} onChange={update('recurrence')} />
            <TimeRow form={form} update={update} />
            <ActionButtons isEditing={isEditing} onDelete={onDelete} />
        </form>
    );
}

function TimeRow({ form, update }) {
    return (
        <div className="form-row">
            <FormField label="Start" type="datetime-local" value={form.start_time} onChange={update('start_time')} required />
            <FormField label="End" type="datetime-local" value={form.end_time} onChange={update('end_time')} required />
        </div>
    );
}

function ActionButtons({ isEditing, onDelete }) {
    return (
        <div className="modal-actions">
            {isEditing && <button type="button" className="delete-btn" onClick={onDelete}>Delete</button>}
            <button type="submit" className="submit-btn">Save</button>
        </div>
    );
}

function RecurrenceField({ value, onChange }) {
    return (
        <div className="form-field">
            <label htmlFor="field-recurrence">Recurrence</label>
            <select id="field-recurrence" value={value || 'none'} onChange={onChange}>
                <option value="none">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
            </select>
        </div>
    );
}

function FormField({ label, type = 'text', ...props }) {
    const id = `field-${label.toLowerCase()}`;
    const Component = type === 'textarea' ? 'textarea' : 'input';
    return (
        <div className="form-field">
            <label htmlFor={id}>{label}</label>
            <Component id={id} type={type} {...props} />
        </div>
    );
}
