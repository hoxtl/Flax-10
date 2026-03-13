import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const MIN_SKELETON_MS = 450;

export function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Token ${token}` } : {};
}

async function fetchJSON(url) {
  const h = { "Content-Type": "application/json", ...getAuthHeaders() };
  const res = await fetch(url, { headers: h });
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data) ? data : (data || null);
}

export function useGroupProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const startedAt = Date.now();
    fetchJSON("/api/group-work/projects/").then(data => {
      setProjects(data || []);
      const remaining = Math.max(0, MIN_SKELETON_MS - (Date.now() - startedAt));
      setTimeout(() => setLoading(false), remaining);
    });
  }, []);

  return { projects, setProjects, loading };
}

export function useSelectedProjectId() {
  const location = useLocation();
  const params = new URLSearchParams(location.search || "");
  return params.get("project");
}

export function useSelectedTab() {
  const location = useLocation();
  const params = new URLSearchParams(location.search || "");
  return params.get("tab") || "tasks";
}

export function useProject(projectId) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const startedAt = Date.now();
    fetchJSON("/api/group-work/projects/").then(data => {
      const found = (data || []).find(i => String(i.id) === String(projectId));
      setProject(found || null);
      const remaining = Math.max(0, MIN_SKELETON_MS - (Date.now() - startedAt));
      setTimeout(() => setLoading(false), remaining);
    });
  }, [projectId]);

  return { project, setProject, loading };
}

export function useProjectMembers(projectId) {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    fetchJSON(`/api/group-work/projects/${projectId}/members/`).then(data => {
      setMembers(data || []);
    });
  }, [projectId]);

  return { members, setMembers };
}
