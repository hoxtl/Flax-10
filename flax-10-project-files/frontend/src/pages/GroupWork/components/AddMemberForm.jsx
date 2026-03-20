import React from "react";
import UserSearch from "../../../components/Social/UserSearch";
import { getAuthHeaders } from "../groupWorkHooks";
import styles from "./AddMemberForm.module.css";

export default function AddMemberForm({ projectId, onAdded }) {
  const handleSelect = async (user) => {
    if (!user?.id) return;
    const body = JSON.stringify({ user: user.id, role: "member" });
    const res = await fetch(`/api/group-work/projects/${projectId}/members/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body,
    });
    if (res.ok) onAdded(await res.json());
  };

  return (
    <div className={styles.addMemberForm}>
      <UserSearch
        onUserSelect={handleSelect}
        fullWidth
        hideFilter
        compact
      />
    </div>
  );
}
