/*
 * Tests for GroupTasksTab interactions, GroupWorkIndexPage routing,
 * and project creation callbacks.
 */

import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockNavigate = vi.fn();
const useSelectedProjectId = vi.fn();
const useGroupProjects = vi.fn();
const useGroupProjectSort = vi.fn();
const useToast = vi.fn();
const useAuthMock = vi.fn();
const useGroupTasksTabState = vi.fn();
const getProjectDate = vi.fn();
const formatProjectHeadlineDate = vi.fn();
const getProjectCaption = vi.fn();
const getProjectTeacherName = vi.fn();
const getProjectMemberCount = vi.fn();
const openTeacherProfile = vi.fn();
const getStoredViewer = vi.fn();

const buildTaskActions = () => ({
  loading: false,
  addTask: vi.fn().mockResolvedValue(undefined),
  updateTask: vi.fn().mockResolvedValue(undefined),
  deleteTask: vi.fn().mockResolvedValue(undefined),
});

const mockGroupTasksState = (overrides = {}) => {
  const taskActions = overrides.taskActions ?? buildTaskActions();
  const state = {
    taskActions,
    filterUsers: [],
    setFilterUsers: vi.fn(),
    taskView: "list",
    setTaskView: vi.fn(),
    showAddModal: false,
    setShowAddModal: vi.fn(),
    sortedTasks: [{ id: 1, title: "Task A" }],
    ...overrides,
  };
  useGroupTasksTabState.mockReturnValue(state);
  return state;
};

const renderGroupTasksTab = (stateOverrides = {}) => {
  const state = mockGroupTasksState(stateOverrides);
  render(<GroupTasksTab projectId={3} members={[{ user: 2, name: "Alex" }]} onStatsUpdate={vi.fn()} />);
  return state;
};

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
}));

vi.mock("@/context/ToastContext", () => ({ useToast: () => useToast() }));

vi.mock("@/context/AuthContext", () => ({ useAuth: () => useAuthMock() }));

vi.mock("../../../../pages/group_work/hooks/groupWorkHooks", () => ({
  useSelectedProjectId: () => useSelectedProjectId(),
  useGroupProjects: () => useGroupProjects(),
  useGroupProjectSort: () => useGroupProjectSort(),
  getAuthHeaders: () => ({ Authorization: "Token test" }),
}));

vi.mock("../../../../pages/group_work/hooks/useGroupTasksTabState", () => ({
  useGroupTasksTabState: (...args) => useGroupTasksTabState(...args),
}));

vi.mock("@/pages/group_work/components/MemberFilter", () => ({
  default: ({ onToggle }) => <button type="button" onClick={() => onToggle("2")}>toggle-filter</button>,
}));

vi.mock("@/pages/group_work/components/AddTaskModal", () => ({
  default: ({ onAdd, onClose }) => (
    <div>
      <button type="button" onClick={() => onAdd({ title: "New task", due_date: "2026-03-30", assigned_to: [2] })}>confirm-add-task</button>
      <button type="button" onClick={onClose}>close-add-modal</button>
    </div>
  ),
}));

vi.mock("@/pages/group_work/components/TaskListView", () => ({
  default: ({ tasks, onToggle, onUpdate, onDelete }) => (
    <div>
      <span>list:{tasks.length}</span>
      <button type="button" onClick={() => onToggle(1, true)}>toggle-task</button>
      <button type="button" onClick={() => onUpdate(1, { title: "Edited" })}>update-task</button>
      <button type="button" onClick={() => onDelete(1)}>delete-task</button>
    </div>
  ),
}));

vi.mock("@/pages/group_work/components/TaskTimelineView", () => ({
  default: () => <div>timeline-view</div>,
}));

vi.mock("@/pages/group_work/components/TaskBoardView", () => ({
  default: ({ onAdd }) => <button type="button" onClick={() => onAdd("Quick add", "todo")}>board-add</button>,
}));

