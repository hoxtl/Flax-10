/*
 * GroupWork data hooks.
 */

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  deleteGroupProject,
  deleteProjectMember,
  fetchGroupProjects,
  fetchProjectMembers,
  patchGroupProject,
  getAuthHeaders,
} from "../api/groupWorkApi";
import { calcCompletionSegments } from "../utils/taskStatsUtils";

export { getAuthHeaders } from "../api/groupWorkApi";

/** Fetches and returns all group projects with a loading flag. */

export function useGroupProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroupProjects().then((data) => {
      setProjects(data || []);
      setLoading(false);
    });
  }, []);

  return { projects, setProjects, loading };
}

/** Returns the current sort key and a setter for group project sorting. */

export function useGroupProjectSort(defaultValue = "most-members") {
  const [sortBy, setSortBy] = useState(defaultValue);
  return { sortBy, setSortBy };
}

/** Reads the selected project ID from the URL search params. */

export function useSelectedProjectId() {
  const location = useLocation();
  const params = new URLSearchParams(location.search || "");
  return params.get("project");
}

/** Reads the active tab name from the URL search params, defaulting to "tasks". */

export function useSelectedTab() {
  const location = useLocation();
  const params = new URLSearchParams(location.search || "");
  return params.get("tab") || "tasks";
}

/** Fetches a single project by ID from the projects list. */

export function useProject(projectId) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroupProjects().then((data) => {
      setProject(findProjectById(data, projectId));
      setLoading(false);
    });
  }, [projectId]);

  return { project, setProject, loading };
}

function findProjectById(projects, projectId) {
  return (projects || []).find((item) => String(item.id) === String(projectId)) || null;
}

/** Fetches the member list for a project. */

export function useProjectMembers(projectId) {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    fetchProjectMembers(projectId).then((data) => setMembers(data || []));
  }, [projectId]);

  return { members, setMembers };
}

/** Returns action handlers for updating, removing members from, and deleting a project. */

export function useProjectActions(projectId, setProject, setMembers, onBack, onDelete, onUpdate) {
  const patchProject = async (patch) => updateProject(projectId, patch, setProject, onUpdate);
  const handleRemoveMember = async (membershipId) => removeProjectMember(projectId, membershipId, setMembers);
  const handleDeleteProject = async () => deleteProject(projectId, onDelete, onBack);
  return { patchProject, handleRemoveMember, handleDeleteProject };
}

async function updateProject(projectId, patch, setProject, onUpdate) {
  const updated = await patchGroupProject(projectId, patch);
  if (!updated) return;
  setProject(updated);
  onUpdate?.(updated);
}

async function removeProjectMember(projectId, membershipId, setMembers) {
  const response = await deleteProjectMember(projectId, membershipId);
  if (!response.ok) return false;
  setMembers((prev) => prev.filter((item) => item.id !== membershipId));
  return true;
}

async function deleteProject(projectId, onDelete, onBack) {
  const response = await deleteGroupProject(projectId);
  if (!response.ok) return false;
  if (onDelete) await onDelete(projectId);
  else onBack?.();
  return true;
}

function getInitialTaskStats() {
  return { percent: 0, completed: 0, total: 0, segments: [] };
}

function addMemberIfMissing(member, setMembers) {
  setMembers((prev) => (prev.some((item) => item.id === member.id) ? prev : [...prev, member]));
}

/** Fetches task stats eagerly so they're available regardless of which tab is active. */

function useEagerTaskStats(projectId) {
  const [taskStats, setTaskStats] = useState(getInitialTaskStats());
  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/tasks/?group_project=${projectId}`, { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then((tasks) => setTaskStats(calcCompletionSegments(tasks, [])));
  }, [projectId]);
  return [taskStats, setTaskStats];
}

/** Aggregates project state, member data, actions, and tab state for the detail page. */

export function useProjectDetail(projectId, onBack, onDelete, onUpdate) {
  const detail = useProjectState(projectId, onBack, onDelete, onUpdate);
  const initialTab = useSelectedTab();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [taskStats, setTaskStats] = useEagerTaskStats(projectId);
  return { ...detail, activeTab, setActiveTab, taskStats, setTaskStats };
}

function useProjectState(projectId, onBack, onDelete, onUpdate) {
  const { project, setProject, loading } = useProject(projectId);
  const { members, setMembers } = useProjectMembers(projectId);
  const actions = useProjectActions(projectId, setProject, setMembers, onBack, onDelete, onUpdate);
  const onAdded = (member) => addMemberIfMissing(member, setMembers);
  return { project, setProject, loading, members, onAdded, onBack, ...actions };
}
