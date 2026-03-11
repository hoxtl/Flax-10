import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Token ${token}` } : {};
}

export function useGroupProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/group-work/projects/", {
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        });
        if (!res.ok) return setProjects([]);
        const data = await res.json();
        setProjects(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { projects, setProjects, loading };
}

export function useSelectedProjectId() {
  const location = useLocation();
  const params = new URLSearchParams(location.search || "");
  return params.get("project");
}

export function useProject(projectId) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/group-work/projects/", {
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        });
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        const found = list.find((item) => String(item.id) === String(projectId));
        setProject(found || null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  return { project, setProject, loading };
}

export function useProjectMembers(projectId) {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/group-work/projects/${projectId}/members/`, {
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      });
      if (!res.ok) return setMembers([]);
      const data = await res.json();
      setMembers(Array.isArray(data) ? data : []);
    }
    load();
  }, [projectId]);

  return { members, setMembers };
}