vi.mock("@/components/common/segmented_control/SegmentedControl.jsx", () => ({
  SegmentedControl: ({ options, onChange }) => (
    <div>
      {options.map((option) => (
        <button key={option.value} type="button" onClick={() => onChange(option.value)}>{option.label}</button>
      ))}
    </div>
  ),
}));

vi.mock("@/components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, onClick, ...props }) => <button type="button" onClick={onClick} {...props}>{children}</button>,
}));

vi.mock("lucide-react", () => ({
  List: () => <span>list-icon</span>,
  CalendarIcon: () => <span>calendar-icon</span>,
  Square: () => <span>square-icon</span>,
  Plus: () => <span>plus-icon</span>,
  CalendarDays: () => <span>calendar-days</span>,
  BookOpen: () => <span>book-open</span>,
  UserRound: () => <span>user-round</span>,
  Trash2: () => <span>trash-icon</span>,
  LogOut: () => <span>logout-icon</span>,
  Settings: () => <span>settings-icon</span>,
  Search: () => <span>search-icon</span>,
}));

vi.mock("@/components/common/app_page/AppPage", () => ({
  default: ({ title, subtitle, children }) => <div><h1>{title}</h1><div>{subtitle}</div>{children}</div>,
}));

vi.mock("@/components/pagination/Pagination", () => ({ BackToTop: () => <div>Back to top</div> }));

vi.mock("@/pages/group_work/components/GroupWorkDetail", () => ({
  default: ({ onBack }) => <button type="button" onClick={onBack}>detail-view</button>,
}));

vi.mock("@/pages/group_work/components/GroupWorkIndexSkeleton", () => ({
  default: () => <div>groupwork-skeleton</div>,
}));

vi.mock("@/pages/group_work/components/GroupWorkContent", () => ({
  default: ({ projects, projectListProps, onProjectCreated, sortBy, setSortBy }) => (
    <div>
      <span>content:{projects.length}</span>
      <span>sort:{sortBy}</span>
      <button type="button" onClick={() => projectListProps(projects[0]).onClick()}>open-project</button>
      <button type="button" onClick={() => onProjectCreated({ id: 2, name: "New project" })}>prepend-project</button>
      <button type="button" onClick={() => setSortBy("name")}>set-sort</button>
    </div>
  ),
}));

vi.mock("../../../../pages/group_work/utils/projectRowUtils", () => ({
  getProjectDate: (...args) => getProjectDate(...args),
  formatProjectHeadlineDate: (...args) => formatProjectHeadlineDate(...args),
  getProjectCaption: (...args) => getProjectCaption(...args),
  getProjectTeacherName: (...args) => getProjectTeacherName(...args),
  getProjectMemberCount: (...args) => getProjectMemberCount(...args),
  openTeacherProfile: (...args) => openTeacherProfile(...args),
  getDaysLeft: vi.fn(() => 5),
}));

vi.mock("../../../../pages/group_work/utils/memberAvatarUtils", () => ({
  getDisplayName: vi.fn((member) => member.name || member.username || "Member"),
  openMemberProfile: vi.fn(),
  getStoredViewer: (...args) => getStoredViewer(...args),
  getCurrentMember: vi.fn(() => null),
  getMemberKey: vi.fn((member) => String(member?.user || member?.id || "")),
}));

import GroupTasksTab from "@/pages/group_work/components/GroupTasksTab";
import GroupWorkIndexPage from "../../../../pages/group_work/GroupWorkIndexPage";

