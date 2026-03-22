/*
 * GroupWork create project form.
 */

import { useState } from "react";
import FormField from "../../../components/Common/FormField/FormField";
import PrimaryButton from "../../../components/Common/PrimaryButton/PrimaryButton";
import SearchEmptyState from "../../../components/Common/SearchEmptyState/SearchEmptyState";
import StandardModal from "../../../components/Common/StandardModal/StandardModal";
import { TagsSelector } from "../../../components/Common/TagsSelector/TagsSelector";
import UserSearch from "../../../components/Social/UserSearch";
import { CreateProjectInputs } from "./CreateProjectInputs";
import { createGroupProject } from "../api/groupWorkApi";
import styles from "./CreateProjectForm.module.css";

function RequiredLabel({ text }) {
  return <>{text} <span className={styles.requiredMark}>*</span></>;
}

function closeModal(setIsOpen, reset) {
  setIsOpen(false);
  reset();
}

function resetProjectForm(setForm, setErrors, setErrorMessage, setIsSubmitting) {
  setForm({ name: "", course_code: "", deadline: "", members: [] });
  setErrors({});
  setErrorMessage("");
  setIsSubmitting(false);
}

function isPastProjectDeadline(value) {
  if (!value) return false;
  const selectedDate = parseProjectDeadline(value);
  if (Number.isNaN(selectedDate.getTime())) return false;
  selectedDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selectedDate < today;
}

function parseProjectDeadline(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(value);
}

function getStoredViewer() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function buildAvailableUserFilter(selectedMembers) {
  const selectedIds = new Set(selectedMembers.map((member) => String(member.id)));
  const viewer = getStoredViewer();
  const viewerId = String(viewer.id ?? viewer.user ?? "");
  const viewerUsername = String(viewer.username || viewer.user_name || "").trim().toLowerCase();
  return (results) => {
    if (!Array.isArray(results)) return [];
    return results.filter((user) => {
      const userId = String(user?.id ?? "");
      const username = String(user?.username || user?.user_name || "").trim().toLowerCase();
      if (!userId || selectedIds.has(userId)) return false;
      if (viewerId && userId === viewerId) return false;
      if (viewerUsername && username && username === viewerUsername) return false;
      return true;
    });
  };
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

function validateProjectForm(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Project name is required.";
  if (!String(form.course_code || "").trim()) errors.course_code = "Module is required.";
  if (!form.deadline) errors.deadline = "Due date is required.";
  else if (isPastProjectDeadline(form.deadline)) errors.deadline = "Project due date can't be in the past.";
  if (!Array.isArray(form.members) || form.members.length === 0) errors.members = "Select at least one teammate.";
  return errors;
}

function showFormErrors(nextErrors, setErrors, setErrorMessage) {
  setErrors(nextErrors);
  setErrorMessage("Please fix the highlighted fields.");
}

function buildProjectPayload(form) {
  return {
    name: form.name,
    course_code: form.course_code,
    deadline: form.deadline,
    member_ids: form.members.map((member) => member.id),
  };
}

function createChangeHandler(setForm, setErrors, setErrorMessage) {
  return (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({
      ...prev,
      [key]: key === "deadline" && isPastProjectDeadline(value) ? "Project due date can't be in the past." : "",
    }));
    setErrorMessage("");
  };
}

function createAddMemberHandler(setForm, setErrors, setErrorMessage) {
  return (user) => {
    if (!user?.id) return;
    setErrors((prev) => ({ ...prev, members: "" }));
    setErrorMessage("");
    setForm((prev) => {
      if (prev.members.some((member) => String(member.id) === String(user.id))) return prev;
      return { ...prev, members: [...prev.members, user] };
    });
  };
}

function createRemoveMemberHandler(setForm, setErrors, setErrorMessage) {
  return (userId) => {
    setErrors((prev) => ({ ...prev, members: "" }));
    setErrorMessage("");
    setForm((prev) => ({ ...prev, members: prev.members.filter((member) => String(member.id) !== String(userId)) }));
  };
}

