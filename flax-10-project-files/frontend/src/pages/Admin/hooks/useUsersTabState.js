import { useEffect, useState } from "react";
import { fetchAdminUsers } from "../../../api/adminApi";
import { createEmptyUserFilters } from "../utils/userFilters";

export function useUsersTabState() {
  const [banTarget, setBanTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(createEmptyUserFilters());
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError("");
    fetchAdminUsers()
      .then(setUsers)
      .catch((value) => setError(value?.message || "Failed to load users."))
      .finally(() => setLoading(false));
  }, []);

  return {
    banTarget,
    busy,
    error,
    filters,
    loading,
    search,
    setBanTarget,
    setBusy,
    setError,
    setFilters,
    setSearch,
    setUsers,
    users,
  };
}
