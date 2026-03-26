import PrimaryButton from '../../../common/primary_button/PrimaryButton';

export function ActionButtons({ onDelete }) {
    return (
        <div className="modal-actions">
            {onDelete && <PrimaryButton type="button" variant="ghost" pill onClick={onDelete}>Delete</PrimaryButton>}
            <PrimaryButton type="submit" variant="primary" pill>Save</PrimaryButton>
        </div>
    );
}
