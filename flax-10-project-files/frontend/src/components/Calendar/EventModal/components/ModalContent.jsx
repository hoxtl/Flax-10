import { ModalHeader } from './ModalHeader';
import { EventFormBody } from './EventFormBody';

export function ModalContent(props) {
    if (props.sleepWarning) {
        return <SleepWarningView settings={props.sleepSettings} onCancel={props.handleCancelSleep} onConfirm={props.handleConfirmSleep} />;
    }
    if (props.overlapWarning) {
        return <OverlapWarningView warning={props.overlapWarning} onCancel={props.handleCancelSave} onConfirm={props.handleConfirmSave} />;
    }
    return <EventFormView {...props} />;
}

function SleepWarningView({ settings, onCancel, onConfirm }) {
    const fmt = (t) => {
        if (!t) return t;
        const [h, m] = t.split(':').map(Number);
        return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
    };
    return (
        <div className="overlap-warning">
            <div className="modal-header">
                <h3>Sleep Hours</h3>
                <button className="close-btn" onClick={onCancel}>x</button>
            </div>
            <div className="modal-body">
                <p>
                    Your sleep schedule is <strong>{fmt(settings?.sleepTime)}</strong> to <strong>{fmt(settings?.wakeTime)}</strong>.
                    This event falls during your rest time.
                </p>
                <p>Are you sure you want to schedule something at this hour?</p>
            </div>
            <div className="modal-actions">
                <button className="btn-secondary" onClick={onCancel}>Cancel</button>
                <button className="btn-primary" onClick={onConfirm}>Add Anyway</button>
            </div>
        </div>
    );
}

function OverlapWarningView({ warning, onCancel, onConfirm }) {
    return (
        <div className="overlap-warning">
            <div className="modal-header">
                <h3>Scheduling Conflict</h3>
                <button className="close-btn" onClick={onCancel}>x</button>
            </div>
            <div className="modal-body">
                <p>This event overlaps with existing events:</p>
                <ul className="overlap-list">
                    {warning.map(e => (
                        <li key={e.id}>
                            <strong>{e.title}</strong><br />
                            {`${new Date(e.start_time).toLocaleTimeString()} - ${new Date(e.end_time).toLocaleTimeString()}`}
                        </li>
                    ))}
                </ul>
                <p>Do you want to save it anyway?</p>
            </div>
            <div className="modal-actions">
                <button className="btn-secondary" onClick={onCancel}>Cancel</button>
                <button className="btn-primary" onClick={onConfirm}>Save Anyway</button>
            </div>
        </div>
    );
}

function EventFormView({ onClose, isEditing, form, setForm, error, handleSubmit, onDelete, showReminder, tags }) {
    return (
        <>
            <ModalHeader isEditing={isEditing} onClose={onClose} />
            {error && <div className="form-error">{error}</div>}
            <EventFormBody form={form} setForm={setForm} isEditing={isEditing} onSubmit={handleSubmit} onDelete={onDelete} showReminder={showReminder} tags={tags} />
        </>
    );
}
