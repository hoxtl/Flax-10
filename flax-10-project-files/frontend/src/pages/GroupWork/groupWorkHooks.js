import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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
export function useProjectActions(projectId, setProject, setMembers, onBack, onDelete, onUpdate) {
  const patchProject = async p => {
    const res = await fetch(`/api/group-work/projects/${projectId}/`, { 
        method: "PATCH", 
        headers: { "Content-Type": "application/json", ...getAuthHeaders() }, 
        body: JSON.stringify(p) 
    });
    if (res.ok) {
        const updated = await res.json();
        setProject(updated);
        if (onUpdate) onUpdate(updated);
    }
  };
  const handleRemoveMember = async mid => {
    const res = await fetch(`/api/group-work/projects/${projectId}/members/${mid}/`, { 
        method: "DELETE", 
        headers: getAuthHeaders() 
    });
    if (res.ok) setMembers(prev => prev.filter(i => i.id !== mid));
  };
  const handleDeleteProject = async () => {
    const res = await fetch(`/api/group-work/projects/${projectId}/`, { 
        method: "DELETE", 
        headers: getAuthHeaders() 
    });
    if (res.ok) {
        if (onDelete) onDelete(projectId);
        onBack();
    }
  };
  return { patchProject, handleRemoveMember, handleDeleteProject };
}

export function useProjectDetail(projectId, onBack, onDelete, onUpdate) {
  const { project, setProject, loading } = useProject(projectId);
  const { members, setMembers } = useProjectMembers(projectId);
  const initialTab = useSelectedTab();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [taskStats, setTaskStats] = useState({ percent: 0, completed: 0, total: 0, segments: [] });
  
  const actions = useProjectActions(projectId, setProject, setMembers, onBack, onDelete, onUpdate);

  const onAdded = m => setMembers(p => p.some(i => i.id === m.id) ? p : [...p, m]);

  return { 
      project, loading, members, activeTab, setActiveTab, taskStats, setTaskStats, 
      onAdded, ...actions 
  };
}
