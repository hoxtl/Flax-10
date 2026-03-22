/*
 * GroupWork add member form.
 */

import SearchEmptyState from "../../../components/common/SearchEmptyState/SearchEmptyState";
import UserSearch from "../../../components/Social/UserSearch";
import { addProjectMember } from "../groupWorkApi";
import styles from "./AddMemberForm.module.css";

export default function AddMemberForm({ projectId, members = [], onAdded }) {
  const renderEmptyState = ({ query, clear }) => (
    <div className={styles.inlineEmptyState}>
      <SearchEmptyState
        query={query}
        itemLabel="users"
        title="No teammates found"
        hint="Try a different name or username."
        onClear={clear}
        className={styles.inlineEmptyCard}
        titleClassName={styles.inlineEmptyTitle}
        hintClassName={styles.inlineEmptyHint}
      />
    </div>
  );

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
        renderEmptyState={renderEmptyState}
      />
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
