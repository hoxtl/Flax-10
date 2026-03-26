/*
 * GroupWork add member form.
 */

import SearchEmptyState from "../../../components/common/search_empty_state/SearchEmptyState";
import UserSearch from "../../../components/social/UserSearch";
import { addProjectMember } from "../api/groupWorkApi";
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
    <div className={styles.inlineEmptyState}>
      <SearchEmptyState query={query} itemLabel="users" title="No teammates found" hint="Try a different name or username." onClear={clear} className={styles.inlineEmptyCard} titleClassName={styles.inlineEmptyTitle} hintClassName={styles.inlineEmptyHint} />
    </div>
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
