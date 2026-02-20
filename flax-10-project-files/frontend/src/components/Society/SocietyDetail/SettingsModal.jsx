import { useState, useEffect } from "react";
import styles from "./SettingsModal.module.css";
import AddCollaboratorModal from "../AddCollaboratorModal";
import CollaboratorList from "../CollaboratorList";
import { RatificationSection } from "./RatificationSection";

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

function ModalHeader({ onClose }) {
  return (
    <div className={styles.header}>
      <h3 className={styles.title}>Society Settings</h3>
      <button className={styles.closeBtn} onClick={onClose}>&times;</button>
    </div>
  );
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

function DeleteConfirm({ onConfirm, onCancel, onClose }) {
  const handleDelete = () => { onConfirm?.(); onClose?.(); };
  return (
    <div className={styles.dangerSection}>
      <h4 className={styles.sectionTitle}>Danger Zone</h4>
      <p className={styles.confirmText}>Are you sure? This cannot be undone.</p>
      <div className={styles.confirmBtns}>
        <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
        <button className={styles.confirmDeleteBtn} onClick={handleDelete}>Delete</button>
      </div>
    </div>
  );
}

function DangerSection({ onDelete, onClose }) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) return <DeleteConfirm onConfirm={onDelete} onCancel={() => setConfirming(false)} onClose={onClose} />;
  return (
    <div className={styles.dangerSection}>
      <h4 className={styles.sectionTitle}>Danger Zone</h4>
      <button className={styles.deleteBtn} onClick={() => setConfirming(true)}>Delete Society</button>
    </div>
  );
}

function ModalBackdrop({ onClose, children }) {
  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export default function SettingsModal(props) {
  const { onClose, onDelete, onUpdateRole, onRemoveMember, ratificationStatus, isRatified, onRequestRatification } = props;
  const { showAddModal, setShowAddModal, handleAddCollaborators, collaborators, collaboratorUsernames } = useSettingsModal(props);
  return (
    <>
      <ModalBackdrop onClose={onClose}>
        <ModalHeader onClose={onClose} />
        <RatificationSection status={ratificationStatus} isRatified={isRatified} onRequest={onRequestRatification} />
        <AddCollaboratorSection onOpenModal={() => setShowAddModal(true)} />
        <CollaboratorsSection collaborators={collaborators} onUpdateRole={onUpdateRole} onRemove={onRemoveMember} />
        <DangerSection onDelete={onDelete} onClose={onClose} />
      </ModalBackdrop>
      {showAddModal && <AddCollaboratorModal onClose={() => setShowAddModal(false)} onAdd={handleAddCollaborators} existingUsernames={collaboratorUsernames} />}
    </>);}