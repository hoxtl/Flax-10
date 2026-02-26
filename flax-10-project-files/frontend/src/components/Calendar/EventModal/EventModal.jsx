import { useEventForm } from './useEventForm';
import { useTags } from '../../../context/TagContext';
import { ModalContent } from './components/ModalContent';
import ConfirmModal from '../../shared/ConfirmModal';
import { isRecurringEvent } from '../utils/formUtils';
import './EventModal.css';

export function EventModal({ event, onClose, initialType, initialDate, showReminder = true, customTags = null, onSubmit = null }) {
    const globalTags = useTags();
    const tags = customTags || globalTags.tags;
    const loading = customTags ? false : globalTags.loading;

    if (loading) return null;

    const defaultTag = getDefaultTag(tags, initialType, !!customTags);
    const options = { initialTag: defaultTag, initialDate, customSubmit: onSubmit };
    const logic = useEventForm(event, onClose, options);

    if (logic.showDeleteConfirm) {
        return <EventDeleteConfirm event={logic.event} onConfirm={logic.handleDeleteConfirm} onCancel={logic.handleDeleteCancel} />;
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <ModalContent onClose={onClose} showReminder={showReminder} tags={tags} {...logic} />
        </div>
    );
}

function EventDeleteConfirm({ event, onConfirm, onCancel }) {
    const isRecurring = event && isRecurringEvent(event);
    const title = isRecurring ? "Delete Recurring Event" : "Delete Event";
    const message = isRecurring
        ? `This will delete all occurrences of "${event.title}". This cannot be undone.`
        : `Are you sure you want to delete "${event.title}"? This cannot be undone.`;
    return <ConfirmModal title={title} message={message} onConfirm={onConfirm} onCancel={onCancel} />;
}

function getDefaultTag(tags, initialType, isCustom) {
    if (initialType) return initialType;
    if (isCustom) return null;
    const otherTag = tags.find(t => t.label?.toLowerCase() === 'other');
    return otherTag?.id || tags[0]?.id;
}
