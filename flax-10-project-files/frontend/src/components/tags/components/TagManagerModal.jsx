/*
 * Tag manager modal entry component.
 */

import StandardModal from "../../common/standard_modal/StandardModal";
import styles from "../styles/TagManagerModal.module.css";
import TagManagerContent from "../tag_manager/TagManagerContent";
import useTagManagerModal from "../tag_manager/useTagManagerModal";

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
