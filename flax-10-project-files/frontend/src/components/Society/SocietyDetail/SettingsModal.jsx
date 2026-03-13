/**
 * SettingsModal provides administrative controls for a society,
 * including ratification, collaborator management, and deletion.
 */
import { useState, useEffect } from "react";
import styles from "./SettingsModal.module.css";
import AddCollaboratorModal from "../AddCollaboratorModal";
import CollaboratorList from "../CollaboratorList";
import PrimaryButton from "../../common/PrimaryButton/PrimaryButton";
import SectionHeader from "../../common/SectionHeader/SectionHeader";
import StandardModal from "../../common/StandardModal/StandardModal";
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
    <SectionHeader eyebrow="Society" title="Settings" action={<PrimaryButton className={styles.closeBtn} variant="ghost" onClick={onClose} pill>&times;</PrimaryButton>} />
  );
}

function AddCollaboratorSection({ onOpen }) {
  return (
    <div className={styles.section}>
      <h4 className={styles.sectionTitle}>Add Collaborator</h4>
      <PrimaryButton className={styles.addBtn} variant="secondary" onClick={onOpen} pill>+ Add Collaborators</PrimaryButton>
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
      <PrimaryButton className={styles.deleteBtn} variant="danger" onClick={handleDelete} pill>Delete Society</PrimaryButton>
    </div>
  );
}

function ModalLayout({ onClose, children }) {
  return (
    <StandardModal title={null} hideHeader onClose={onClose} modalClassName={styles.modal}>
      {children}
    </StandardModal>
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
