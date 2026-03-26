/*
 * GroupWork add member form.
 */

<<<<<<< HEAD:flax-10-project-files/frontend/src/pages/GroupWork/components/AddMemberForm.jsx
import UserSearch from "../../../components/Social/UserSearch";
=======
import SearchEmptyState from "../../../components/common/search_empty_state/SearchEmptyState";
import UserSearch from "../../../components/Social/UserSearch";
>>>>>>> origin/main:flax-10-project-files/frontend/src/pages/group_work/components/AddMemberForm.jsx
import { addProjectMember } from "../api/groupWorkApi";
import GroupWorkUserSearchEmptyState from "./GroupWorkUserSearchEmptyState";
import styles from "./AddMemberForm.module.css";

export default function AddMemberForm({ projectId, members = [], onAdded }) {
  return (
    <div className={styles.addMemberForm}>
      <UserSearch
        onUserSelect={createSelectHandler(projectId, onAdded)}
        filterUsers={buildAvailableUserFilter(members)}
        fullWidth
        hideFilter
        searchPlaceholder="Search teammates to add..."
        openOnEmptyQuery={false}
        dropdownMode="inline"
        renderEmptyState={(props) => <AddMemberSearchEmptyState {...props} />}
      />
    </div>
  );
}

function AddMemberSearchEmptyState({ query, clear }) {
  return (
    <GroupWorkUserSearchEmptyState
      query={query}
      clear={clear}
      wrapperClassName={styles.inlineEmptyState}
      className={styles.inlineEmptyCard}
      titleClassName={styles.inlineEmptyTitle}
      hintClassName={styles.inlineEmptyHint}
    />
  );
}

function createSelectHandler(projectId, onAdded) {
  return async (user) => {
    if (!user?.id) return;
    const member = await addProjectMember(projectId, user.id);
    if (member) onAdded(member);
  };
}

function buildAvailableUserFilter(members) {
  const existingUserIds = new Set(members.map((member) => String(member.user ?? member.id ?? "")));
  return (results) => Array.isArray(results)
    ? results.filter((user) => !existingUserIds.has(String(user?.id ?? "")))
    : [];
}
