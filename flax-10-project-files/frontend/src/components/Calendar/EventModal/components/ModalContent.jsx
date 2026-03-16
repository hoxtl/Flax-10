/**
 * ModalContent renders the main body of the event modal.
 * Switches between the event form, overlap warning, and sleep warning views.
 */
import { ModalHeader } from './ModalHeader';
import { EventFormBody } from './EventFormBody';

/** Top-level modal content that selects the appropriate view and stops click propagation. */
export function ModalContent(props) {
    if (props.sleepWarning) {
        return <SleepWarningView settings={props.sleepSettings} onCancel={props.handleCancelSleep} onConfirm={props.handleConfirmSleep} />;
    }
    return (
        <div onClick={(e) => e.stopPropagation()}>
            {props.overlapWarning?.length
                ? <OverlapWarningView overlapWarning={props.overlapWarning} onConfirm={props.handleConfirmSave} onCancel={props.handleCancelSave} />
                : <EventFormView {...props} />}
        </div>
    );
}

function OverlapWarningView({ overlapWarning, onConfirm, onCancel }) {
    return (
        <div>
            <div>
                <h3>Scheduling Conflict</h3>
                <button onClick={onCancel}>x</button>
            </div>
            <div>
                {overlapWarning.map(event => <p key={event.id}>{event.title}</p>)}
            </div>
            <div>
                <button onClick={onConfirm}>Save Anyway</button>
                <button onClick={onCancel}>Cancel</button>
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

function formatTime(t) {
    if (!t) return t;
    const [h, m] = t.split(':').map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function SleepWarningBody({ settings }) {
    return (
        <div className="modal-body">
            <p>Your sleep schedule is <strong>{formatTime(settings?.sleepTime)}</strong> to <strong>{formatTime(settings?.wakeTime)}</strong>. This event falls during your rest time.</p>
            <p>Are you sure you want to schedule something at this hour?</p>
        </div>
    );
}

function SleepWarningView({ settings, onCancel, onConfirm }) {
    return (
        <div className="overlap-warning">
            <div className="modal-header">
                <h3>Sleep Hours</h3>
                <button className="close-btn" onClick={onCancel}>x</button>
            </div>
            <SleepWarningBody settings={settings} />
            <div className="modal-actions">
                <button className="btn-secondary" onClick={onCancel}>Cancel</button>
                <button className="btn-primary" onClick={onConfirm}>Add Anyway</button>
            </div>
        </div>
    );
}
