/**
 * SettingsModal provides administrative controls for a society,
 * including ratification, collaborator management, and deletion.
 */

import { useState, useEffect } from "react";
import styles from "./SettingsModal.module.css";
import AddCollaboratorModal from "../components/AddCollaboratorModal";
import CollaboratorList from "../components/CollaboratorList";
import PrimaryButton from "../../common/primary_button/PrimaryButton";
import StandardModal from "../../common/standard_modal/StandardModal";
import HoldConfirmModal from "../../common/hold_confirm_modal/HoldConfirmModal";
import { RatificationSection } from "./RatificationSection";

/** Common logic for collaborator management updates. */

async function syncCollaborator(user, members = [], onUpdate, onAdd) {
  const existing = members.find(m => m.username?.toLowerCase() === user.username?.toLowerCase());
  if (existing) return onUpdate?.(existing.user, "editor");
  return onAdd?.(user.username, "editor");
}

/** Hook to handle settings modal internal state. */

function useSettings(props) {
  const { members, onFetchMembers, onUpdateRole, onAddCollaborator } = props;
  const [showAdd, setShowAdd] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  useEffect(() => { onFetchMembers?.(); }, [onFetchMembers]);

  const handleAdd = async (users) => {
    for (const u of users) await syncCollaborator(u, members, onUpdateRole, onAddCollaborator);
    await onFetchMembers?.();
  };

  const collabs = (members || []).filter(m => m.role !== 'member');
  return { showAdd, setShowAdd, showDeleteConfirm, setShowDeleteConfirm, handleAdd, collabs };
}

function AddCollaboratorSection({ onOpen }) {
  return (
    <div className={styles.section}>
      <h4 className={styles.sectionLead}>Add collaborators now so editing, events, and approvals are ready from the start.</h4>
      <PrimaryButton className={styles.addBtn} variant="secondary" onClick={onOpen} pill>+ Add Collaborators</PrimaryButton>
    </div>
  );
}

function CollaboratorsSection({ collabs, onUpdate, onRemove }) {
  return (
    <div className={styles.section}>
      <h4 className={styles.sectionTitle}>Collaborators</h4>
      <p className={styles.sectionHint}>Manage who can help run this society.</p>
      <CollaboratorList collaborators={collabs} onRoleChange={onUpdate} onRemove={onRemove} />
    </div>
  );
}

function DangerSection({ onDelete, onDone }) {
  return (
    <div className={styles.dangerSection}>
      <h4 className={styles.sectionTitle}>Danger Zone</h4>
      <div className={styles.footerActions}>
        <PrimaryButton className={styles.doneBtn} variant="ghost" onClick={onDone} pill>Done</PrimaryButton>
        <PrimaryButton className={styles.deleteBtn} variant="danger" onClick={onDelete} pill>Delete Society</PrimaryButton>
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
      <StandardModal title="Settings" onClose={onClose} size="sm" modalClassName={styles.modal}>
        <RatificationSection status={ratificationStatus} isRatified={isRatified} onRequest={onRequestRatification} compact />
        <AddCollaboratorSection onOpen={() => logic.setShowAdd(true)} />
        <CollaboratorsSection collabs={collabs} onUpdate={onUpdateRole} onRemove={onRemoveMember} />
        <DangerSection onDelete={() => logic.setShowDeleteConfirm(true)} onDone={onClose} />
      </StandardModal>
      {logic.showAdd && (
        <AddCollaboratorModal
          onClose={() => logic.setShowAdd(false)}
          onAdd={logic.handleAdd}
          existingUsernames={collabs.map((member) => member.username)}
        />
      )}
      {logic.showDeleteConfirm && (
        <HoldConfirmModal
          title="Delete Society"
          warningText="This will permanently delete this society and all of its linked content. This cannot be undone."
          cancelLabel="Keep Society"
          holdLabel="Hold to Delete"
          onCancel={() => logic.setShowDeleteConfirm(false)}
          onConfirm={() => { logic.setShowDeleteConfirm(false); onDelete?.(); onClose?.(); }}
        />
      )}
    </>
  );
}
