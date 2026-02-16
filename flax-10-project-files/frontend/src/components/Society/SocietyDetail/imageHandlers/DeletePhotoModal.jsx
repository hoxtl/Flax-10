import styles from "./DeletePhotoModal.module.css";

export default function DeletePhotoModal({ photo, onClose, onConfirm }) {
    if (photo.source === 'cover') return <CoverDeleteOptions onClose={onClose} onConfirm={onConfirm} />;
    if (photo.source === 'announcement') return <AnnouncementDeleteOptions onClose={onClose} onConfirm={onConfirm} />;
    return <GeneralDeleteOptions onClose={onClose} onConfirm={onConfirm} />;
}

function CoverDeleteOptions({ onClose, onConfirm }) {
    return (
        <ModalWrapper title="Delete Cover Photo" message="This photo is also used as a cover image.">
            <button className={styles.dangerBtn} onClick={() => onConfirm('both')}>Delete from Photos & Cover</button>
            <button className={styles.primaryBtn} onClick={() => onConfirm('photos_only')}>Delete from Photos Only</button>
            <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
        </ModalWrapper>
    );
}

function AnnouncementDeleteOptions({ onClose, onConfirm }) {
    return (
        <ModalWrapper title="Hide Announcement Photo"
            message="This photo belongs to an announcement. It will be hidden from this tab but remain in Agnnouncements.">
            <button className={styles.primaryBtn} onClick={() => onConfirm('hide')}>Hide from Photos</button>
            <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
        </ModalWrapper>
    );
}

function GeneralDeleteOptions({ onClose, onConfirm }) {
    return (
        <ModalWrapper title="Delete Photo" message="Are you sure you want to delete this photo?">
            <button className={styles.dangerBtn} onClick={() => onConfirm('delete')}>Delete</button>
            <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
        </ModalWrapper>
    );
}

function ModalWrapper({ title, message, children }) {
    return (
        <div className={styles.backdrop}>
            <div className={styles.modal}>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.message}>{message}</p>
                <div className={styles.actions}>{children}</div>
            </div>
        </div>
    );
}
