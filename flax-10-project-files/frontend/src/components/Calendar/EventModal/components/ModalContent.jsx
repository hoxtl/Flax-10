import { ModalHeader } from './ModalHeader';
import { EventFormBody } from './EventFormBody';

export function ModalContent({ onClose, isEditing, form, setForm, error, handleSubmit, handleDelete }) {
    return (
        <div className="modal-content" onClick={e => e.stopPropagation()}>
            <ModalHeader isEditing={isEditing} onClose={onClose} />
            {error && <div className="form-error">{error}</div>}
            <EventFormBody form={form} setForm={setForm} isEditing={isEditing} onSubmit={handleSubmit} onDelete={handleDelete} />
        </div>
    );
}
