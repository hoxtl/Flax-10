/*
 * Tag manager modal entry component.
 */

import StandardModal from "../common/StandardModal/StandardModal";
import styles from "./TagManagerModal.module.css";
import TagManagerContent from "./tagManager/TagManagerContent";
import useTagManagerModal from "./tagManager/useTagManagerModal";

export default function TagManagerModal({ onClose }) {
  const modal = useTagManagerModal();

  return (
    <StandardModal
      title="Manage Tags"
      onClose={onClose}
      size="sm"
      backdropClassName={styles.modalBackdrop}
      modalClassName={styles.modalShell}
      contentClassName={styles.modalContent}
    >
      <TagManagerContent modal={modal} />
    </StandardModal>
  );
}
