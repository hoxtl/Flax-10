/*
 * GroupWork create project form.
 */

import { useState } from "react";
import FormField from "../../../components/common/FormField/FormField";
import PrimaryButton from "../../../components/common/PrimaryButton/PrimaryButton";
import SearchEmptyState from "../../../components/common/SearchEmptyState/SearchEmptyState";
import StandardModal from "../../../components/common/StandardModal/StandardModal";
import { TagsSelector } from "../../../components/common/TagsSelector/TagsSelector";
import UserSearch from "../../../components/Social/UserSearch";
import { CreateProjectInputs } from "./CreateProjectInputs";
import { getStoredViewer } from "../utils/memberAvatarUtils";
import { useCreateProjectForm } from "./useCreateProjectForm";
import styles from "./CreateProjectForm.module.css";



/** Button and modal form for creating a new group project. */

export default function CreateProjectForm({ onCreated, className = "", size = "medium" }) {
  const [isOpen, setIsOpen] = useState(false);
  const formState = useCreateProjectForm((project) => {
    onCreated?.(project);
    setIsOpen(false);
  });
  return (
    <>
      <PrimaryButton type="button" size={size} className={className ? `${styles.triggerBtn} ${className}` : styles.triggerBtn} pill onClick={() => setIsOpen(true)}>
        + Create project
      </PrimaryButton>
      {isOpen && (
        <CreateProjectModal
          formState={formState}
          onClose={() => closeModal(setIsOpen, formState.reset)}
        />
      )}
    </>
  );
}

function FormActions({ onClose, isSubmitting }) {
  return (
    <div className={styles.formFooter}>
      <PrimaryButton type="button" variant="ghost" className={styles.cancelBtn} onClick={onClose} disabled={isSubmitting}>
        Cancel
      </PrimaryButton>
      <PrimaryButton type="submit" className={styles.submitBtn} pill disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "+ Create project"}
      </PrimaryButton>
    </div>
  );
}

function CreateProjectModal({ formState, onClose }) {
  return (
    <StandardModal title="Create project" subtitle="Start a shared project, connect it to a module, invite teammates, and keep the deadline clear from day one." subtitleClassName={styles.modalSubtitle} onClose={onClose} size="xl" modalClassName={styles.modalPanel} contentClassName={styles.modalContent}>
      <form onSubmit={formState.submit} className={styles.modalForm}>
        <div className={styles.formFields}>
          <CreateProjectInputs data={formState.form} onChange={formState.change} errors={formState.errors} />
        </div>
        <ProjectMembersField members={formState.form.members} error={formState.errors?.members} onAddMember={formState.addMember} onRemoveMember={formState.removeMember} />
        {formState.errorMessage && <p className={styles.formError}>{formState.errorMessage}</p>}
        <FormActions onClose={onClose} isSubmitting={formState.isSubmitting} />
      </form>
    </StandardModal>
  );
}

function closeModal(setIsOpen, reset) {
  setIsOpen(false);
  reset();
}

function MemberSearchEmptyState({ query, clear }) {
  return (
    <div className={styles.memberSearchEmpty}>
      <SearchEmptyState query={query} itemLabel="users" title="No teammates found" hint="Try a different name or username." onClear={clear} className={styles.memberSearchEmptyCard} titleClassName={styles.memberSearchEmptyTitle} hintClassName={styles.memberSearchEmptyHint} />
    </div>
  );
}

function ProjectMembersField({ members, error, onAddMember, onRemoveMember }) {
  return (
    <FormField label="Team members (optional)" labelClassName={styles.fieldLabel} className={styles.membersField} error={error}>
      <div className={styles.membersPicker}>
        <p className={styles.membersHint}>Add teammates now so availability, tasks, and voting are ready from the start.</p>
        <UserSearch
          onUserSelect={onAddMember}
          filterUsers={buildAvailableUserFilter(members)}
          fullWidth
          hideFilter
          renderEmptyState={(props) => <MemberSearchEmptyState {...props} />}
          searchPlaceholder="Search users... (/)"
          openOnEmptyQuery={false}
          dropdownMode="inline"
        />
        <SelectedMemberTags members={members} onRemove={onRemoveMember} />
      </div>
    </FormField>
  );
}

function SelectedMemberTags({ members, onRemove }) {
  const tags = members.map((member) => ({ id: member.id, label: getSelectedUserLabel(member) }));
  return (
    <TagsSelector
      tags={tags}
      selectedTags={tags}
      emptyHint="Search for teammates (optional)."
      onSelectionChange={(nextSelected) => syncRemovedMemberTags(tags, nextSelected, onRemove)}
    />
  );
}

function buildAvailableUserFilter(selectedMembers) {
  const selectedIds = new Set(selectedMembers.map((member) => String(member.id)));
  const viewer = getStoredViewer();
  const viewerId = String(viewer.id ?? viewer.user ?? "");
  const viewerUsername = String(viewer.username || viewer.user_name || "").trim().toLowerCase();
  const context = { selectedIds, viewerId, viewerUsername };
  return (results) => {
    if (!Array.isArray(results)) return [];
    return results.filter((user) => isUserAvailable(user, context));
  };
}

function isUserAvailable(user, { selectedIds, viewerId, viewerUsername }) {
  const userId = String(user?.id ?? "");
  const username = String(user?.username || user?.user_name || "").trim().toLowerCase();
  if (!userId || selectedIds.has(userId)) return false;
  if (viewerId && userId === viewerId) return false;
  if (viewerUsername && username && username === viewerUsername) return false;
  return true;
}

function getSelectedUserLabel(member) {
  const fullName = `${member?.first_name || ""} ${member?.last_name || ""}`.trim();
  return fullName || member?.username || member?.user_name || member?.name || "User";
}

function syncRemovedMemberTags(currentTags, nextTags, onRemove) {
  const nextIds = new Set(nextTags.map((tag) => String(tag.id)));
  currentTags
    .filter((tag) => !nextIds.has(String(tag.id)))
    .forEach((tag) => onRemove(tag.id));
}

function RequiredLabel({ text }) {
  return (
    <>
      {text} <span className={styles.requiredMark}>*</span>
    </>
  );
}
