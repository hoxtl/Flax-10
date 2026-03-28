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

async function syncCollaborator(user, members = [], onUpdate, onAdd) {
  const existing = members.find((member) => member.username?.toLowerCase() === user.username?.toLowerCase());
  if (existing) return onUpdate?.(existing.user, "editor");
  return onAdd?.(user.username, "editor");
}

function confirmSocietyDelete(onDelete, onClose, setShowDeleteConfirm) {
  setShowDeleteConfirm(false);
  onDelete?.();
  onClose?.();
}

function useSettings({ members, onFetchMembers, onUpdateRole, onAddCollaborator }) {
  const [showAdd, setShowAdd] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  useEffect(() => { onFetchMembers?.(); }, [onFetchMembers]);
  const handleAdd = async (users) => {
    await Promise.all(users.map((user) => syncCollaborator(user, members, onUpdateRole, onAddCollaborator)));
    await onFetchMembers?.();
  };
  return { showAdd, setShowAdd, showDeleteConfirm, setShowDeleteConfirm, handleAdd, collabs: (members || []).filter((member) => member.role !== "member") };
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

function SettingsContent({ onClose, ratificationStatus, isRatified, onRequestRatification, collabs, onUpdateRole, onRemoveMember, onConfirmDelete, onShowAdd }) {
  return (
    <StandardModal title="Settings" onClose={onClose} size="sm" modalClassName={styles.modal}>
      <RatificationSection status={ratificationStatus} isRatified={isRatified} onRequest={onRequestRatification} compact />
      <AddCollaboratorSection onOpen={onShowAdd} />
      <CollaboratorsSection collabs={collabs} onUpdate={onUpdateRole} onRemove={onRemoveMember} />
      <DangerSection onDelete={onConfirmDelete} onDone={onClose} />
    </StandardModal>
  );
}

function SettingsOverlays({ collabs, showAdd, setShowAdd, showDeleteConfirm, setShowDeleteConfirm, handleAdd, onDelete, onClose }) {
  return (
    <>
      {showAdd && <AddCollaboratorModal onClose={() => setShowAdd(false)} onAdd={handleAdd} existingUsernames={(collabs || []).map((member) => member.username)} />}
      {showDeleteConfirm && <HoldConfirmModal title="Delete Society" warningText="This will permanently delete this society and all of its linked content. This cannot be undone." cancelLabel="Keep Society" holdLabel="Hold to Delete" onCancel={() => setShowDeleteConfirm(false)} onConfirm={() => confirmSocietyDelete(onDelete, onClose, setShowDeleteConfirm)} />}
    </>
  );
}

/** Presents society admin settings for collaborators, ratification, and deletion. */
export default function SettingsModal(props) {
  const logic = useSettings(props);
  return (
    <>
      <SettingsContent onClose={props.onClose} ratificationStatus={props.ratificationStatus} isRatified={props.isRatified} onRequestRatification={props.onRequestRatification} collabs={logic.collabs} onUpdateRole={props.onUpdateRole} onRemoveMember={props.onRemoveMember} onConfirmDelete={() => logic.setShowDeleteConfirm(true)} onShowAdd={() => logic.setShowAdd(true)} />
      <SettingsOverlays collabs={logic.collabs} showAdd={logic.showAdd} setShowAdd={logic.setShowAdd} showDeleteConfirm={logic.showDeleteConfirm} setShowDeleteConfirm={logic.setShowDeleteConfirm} handleAdd={logic.handleAdd} onDelete={props.onDelete} onClose={props.onClose} />
    </>
  );
}
