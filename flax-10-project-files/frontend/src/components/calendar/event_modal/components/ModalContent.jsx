/**
 * ModalContent renders the main body of the event modal.
 * Switches between the event form, overlap warning, and sleep warning views.
 */

import { ModalHeader } from './ModalHeader';
import { EventFormBody } from './EventFormBody';
import ConfirmModal from '../../../common/confirm_modal/ConfirmModal';

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

function EventFormView({ onClose, isEditing, form, setForm, error, handleSubmit, onDelete, showReminder, showTagManager, tags }) {
    return (
        <>
            <ModalHeader isEditing={isEditing} onClose={onClose} />
            {error && <div className="form-error">{error}</div>}
            <EventFormBody form={form} setForm={setForm} isEditing={isEditing} onSubmit={handleSubmit} onDelete={onDelete} showReminder={showReminder} showTagManager={showTagManager} tags={tags} />
        </>
    );
}

function formatTime(t) {
    if (!t) return t;
    const [h, m] = t.split(':').map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function SleepWarningView({ settings, onCancel, onConfirm }) {
    const sleepStr = formatTime(settings?.sleepTime);
    const wakeStr = formatTime(settings?.wakeTime);
    return (
        <ConfirmModal
            title="You should be resting!"
            message={<>Your sleep schedule is <strong>{sleepStr}</strong> to <strong>{wakeStr}</strong>. This event falls during your rest time. Are you sure you want to schedule something at this hour?</>}
            cancelText="Cancel — I'll rest"
            confirmText="Add Anyway"
            onCancel={onCancel}
            onConfirm={onConfirm}
        />
    );
}
