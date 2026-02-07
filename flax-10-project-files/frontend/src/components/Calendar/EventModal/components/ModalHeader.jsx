export function ModalHeader({ isEditing, onClose }) {
    return (
        <div className="modal-header">
            <h3>{isEditing ? 'Edit Event' : 'New Event'}</h3>
            <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
    );
}
