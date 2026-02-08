import { useEventForm } from './useEventForm';
import { useTags } from '../../../context/TagContext';
import { ModalContent } from './components/ModalContent';
import './EventModal.css';

export function EventModal({ event, onClose, initialType, initialDate }) {
    const { tags } = useTags();
    const otherTag = tags.find(t => t.id === 'other');
    const defaultTag = otherTag ? otherTag.id : (tags.length > 0 ? tags[0].id : '');

    const options = { initialTag: initialType || defaultTag, initialDate };
    const logic = useEventForm(event, onClose, options);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <ModalContent onClose={onClose} {...logic} />
        </div>
    );
}