describe("GroupWork index page and tasks tab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({ profile: { id: 1 } });
    useToast.mockReturnValue(vi.fn());
    useGroupProjectSort.mockReturnValue({ sortBy: "deadline", setSortBy: vi.fn() });
    getProjectDate.mockReturnValue(new Date("2026-03-30T00:00:00.000Z"));
    formatProjectHeadlineDate.mockReturnValue("30 Mar");
    getProjectCaption.mockReturnValue("Shared project caption");
    getProjectTeacherName.mockReturnValue("Dr Lee");
    getProjectMemberCount.mockReturnValue(2);
    getStoredViewer.mockReturnValue({ id: 1, user: 1 });
  });

  describe("GroupTasksTab interactions", () => {
    it("filters tasks and completes them", async () => {
      const toast = vi.fn();
      useToast.mockReturnValue(toast);
      const state = renderGroupTasksTab({ showAddModal: true });
      fireEvent.click(screen.getByText("toggle-filter"));
      fireEvent.click(screen.getByText("toggle-task"));
      await waitFor(() => expect(state.taskActions.updateTask).toHaveBeenCalledWith(1, { completed: true }));
      expect(state.setFilterUsers).toHaveBeenCalled();
      expect(toast).toHaveBeenCalledWith("Task completed!", expect.any(Object));
    });

    it("deletes, adds, switches views, and hides the modal", async () => {
      useToast.mockReturnValue(vi.fn());
      const state = renderGroupTasksTab({ showAddModal: true });
      fireEvent.click(screen.getByText("delete-task"));
      await waitFor(() => expect(state.taskActions.deleteTask).toHaveBeenCalledWith(1));
      fireEvent.click(screen.getByText("confirm-add-task"));
      await waitFor(() => expect(state.taskActions.addTask).toHaveBeenCalledWith("New task", { due_date: "2026-03-30", assigned_to: [2] }));
      fireEvent.click(screen.getByText("Timeline"));
      fireEvent.click(screen.getByText("Kanban"));
      fireEvent.click(screen.getByText("List"));
      expect(state.setTaskView).toHaveBeenCalled();
      fireEvent.click(screen.getByText("close-add-modal"));
      expect(state.setShowAddModal).toHaveBeenCalledWith(false);
    });

    it("shows a loading placeholder when actions are running", () => {
      renderGroupTasksTab({ taskActions: { ...buildTaskActions(), loading: true }, sortedTasks: [] });
      expect(screen.getByText("Loading tasks...")).toBeInTheDocument();
    });
  });

  describe("GroupWorkIndexPage routing", () => {
    it("returns to overview when closing the detail view", () => {
      useSelectedProjectId.mockReturnValue("44");
      render(<GroupWorkIndexPage />);
      fireEvent.click(screen.getByText("detail-view"));
      expect(mockNavigate).toHaveBeenCalledWith("/group-work", { replace: true });
    });

    it("shows a skeleton while projects are loading", () => {
      useSelectedProjectId.mockReturnValue(null);
      useGroupProjects.mockReturnValue({ projects: [], setProjects: vi.fn(), loading: true });
      render(<GroupWorkIndexPage />);
      expect(screen.getByText("groupwork-skeleton")).toBeInTheDocument();
    });

    it("renders overview stats, opens projects, prepends, and changes sort", () => {
      const setProjects = vi.fn();
      useSelectedProjectId.mockReturnValue(null);
      useGroupProjects.mockReturnValue({ projects: [{ id: 1, name: "Alpha" }], setProjects, loading: false });
      render(<GroupWorkIndexPage />);
      fireEvent.click(screen.getByText("open-project"));
      fireEvent.click(screen.getByText("prepend-project"));
      fireEvent.click(screen.getByText("set-sort"));
      expect(screen.getByText(/Active projects:1/)).toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith("/group-work?project=1");
      expect(setProjects).toHaveBeenCalled();
      expect(screen.getAllByText("Back to top").length).toBeGreaterThan(0);
    });
  });

  describe("GroupWorkOverview handleProjectCreated", () => {
    it("calls showToast when a project is created via the callback", () => {
      const toast = vi.fn();
      useToast.mockReturnValue(toast);
      const setProjects = vi.fn();
      useSelectedProjectId.mockReturnValue(null);
      useGroupProjects.mockReturnValue({ projects: [{ id: 1, name: "Alpha" }], setProjects, loading: false });
      render(<GroupWorkIndexPage />);
      fireEvent.click(screen.getByText("prepend-project"));
      expect(toast).toHaveBeenCalledWith("Group project created successfully!");
      expect(setProjects).toHaveBeenCalled();
    });
  });
});
