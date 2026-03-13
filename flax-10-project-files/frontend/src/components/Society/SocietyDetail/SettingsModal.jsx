/**
 * SettingsModal provides administrative controls for a society,
 * including ratification, collaborator management, and deletion.
 */
import { useState, useEffect } from "react";
import styles from "./SettingsModal.module.css";
import AddCollaboratorModal from "../AddCollaboratorModal";
import CollaboratorList from "../CollaboratorList";
import { RatificationSection } from "./RatificationSection";
import { useConfirm } from "../../../context/ConfirmContext";

/** Common logic for collaborator management updates. */
async function syncCollaborator(user, members, onUpdate, onAdd) {
  const existing = (members || []).find(m => m.username === user.username);
  if (existing) return onUpdate?.(existing.user, "editor");
  return onAdd?.(user.username, "editor");
}

/** Hook to handle settings modal internal state. */
function useSettings(props) {
  const { members, onFetchMembers, onUpdateRole, onAddCollaborator } = props;
  const [showAdd, setShowAdd] = useState(false);
  useEffect(() => { onFetchMembers?.(); }, [onFetchMembers]);

  const handleAdd = async (users) => {
    for (const u of users) await syncCollaborator(u, members, onUpdateRole, onAddCollaborator);
    onFetchMembers?.();
  };

  const collabs = (members || []).filter(m => m.role !== 'member');
  return { showAdd, setShowAdd, handleAdd, collabs };
}

function ModalHeader({ onClose }) {
  return (
    <div className={styles.header}>
      <h3 className={styles.title}>Society Settings</h3>
      <button className={styles.closeBtn} onClick={onClose}>&times;</button>
    </div>
  );
}

function AddCollaboratorSection({ onOpen }) {
  return (
    <div className={styles.section}>
      <h4 className={styles.sectionTitle}>Add Collaborator</h4>
      <button className={styles.addBtn} onClick={onOpen}>+ Add Collaborators</button>
    </div>
  );
}

function CollaboratorsSection({ collabs, onUpdate, onRemove }) {
  return (
    <div className={styles.section}>
      <h4 className={styles.sectionTitle}>Collaborators</h4>
      <CollaboratorList collaborators={collabs}
        onRoleChange={onUpdate} onRemove={onRemove} />
    </div>
  );
}

function DangerSection({ onDelete, onClose }) {
  const confirm = useConfirm();
  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete Society", message: "Are you sure? This cannot be undone.",
      confirmText: "Delete", cancelText: "Cancel", isDanger: true
    });
    if (ok) { onDelete?.(); onClose?.(); }
  };

  return (
    <div className={styles.dangerSection}>
      <h4 className={styles.sectionTitle}>Danger Zone</h4>
      <button className={styles.deleteBtn} onClick={handleDelete}>Delete Society</button>
    </div>
  );
}

function ModalLayout({ onClose, children }) {
  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div className={styles.modal} onMouseDown={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export default function SettingsModal(props) {
  const { onClose, onDelete, onUpdateRole, onRemoveMember, ratificationStatus, isRatified, onRequestRatification } = props;
  const logic = useSettings(props);
  const collabs = logic.collabs;
  return (
    <>
      <ModalLayout onClose={onClose}>
        <ModalHeader onClose={onClose} />
        <RatificationSection status={ratificationStatus} isRatified={isRatified} onRequest={onRequestRatification} />
        <AddCollaboratorSection onOpen={() => logic.setShowAdd(true)} />
        <CollaboratorsSection collabs={collabs} onUpdate={onUpdateRole} onRemove={onRemoveMember} />
        <DangerSection onDelete={onDelete} onClose={onClose} />
      </ModalLayout>
      {logic.showAdd && <AddCollaboratorModal onClose={() => logic.setShowAdd(false)}
        onAdd={logic.handleAdd} existingUsernames={collabs.map(c => c.username)} />}
    </>
  );
}