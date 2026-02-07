export function ActionButtons({ isEditing, onDelete }) {
    return (
        <div className="modal-actions">
            {isEditing && <button type="button" className="delete-btn" onClick={onDelete}>Delete</button>}
            <button type="submit" className="submit-btn">Save</button>
        </div>
    );
}
