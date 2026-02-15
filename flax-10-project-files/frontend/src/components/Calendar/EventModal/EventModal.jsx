import { useEventForm } from './useEventForm';
import { useTags } from '../../../context/TagContext';
import { ModalContent } from './components/ModalContent';
import './EventModal.css';

export function EventModal({ event, onClose, initialType, initialDate, showReminder = true, customTags = null, onSubmit = null }) {
    const globalTags = useTags();
    const tags = customTags || globalTags.tags;
    const loading = customTags ? false : globalTags.loading;

    if (loading || tags.length === 0) return null;

    const defaultTag = getDefaultTag(tags, initialType);
    const options = { initialTag: defaultTag, initialDate, customSubmit: onSubmit };
    const logic = useEventForm(event, onClose, options);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <ModalContent onClose={onClose} showReminder={showReminder} tags={tags} {...logic} />
        </div>
    );
}

function getDefaultTag(tags, initialType) {
    if (initialType) return initialType;
    const otherTag = tags.find(t => t.label?.toLowerCase() === 'other');
    return otherTag?.id || tags[0]?.id;
}
