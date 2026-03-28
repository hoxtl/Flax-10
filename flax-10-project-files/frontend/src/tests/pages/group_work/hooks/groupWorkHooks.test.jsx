/**
 * Covers GroupWork hook combinations through a small test harness.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

import {
  useGroupProjects,
  useGroupProjectSort,
  useSelectedProjectId,
  useSelectedTab,
  useProject,
  useProjectMembers,
  useProjectActions,
  useProjectDetail,
} from "../../../../pages/group_work/hooks/groupWorkHooks";

const locationState = { search: "?project=12&tab=availability" };
const fetchGroupProjectsMock = vi.fn();
const fetchProjectMembersMock = vi.fn();
const patchGroupProjectMock = vi.fn();
const deleteProjectMemberMock = vi.fn();
const deleteGroupProjectMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("react-router-dom", () => ({
  useLocation: () => locationState,
}));

vi.mock("../../../../pages/group_work/api/groupWorkApi", () => ({
  getAuthHeaders: vi.fn(() => ({ Authorization: "Token test" })),
  fetchGroupProjects: (...args) => fetchGroupProjectsMock(...args),
  fetchProjectMembers: (...args) => fetchProjectMembersMock(...args),
  patchGroupProject: (...args) => patchGroupProjectMock(...args),
  deleteProjectMember: (...args) => deleteProjectMemberMock(...args),
  deleteGroupProject: (...args) => deleteGroupProjectMock(...args),
}));

function HookHarnessView({ values, actions }) {
  return <div>
    {values.map(([id, value]) => <div key={id} data-testid={id}>{typeof value === "string" ? value : JSON.stringify(value)}</div>)}
    {actions.map(({ label, onClick }) => <button key={label} onClick={onClick}>{label}</button>)}
  </div>;
}

function buildHookValues(projectsState, sortState, selectedProjectId, selectedTab, projectState, membersState, detailState) {
  return [
    ["projects", projectsState.projects],
    ["projects-loading", String(projectsState.loading)],
    ["sort", sortState.sortBy],
    ["selected-project-id", selectedProjectId],
    ["selected-tab", selectedTab],
    ["project", projectState.project],
    ["project-loading", String(projectState.loading)],
    ["members", membersState.members],
    ["detail-tab", detailState.activeTab],
    ["detail-task-stats", detailState.taskStats],
    ["detail-members", detailState.members],
  ];
}

function buildHookActions(sortState, actionState, detailState) {
  return [
    { label: "change sort", onClick: () => sortState.setSortBy("name") },
    { label: "patch", onClick: () => actionState.patchProject({ title: "Patched" }) },
    { label: "remove member", onClick: () => actionState.handleRemoveMember(2) },
    { label: "delete project", onClick: () => actionState.handleDeleteProject() },
    { label: "add detail member", onClick: () => detailState.onAdded({ id: 9, name: "New member" }) },
    { label: "set detail tab", onClick: () => detailState.setActiveTab("members") },
  ];
}

function HookHarness({ projectId = 12, onBack = vi.fn(), onDelete = vi.fn(), onUpdate = vi.fn() }) {
  const projectsState = useGroupProjects();
  const sortState = useGroupProjectSort("priority");
  const selectedProjectId = useSelectedProjectId();
  const selectedTab = useSelectedTab();
  const projectState = useProject(projectId);
  const membersState = useProjectMembers(projectId);
  const actionState = useProjectActions(projectId, projectState.setProject, membersState.setMembers, onBack, onDelete, onUpdate);
  const detailState = useProjectDetail(projectId, onBack, onDelete, onUpdate);
  return <HookHarnessView values={buildHookValues(projectsState, sortState, selectedProjectId, selectedTab, projectState, membersState, detailState)} actions={buildHookActions(sortState, actionState, detailState)} />;
}

describe("groupWorkHooks", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchGroupProjectsMock.mockReset();
    fetchProjectMembersMock.mockReset();
    patchGroupProjectMock.mockReset();
    deleteProjectMemberMock.mockReset();
    deleteGroupProjectMock.mockReset();
    fetchMock.mockReset();

    fetchGroupProjectsMock.mockResolvedValue([
      { id: 12, title: "Alpha" },
      { id: 13, title: "Beta" },
    ]);
    fetchProjectMembersMock.mockResolvedValue([{ id: 2, name: "Alice" }]);
    patchGroupProjectMock.mockResolvedValue({ id: 12, title: "Patched" });
    deleteProjectMemberMock.mockResolvedValue({ ok: true });
    deleteGroupProjectMock.mockResolvedValue({ ok: true });
    fetchMock.mockResolvedValue({ ok: false });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads projects, project members, selected URL state, and detail defaults", async () => {
    render(<HookHarness />);

    await waitFor(() => expect(screen.getByTestId("projects-loading").textContent).toBe("false"));
    await waitFor(() => expect(screen.getByTestId("project-loading").textContent).toBe("false"));

    expect(screen.getByTestId("projects").textContent).toContain("Alpha");
    expect(screen.getByTestId("selected-project-id").textContent).toBe("12");
    expect(screen.getByTestId("selected-tab").textContent).toBe("availability");
    expect(screen.getByTestId("project").textContent).toContain("Alpha");
    expect(screen.getByTestId("members").textContent).toContain("Alice");
    expect(screen.getByTestId("detail-tab").textContent).toBe("availability");
    expect(screen.getByTestId("detail-task-stats").textContent).toContain('"percent":0');
  });

  it("uses the built-in sort default when no initial sort is provided", () => {
    function DefaultSortHarness() {
      const sortState = useGroupProjectSort();
      return <div data-testid="sort">{sortState.sortBy}</div>;
    }

    render(<DefaultSortHarness />);
    expect(screen.getByTestId("sort").textContent).toBe("most-members");
  });

  it("updates sort state and project actions", async () => {
    const onUpdate = vi.fn();
    const onDelete = vi.fn();

    render(<HookHarness onUpdate={onUpdate} onDelete={onDelete} />);
    await waitFor(() => expect(screen.getByTestId("projects").textContent).toContain("Alpha"));

    fireEvent.click(screen.getByText("change sort"));
    expect(screen.getByTestId("sort").textContent).toBe("name");

    fireEvent.click(screen.getByText("patch"));
    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith({ id: 12, title: "Patched" }));

    fireEvent.click(screen.getByText("remove member"));
    await waitFor(() => expect(screen.getByTestId("members").textContent).not.toContain("Alice"));

    fireEvent.click(screen.getByText("delete project"));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(12));
  });

  it("falls back to the default tab and supports adding members without duplicates", async () => {
    locationState.search = "";
    render(<HookHarness />);
    await waitFor(() => expect(screen.getByTestId("detail-members").textContent).toContain("Alice"));

    expect(screen.getByTestId("selected-tab").textContent).toBe("tasks");
    fireEvent.click(screen.getByText("set detail tab"));
    expect(screen.getByTestId("detail-tab").textContent).toBe("members");

    fireEvent.click(screen.getByText("add detail member"));
    expect(screen.getByTestId("detail-members").textContent).toContain("New member");

    fireEvent.click(screen.getByText("add detail member"));
    expect(screen.getByTestId("detail-members").textContent.match(/New member/g)).toHaveLength(1);
  });

  it("returns null when the URL does not contain a selected project id", async () => {
    locationState.search = "?tab=tasks";
    render(<HookHarness />);
    await waitFor(() => expect(screen.getByTestId("projects-loading").textContent).toBe("false"));
    expect(screen.getByTestId("selected-project-id").textContent).toBe("null");
    expect(screen.getByTestId("selected-tab").textContent).toBe("tasks");
  });

  it("handles fetchGroupProjects returning null (useGroupProjects fallback)", async () => {
    fetchGroupProjectsMock.mockResolvedValue(null);
    render(<HookHarness />);
    await waitFor(() => expect(screen.getByTestId("projects-loading").textContent).toBe("false"));
    expect(screen.getByTestId("projects").textContent).toBe("[]");
  });

  it("handles fetchProjectMembers returning null (useProjectMembers fallback)", async () => {
    fetchProjectMembersMock.mockResolvedValue(null);
    render(<HookHarness />);
    await waitFor(() => expect(screen.getByTestId("projects-loading").textContent).toBe("false"));
    expect(screen.getByTestId("members").textContent).toBe("[]");
  });

  it("handles findProjectById when projects is null (useProject fallback)", async () => {
    fetchGroupProjectsMock.mockResolvedValue(null);
    render(<HookHarness />);
    await waitFor(() => expect(screen.getByTestId("project-loading").textContent).toBe("false"));
    expect(screen.getByTestId("project").textContent).toBe("null");
  });

  it("handles patchGroupProject returning null (updateProject early return)", async () => {
    patchGroupProjectMock.mockResolvedValue(null);
    const onUpdate = vi.fn();
    render(<HookHarness onUpdate={onUpdate} />);
    await waitFor(() => expect(screen.getByTestId("projects").textContent).toContain("Alpha"));

    fireEvent.click(screen.getByText("patch"));
    await waitFor(() => expect(patchGroupProjectMock).toHaveBeenCalled());
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("handles removeProjectMember when response.ok is false", async () => {
    deleteProjectMemberMock.mockResolvedValue({ ok: false });
    render(<HookHarness />);
    await waitFor(() => expect(screen.getByTestId("members").textContent).toContain("Alice"));

    fireEvent.click(screen.getByText("remove member"));
    await waitFor(() => expect(deleteProjectMemberMock).toHaveBeenCalled());
    // Member should still be present since removal failed
    expect(screen.getByTestId("members").textContent).toContain("Alice");
  });

  it("handles deleteProject when response.ok is false", async () => {
    deleteGroupProjectMock.mockResolvedValue({ ok: false });
    const onDelete = vi.fn();
    const onBack = vi.fn();
    render(<HookHarness onDelete={onDelete} onBack={onBack} />);
    await waitFor(() => expect(screen.getByTestId("projects").textContent).toContain("Alpha"));

    fireEvent.click(screen.getByText("delete project"));
    await waitFor(() => expect(deleteGroupProjectMock).toHaveBeenCalled());
    expect(onDelete).not.toHaveBeenCalled();
    expect(onBack).not.toHaveBeenCalled();
  });

  it("calls onBack when deleteProject succeeds but onDelete is not provided", async () => {
    const onBack = vi.fn();
    // Pass undefined for onDelete so the else branch triggers onBack
    function HarnessNoOnDelete() {
      const projectsState = useGroupProjects();
      const sortState = useGroupProjectSort("priority");
      const selectedProjectId = useSelectedProjectId();
      const selectedTab = useSelectedTab();
      const projectState = useProject(12);
      const membersState = useProjectMembers(12);
      const actionState = useProjectActions(12, projectState.setProject, membersState.setMembers, onBack, undefined, vi.fn());
      const detailState = useProjectDetail(12, onBack, undefined, vi.fn());
      return <HookHarnessView values={buildHookValues(projectsState, sortState, selectedProjectId, selectedTab, projectState, membersState, detailState)} actions={buildHookActions(sortState, actionState, detailState)} />;
    }
    render(<HarnessNoOnDelete />);
    await waitFor(() => expect(screen.getByTestId("projects").textContent).toContain("Alpha"));

    fireEvent.click(screen.getByText("delete project"));
    await waitFor(() => expect(onBack).toHaveBeenCalled());
  });

  it("matches project ids even when the input type differs", async () => {
    function NumericProjectHarness() {
      const projectState = useProject("12");
      return <div data-testid="project">{JSON.stringify(projectState.project)}</div>;
    }

    render(<NumericProjectHarness />);
    await waitFor(() => expect(screen.getByTestId("project").textContent).toContain("Alpha"));
  });

  it("hydrates eager task stats from the task API when the fetch succeeds", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 1, completed: true, assignees_info: [] }],
    });

    render(<HookHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("detail-task-stats").textContent).toContain('"percent":100');
    });
  });

  it("falls back to empty eager task stats when the task API rejects", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network"));

    render(<HookHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("detail-task-stats").textContent).toContain('"segments":[]');
    });
  });

  it("skips eager task fetching when no project id is provided", async () => {
    render(<HookHarness projectId={null} />);

    await waitFor(() => expect(screen.getByTestId("projects-loading").textContent).toBe("false"));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("detail-task-stats").textContent).toContain('"percent":0');
  });

  it("uses the localhost fallback when window.location.origin is unavailable", async () => {
    vi.stubGlobal("location", undefined);

    render(<HookHarness />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(String(fetchMock.mock.calls[0][0])).toContain("http://localhost/api/tasks/?group_project=12");
  });
});
