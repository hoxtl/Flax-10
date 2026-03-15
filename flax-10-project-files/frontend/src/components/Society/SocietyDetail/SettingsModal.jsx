import { useState, useEffect } from "react";
import styles from "./SettingsModal.module.css";
import AddCollaboratorModal from "../AddCollaboratorModal";
import CollaboratorList from "../CollaboratorList";
import { RatificationSection } from "./RatificationSection";
import { useConfirm } from "../../../context/ConfirmContext";
import StandardModal from "../../common/StandardModal/StandardModal";

async function addOrPromoteCollaborator(user, members, onUpdateRole, onAddCollaborator) {
  const existingMember = (members || []).find(m => m.username === user.username);
  if (existingMember) return onUpdateRole?.(existingMember.user, "editor");
  return onAddCollaborator?.(user.username, "editor");
}

function useSettingsModal(props) {
  const { members, onFetchMembers, onUpdateRole, onAddCollaborator } = props;
  const [showAddModal, setShowAddModal] = useState(false);
  useEffect(() => { onFetchMembers?.(); }, [onFetchMembers]);
  const handleAddCollaborators = async (users) => {
    for (const user of users) await addOrPromoteCollaborator(user, members, onUpdateRole, onAddCollaborator);
    onFetchMembers?.();
  };
  const collaborators = (members || []).filter(m => m.role !== 'member');
  const collaboratorUsernames = collaborators.map(c => c.username);
  return { showAddModal, setShowAddModal, handleAddCollaborators, collaborators, collaboratorUsernames };
}

function AddCollaboratorSection({ onOpenModal }) {
  return (
    <div className={styles.section}>
      <h4 className={styles.sectionTitle}>Add Collaborator</h4>
      <button className={styles.addBtn} onClick={onOpenModal}>+ Add Collaborators</button>
    </div>
  );
}

function CollaboratorsSection({ collaborators, onUpdateRole, onRemove }) {
  const handleRoleChange = (userId, role) => onUpdateRole?.(userId, role);
  const handleRemove = (userId) => onRemove?.(userId);
  return (
    <div className={styles.section}>
      <h4 className={styles.sectionTitle}>Collaborators</h4>
      <CollaboratorList collaborators={collaborators} onRoleChange={handleRoleChange} onRemove={handleRemove} />
    </div>
  );
}

function DangerSection({ onDelete, onClose }) {
  const confirmFn = useConfirm();
  const handleDeleteClick = async () => {
    const choice = await confirmFn({
      title: "Delete Society",
      message: "Are you sure? This cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      isDanger: true
    });
    if (choice) {
      onDelete?.();
      onClose?.();
    }
  };

  return (
    <div className={styles.dangerSection}>
      <h4 className={styles.sectionTitle}>Danger Zone</h4>
      <button className={styles.deleteBtn} onClick={handleDeleteClick}>Delete Society</button>
    </div>
  );
}

export default function SettingsModal(props) {
  const { onClose, onDelete, onUpdateRole, onRemoveMember, ratificationStatus, isRatified, onRequestRatification } = props;
  const { showAddModal, setShowAddModal, handleAddCollaborators, collaborators, collaboratorUsernames } = useSettingsModal(props);
  return (
    <>
      <StandardModal
        title="Society Settings"
        onClose={onClose}
        size="md"
        modalClassName={styles.modalShell}
        contentClassName={styles.modalContent}
      >
        <RatificationSection status={ratificationStatus} isRatified={isRatified} onRequest={onRequestRatification} />
        <AddCollaboratorSection onOpenModal={() => setShowAddModal(true)} />
        <CollaboratorsSection collaborators={collaborators} onUpdateRole={onUpdateRole} onRemove={onRemoveMember} />
        <DangerSection onDelete={onDelete} onClose={onClose} />
      </StandardModal>
      {showAddModal && <AddCollaboratorModal onClose={() => setShowAddModal(false)} onAdd={handleAddCollaborators} existingUsernames={collaboratorUsernames} />}
    </>);
}
