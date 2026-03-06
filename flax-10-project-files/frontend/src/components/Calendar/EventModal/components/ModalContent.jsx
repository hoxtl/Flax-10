import { ModalHeader } from './ModalHeader';
import { EventFormBody } from './EventFormBody';
import { SleepWarningModal } from '../../../common/SleepWarningModal';

export function ModalContent(props) {
    if (props.sleepWarning) {
        return (
            <SleepWarningModal
                sleepTime={props.sleepSettings?.sleepTime}
                wakeTime={props.sleepSettings?.wakeTime}
                onConfirm={props.handleConfirmSleep}
                onCancel={props.handleCancelSleep}
            />
        );
    }
    if (props.overlapWarning) {
        return <OverlapWarningView warning={props.overlapWarning} onCancel={props.handleCancelSave} onConfirm={props.handleConfirmSave} />;
    }
    return <EventFormView {...props} />;
}

function OverlapWarningView({ warning, onCancel, onConfirm }) {
    return (
        <div className="modal-content overlap-warning" onClick={e => e.stopPropagation()}>
            <ModalHeaderWarning onClose={onCancel} />
            <div className="modal-body">
                <p>This event overlaps with existing events:</p>
                <OverlapList events={warning} />
                <p>Do you want to save it anyway?</p>
            </div>
            <ModalActions onCancel={onCancel} onConfirm={onConfirm} />
        </div>
    );
}

function ModalHeaderWarning({ onClose }) {
    return (
        <div className="modal-header">
            <h3>⚠️ Scheduling Conflict</h3>
            <button className="close-btn" onClick={onClose}>×</button>
        </div>
    );
}

function OverlapList({ events }) {
    return (
        <ul className="overlap-list">
            {events.map(e => <OverlapItem key={e.id} event={e} />)}
        </ul>
    );
}

function OverlapItem({ event }) {
    const timeStr = `${new Date(event.start_time).toLocaleTimeString()} - ${new Date(event.end_time).toLocaleTimeString()}`;
    return (
        <li>
            <strong>{event.title}</strong>
            <br />
            {timeStr}
        </li>
    );
}

function ModalActions({ onCancel, onConfirm }) {
    return (
        <div className="modal-actions">
            <button className="btn-secondary" onClick={onCancel}>Cancel</button>
            <button className="btn-primary" onClick={onConfirm}>Save Anyway</button>
        </div>
    );
}

function EventFormView({ onClose, isEditing, form, setForm, error, handleSubmit, onDelete, showReminder, tags }) {
    return (
        <div className="modal-content" onClick={e => e.stopPropagation()}>
            <ModalHeader isEditing={isEditing} onClose={onClose} />
            {error && <div className="form-error">{error}</div>}
            <EventFormBody form={form} setForm={setForm} isEditing={isEditing} onSubmit={handleSubmit} onDelete={onDelete} showReminder={showReminder} tags={tags} />
        </div>
    );
}
