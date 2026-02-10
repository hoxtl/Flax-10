import { useEventForm } from './useEventForm';
import { useTags } from '../../../context/TagContext';
import { ModalContent } from './components/ModalContent';
import './EventModal.css';

export function EventModal({ event, onClose, initialType, initialDate }) {
    const { tags, loading } = useTags();

    if (loading || tags.length === 0) return null;

    const otherTag = tags.find(t => t.label?.toLowerCase() === 'other');
    const defaultTag = otherTag?.id || tags[0]?.id;
    const options = { initialTag: initialType || defaultTag, initialDate };
    const logic = useEventForm(event, onClose, options);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <ModalContent onClose={onClose} {...logic} />
        </div>
    );
}
