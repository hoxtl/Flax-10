/*
 * Admin users tab state hook.
 */
import { useEffect, useState } from "react";
import { fetchAdminUsers } from "../../../api/adminApi";
import { createEmptyUserFilters } from "../utils/userFilters";

function useUsersData(setLoading, setError) {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    setLoading(true);
    setError("");
    fetchAdminUsers().then(setUsers).catch((value) => setError(value?.message || "Failed to load users.")).finally(() => setLoading(false));
  }, [setLoading, setError]);
  return { users, setUsers };
}

function useUsersControls() {
  const [banTarget, setBanTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(createEmptyUserFilters());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  return { banTarget, setBanTarget, busy, setBusy, error, setError, filters, setFilters, search, setSearch, loading, setLoading };
}

export function useUsersTabState() {
  const controls = useUsersControls();
  const { users, setUsers } = useUsersData(controls.setLoading, controls.setError);
  return { ...controls, users, setUsers };
}
