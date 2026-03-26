/**
 * Covers GroupWork hook combinations through a small test harness.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
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
} from "../../../pages/GroupWork/hooks/groupWorkHooks";

const locationState = { search: "?project=12&tab=availability" };
const fetchGroupProjectsMock = vi.fn();
const fetchProjectMembersMock = vi.fn();
const patchGroupProjectMock = vi.fn();
const deleteProjectMemberMock = vi.fn();
const deleteGroupProjectMock = vi.fn();

vi.mock("react-router-dom", () => ({
  useLocation: () => locationState,
}));

vi.mock("../../../pages/GroupWork/api/groupWorkApi", () => ({
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
    fetchGroupProjectsMock.mockReset();
    fetchProjectMembersMock.mockReset();
    patchGroupProjectMock.mockReset();
    deleteProjectMemberMock.mockReset();
    deleteGroupProjectMock.mockReset();

    fetchGroupProjectsMock.mockResolvedValue([
      { id: 12, title: "Alpha" },
      { id: 13, title: "Beta" },
    ]);
    fetchProjectMembersMock.mockResolvedValue([{ id: 2, name: "Alice" }]);
    patchGroupProjectMock.mockResolvedValue({ id: 12, title: "Patched" });
    deleteProjectMemberMock.mockResolvedValue({ ok: true });
    deleteGroupProjectMock.mockResolvedValue({ ok: true });
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
});