function createSubmitHandler(form, setForm, setErrors, setErrorMessage, setIsSubmitting, onCreated) {
  return async (event) => {
    event.preventDefault();
    const nextErrors = validateProjectForm(form);
    if (Object.keys(nextErrors).length > 0) return showFormErrors(nextErrors, setErrors, setErrorMessage);
    setIsSubmitting(true);
    const created = await createGroupProject(buildProjectPayload(form));
    if (!created) {
      setIsSubmitting(false);
      return setErrorMessage("We couldn't create that project. Please try again.");
    }
    onCreated?.(created);
    resetProjectForm(setForm, setErrors, setErrorMessage, setIsSubmitting);
  };
}

function useCreateProjectForm(onCreated) {
  const [form, setForm] = useState({ name: "", course_code: "", deadline: "", members: [] });
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const reset = () => resetProjectForm(setForm, setErrors, setErrorMessage, setIsSubmitting);
  return {
    form,
    errors,
    errorMessage,
    isSubmitting,
    reset,
    change: createChangeHandler(setForm, setErrors, setErrorMessage),
    addMember: createAddMemberHandler(setForm, setErrors, setErrorMessage),
    removeMember: createRemoveMemberHandler(setForm, setErrors, setErrorMessage),
    submit: createSubmitHandler(form, setForm, setErrors, setErrorMessage, setIsSubmitting, onCreated),
  };
}

function MemberSearchEmptyState({ query, clear }) {
  return (
    <div className={styles.memberSearchEmpty}>
      <SearchEmptyState
        query={query}
        itemLabel="users"
        title="No teammates found"
        hint="Try a different name or username."
        onClear={clear}
        className={styles.memberSearchEmptyCard}
        titleClassName={styles.memberSearchEmptyTitle}
        hintClassName={styles.memberSearchEmptyHint}
      />
    </div>
  );
}

function SelectedMemberTags({ members, onRemove }) {
  const tags = members.map((member) => ({ id: member.id, label: getSelectedUserLabel(member) }));
  return (
    <TagsSelector
      tags={tags}
      selectedTags={tags}
      emptyHint="Search and add at least one teammate."
      onSelectionChange={(nextSelected) => syncRemovedMemberTags(tags, nextSelected, onRemove)}
    />
  );
}

function ProjectMembersSearch({ members, onAddMember }) {
  return (
    <UserSearch
      onUserSelect={onAddMember}
      filterUsers={buildAvailableUserFilter(members)}
      fullWidth
      hideFilter
      renderEmptyState={({ query, clear }) => <MemberSearchEmptyState query={query} clear={clear} />}
      searchPlaceholder="Search users... (/)"
      openOnEmptyQuery={false}
      dropdownMode="inline"
    />
  );
}

function ProjectMembersField({ members, error, onAddMember, onRemoveMember }) {
  return (
    <FormField label={<RequiredLabel text="Team members" />} labelClassName={styles.fieldLabel} className={styles.membersField} error={error}>
      <div className={styles.membersPicker}>
        <p className={styles.membersHint}>Add teammates now so availability, tasks, and voting are ready from the start.</p>
        <ProjectMembersSearch members={members} onAddMember={onAddMember} />
        <SelectedMemberTags members={members} onRemove={onRemoveMember} />
      </div>
    </FormField>
  );
}

function ModalFormFooter({ onClose, isSubmitting }) {
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

function CreateProjectModalBody({ formState, onClose }) {
  return (
    <form onSubmit={formState.submit} className={styles.modalForm}>
      <div className={styles.formFields}>
        <CreateProjectInputs data={formState.form} onChange={formState.change} errors={formState.errors} />
      </div>
      <ProjectMembersField members={formState.form.members} error={formState.errors?.members} onAddMember={formState.addMember} onRemoveMember={formState.removeMember} />
      {formState.errorMessage ? <p className={styles.formError}>{formState.errorMessage}</p> : null}
      <ModalFormFooter onClose={onClose} isSubmitting={formState.isSubmitting} />
    </form>
  );
}

function CreateProjectModal({ formState, onClose }) {
  return (
    <StandardModal
      title="Create project"
      subtitle="Start a shared project, connect it to a module, invite teammates, and keep the deadline clear from day one."
      subtitleClassName={styles.modalSubtitle}
      onClose={onClose}
      size="xl"
      modalClassName={styles.modalPanel}
      contentClassName={styles.modalContent}
    >
      <CreateProjectModalBody formState={formState} onClose={onClose} />
    </StandardModal>
  );
}

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
