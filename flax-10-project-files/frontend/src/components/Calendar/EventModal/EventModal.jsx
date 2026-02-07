import { useEventForm } from './useEventForm';
import { ModalContent } from './components/ModalContent';
import './EventModal.css';

export function EventModal({ event, onClose, initialType }) {
    const options = { initialTag: initialType || null };
    const logic = useEventForm(event, onClose, options);
    return (
        <div className="modal-overlay" onClick={onClose}>
            <ModalContent onClose={onClose} {...logic} />
        </div>
    );
}
