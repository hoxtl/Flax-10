/*
 * GroupWork add member form.
 */

import UserSearch from "../../../components/Social/UserSearch";
import { addProjectMember } from "../groupWorkApi";
import styles from "./AddMemberForm.module.css";

export default function AddMemberForm({ projectId, onAdded }) {
  return (
    <div className={styles.addMemberForm}>
      <UserSearch onUserSelect={createSelectHandler(projectId, onAdded)} fullWidth hideFilter compact />
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
