/**
 * EventModal - Modal dialog for creating and editing calendar events.
 * Wraps form logic with tag loading and default value handling.
 */
import { useEventForm } from './useEventForm';
import { useTags } from '../../../context/TagContext';
import { ModalContent } from './components/ModalContent';
import StandardModal from '../../common/StandardModal/StandardModal';
import './EventModal.css';

/** Modal for creating or editing a calendar event. */
export function EventModal({ event, onClose, initialType, initialDate, showReminder = true, customTags = null, onSubmit = null, onDelete = null }) {
    const globalTags = useTags();
    const tags = customTags || globalTags.tags;
    const loading = customTags ? false : globalTags.loading;

    if (loading) return null;

    const defaultTag = getDefaultTag(tags, initialType, !!customTags);
    const options = { initialTag: defaultTag, initialDate, customSubmit: onSubmit };
    const logic = useEventForm(event, onClose, options);

    return (
        <StandardModal onClose={onClose}>
            <ModalContent onClose={onClose} showReminder={showReminder} tags={tags} {...logic} onDelete={onDelete} />
        </StandardModal>
    );
}

function getDefaultTag(tags, initialType, isCustom) {
    if (initialType) return initialType;
    if (isCustom) return null;
    const otherTag = tags.find(t => t.label?.toLowerCase() === 'other');
    return otherTag?.id || tags[0]?.id;
}
