export function ActionButtons({ onDelete }) {
    return (
        <div className="modal-actions">
            {onDelete && <button type="button" className="delete-btn" onClick={onDelete}>Delete</button>}
            <button type="submit" className="submit-btn">Save</button>
        </div>
    );
}
