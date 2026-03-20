/** Shared hooks and filter utilities for admin data management. */
import { useState, useEffect, useMemo, useCallback } from "react";

const PAGE_SIZE = 20;

export const USER_FILTER_GROUPS = {
  roles: [
    { value: "student", label: "Student" },
    { value: "teacher", label: "Teacher" },
  ],
  staff: [{ value: "staff", label: "Staff" }],
  status: [
    { value: "active", label: "Active" },
    { value: "banned", label: "Banned" },
  ],
};

export function usePaginatedItems(items, pageSize = PAGE_SIZE) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = useMemo(() => Math.max(1, Math.ceil((items?.length || 0) / pageSize)), [items, pageSize]);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(1); }, [currentPage, totalPages]);
  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return (items || []).slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);
  return { currentPage, setCurrentPage, totalPages, pageItems };
}

export function useAsyncList(fetchFn) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setItems(await fetchFn()); }
    catch (e) { setError(e.message || "Failed to load data."); }
    finally { setLoading(false); }
  }, [fetchFn]);
  useEffect(() => { load(); }, [load]);
  return { items, setItems, loading, error, setError, reload: load };
}

export function toggleArrayValue(arr, value) {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

function matchesRoleFilter(user, selectedRoles) {
  if (!selectedRoles.length) return true;
  return selectedRoles.some((role) => {
    if (role === "teacher") return user.role === "teacher" || user.role === "pending_teacher";
    if (role === "student") return user.role === "student";
    return false;
  });
}

function matchesStaffFilter(user, selectedStaff) {
  if (!selectedStaff.length) return true;
  return selectedStaff.some((opt) => opt === "staff" && (!!user.is_staff || !!user.is_superuser));
}

function matchesStatusFilter(user, selectedStatus) {
  if (!selectedStatus.length) return true;
  return selectedStatus.some((status) => {
    if (status === "active") return !!user.is_active;
    if (status === "banned") return !user.is_active;
    return false;
  });
}

export function matchesAllUserFilters(user, filters) {
  return matchesRoleFilter(user, filters.roles) && matchesStaffFilter(user, filters.staff) && matchesStatusFilter(user, filters.status);
}

export const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.28, ease: "easeOut" },
};

export const stagger = { animate: { transition: { staggerChildren: 0.055 } } };

export const rowAnim = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10 },
  transition: { duration: 0.2 },
};

export function useAsyncAction(setError) {
  const [busy, setBusy] = useState(null);
  const execute = (id, action, onSuccess) => {
    setBusy(id);
    action().then(onSuccess).catch((e) => setError(e.message || "Action failed.")).finally(() => setBusy(null));
  };
  return { busy, execute };
}
