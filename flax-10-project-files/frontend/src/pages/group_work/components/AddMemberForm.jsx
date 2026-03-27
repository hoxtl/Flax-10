/*
 * GroupWork add member form.
 */

import UserSearch from "../../../components/social/components/UserSearch";
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
