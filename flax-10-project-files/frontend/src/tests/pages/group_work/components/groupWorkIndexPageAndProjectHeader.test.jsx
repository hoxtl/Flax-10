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
const buildBoardColumns = vi.fn();
const getProjectDate = vi.fn();
const formatProjectHeadlineDate = vi.fn();
const getProjectCaption = vi.fn();
const getProjectTeacherName = vi.fn();
const getProjectMemberCount = vi.fn();
const openTeacherProfile = vi.fn();
const getStoredViewer = vi.fn();
const useCountUp = vi.fn();

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

const baseProject = {
  id: 7,
  name: "Alpha",
  deadline: "2026-03-30T00:00:00.000Z",
  course_code: "5CCS2SEG",
  module_name: "Software Eng",
  teacher_name: "Dr Lee",
};

const baseMembers = [{ id: 1, user: 1, name: "Owner" }];
const baseTeamMembers = [{ id: 1, user: 1, role: "owner", name: "Owner" }];
const baseTaskStats = { percent: 40, total: 5, completed: 2, segments: [{ id: "owner", name: "Owner", percentage: 40 }] };

const renderProjectHeaderWith = (overrides = {}) => {
  const props = {
    project: { ...baseProject, ...(overrides.project ?? {}) },
    members: overrides.members ?? baseMembers,
    teamMembers: overrides.teamMembers ?? baseTeamMembers,
    onMemberAdded: vi.fn(),
    onMemberRemove: overrides.onMemberRemove ?? vi.fn(),
    onDelete: overrides.onDelete ?? vi.fn(),
    onBack: overrides.onBack ?? vi.fn(),
  };
  render(<ProjectHeader {...props} />);
  return props;
};

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
}));

vi.mock("../../../../context/ToastContext", () => ({
  useToast: () => useToast(),
}));

vi.mock("../../../../context/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("../../../../pages/group_work/hooks/groupWorkHooks", () => ({
  useSelectedProjectId: () => useSelectedProjectId(),
  useGroupProjects: () => useGroupProjects(),
  useGroupProjectSort: () => useGroupProjectSort(),
  getAuthHeaders: () => ({ Authorization: "Token test" }),
}));

vi.mock("../../../../pages/group_work/hooks/useGroupTasksTabState", () => ({
  useGroupTasksTabState: (...args) => useGroupTasksTabState(...args),
}));

vi.mock("../../../../pages/group_work/components/MemberFilter", () => ({
  default: ({ onToggle }) => <button type="button" onClick={() => onToggle("2")}>toggle-filter</button>,
}));

vi.mock("../../../../pages/group_work/components/AddTaskModal", () => ({
  default: ({ onAdd, onClose }) => (
    <div>
      <button type="button" onClick={() => onAdd({ title: "New task", due_date: "2026-03-30", assigned_to: [2] })}>confirm-add-task</button>
      <button type="button" onClick={onClose}>close-add-modal</button>
    </div>
  ),
}));

vi.mock("../../../../pages/group_work/components/TaskListView", () => ({
  default: ({ tasks, onToggle, onUpdate, onDelete }) => (
    <div>
      <span>list:{tasks.length}</span>
      <button type="button" onClick={() => onToggle(1, true)}>toggle-task</button>
      <button type="button" onClick={() => onUpdate(1, { title: "Edited" })}>update-task</button>
      <button type="button" onClick={() => onDelete(1)}>delete-task</button>
    </div>
  ),
}));

vi.mock("../../../../pages/group_work/components/TaskTimelineView", () => ({
  default: () => <div>timeline-view</div>,
}));

vi.mock("../../../../pages/group_work/components/TaskBoardView", () => ({
  default: ({ onAdd }) => <button type="button" onClick={() => onAdd("Quick add", "todo")}>board-add</button>,
}));

vi.mock("../../../../components/common/segmented_control/SegmentedControl.jsx", () => ({
  SegmentedControl: ({ options, onChange }) => (
    <div>
      {options.map((option) => (
        <button key={option.value} type="button" onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("../../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, onClick, pill, variant, size, ...props }) => <button type="button" onClick={onClick} {...props}>{children}</button>,
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

vi.mock("../../../../components/common/app_page/AppPage", () => ({
  default: ({ title, subtitle, children }) => <div><h1>{title}</h1><div>{subtitle}</div>{children}</div>,
}));

vi.mock("../../../../components/pagination/Pagination", () => ({
  BackToTop: () => <div>Back to top</div>,
}));

vi.mock("../../../../pages/group_work/components/GroupWorkDetail", () => ({
  default: ({ onBack }) => <button type="button" onClick={onBack}>detail-view</button>,
}));

vi.mock("../../../../pages/group_work/components/GroupWorkStats", () => ({
  default: ({ projects }) => <div>stats:{projects.length}</div>,
}));

vi.mock("../../../../pages/group_work/components/GroupWorkIndexSkeleton", () => ({
  default: () => <div>groupwork-skeleton</div>,
}));

vi.mock("../../../../pages/group_work/components/GroupWorkContent", () => ({
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

vi.mock("../../../../components/common/deadline_countdown/DeadlineCountdown", () => ({
  default: ({ dueDate }) => <span>countdown:{String(dueDate)}</span>,
}));

vi.mock("../../../../components/common/back_button/BackButton.jsx", () => ({
  default: ({ onClick, label }) => <button type="button" onClick={onClick}>{label}</button>,
}));

vi.mock("../../../../components/common/badge/Badge", () => ({
  default: ({ children }) => <span>{children}</span>,
}));

vi.mock("../../../../components/common/tooltip/Tooltip", () => ({
  default: ({ children, content }) => <div data-tooltip={content}>{children}</div>,
}));

vi.mock("../../../../components/common/hold_confirm_modal/HoldConfirmModal", () => ({
  default: ({ title, onCancel, onConfirm }) => <div><span>{title}</span><button type="button" onClick={onCancel}>cancel-hold</button><button type="button" onClick={onConfirm}>confirm-hold</button></div>,
}));

vi.mock("../../../../pages/group_work/components/AddMemberForm", () => ({
  default: ({ onAdded }) => <button type="button" onClick={() => onAdded({ id: 9, user: 9 })}>add-member</button>,
}));

vi.mock("../../../../pages/group_work/components/MembersSection", () => ({
  default: ({ onRemove, members }) => <button type="button" onClick={() => onRemove(members[0].id)}>remove-member</button>,
}));

vi.mock("../../../../pages/group_work/components/MemberAvatar", () => ({
  default: ({ member }) => <span>{member.name || member.username}</span>,
}));

vi.mock("../../../../hooks/useCountUp", () => ({
  useCountUp: (...args) => useCountUp(...args),
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

vi.mock("../../../../components/common/stat_strip/StatStrip", () => ({
  default: ({ items }) => <div>{items.map((item) => `${item.label}:${item.value}`).join("|")}</div>,
}));

import GroupTasksTab from "../../../../pages/group_work/components/GroupTasksTab";
import GroupWorkIndexPage from "../../../../pages/group_work/GroupWorkIndexPage";
import ProjectHeader from "../../../../pages/group_work/components/ProjectHeader";
import ProjectDeleteAction from "../../../../pages/group_work/components/ProjectHeaderSub";
import ProjectProgress from "../../../../pages/group_work/components/ProjectProgress";
import { getDaysLeft } from "../../../../pages/group_work/utils/projectRowUtils";

describe("GroupWork pages and header extras", () => {
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
    useCountUp.mockImplementation((value) => ({ current: value }));
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
      expect(screen.getByText("stats:1")).toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith("/group-work?project=1");
      expect(setProjects).toHaveBeenCalled();
      expect(screen.getAllByText("Back to top").length).toBeGreaterThan(0);
    });
  });

  describe("Project header and delete actions", () => {
    it("renders metadata, teacher actions, and back navigation", () => {
      const props = renderProjectHeaderWith({ onBack: vi.fn() });
      expect(screen.getByText(props.project.name)).toBeInTheDocument();
      expect(screen.getByText("Shared project caption")).toBeInTheDocument();
      expect(screen.getByText("30 Mar")).toBeInTheDocument();
      expect(screen.getByText((content) => content.startsWith("countdown:"))).toBeTruthy();
      expect(screen.getByText("Dr Lee")).toBeInTheDocument();
      fireEvent.click(screen.getByLabelText("Open Dr Lee's profile"));
      expect(openTeacherProfile).toHaveBeenCalled();
      fireEvent.click(screen.getByText("Back to all projects"));
      expect(props.onBack).toHaveBeenCalled();
    });

    it("shows delete affordances and closes the hold dialog on cancel", async () => {
      renderProjectHeaderWith({ onBack: vi.fn() });

      const deleteButtons = screen.getAllByRole("button", { name: /Delete project/i });
      expect(deleteButtons[0]).toBeInTheDocument();

      fireEvent.click(deleteButtons.at(-1));
      fireEvent.click(screen.getByText("cancel-hold"));
      await waitFor(() => expect(screen.queryByText("cancel-hold")).not.toBeInTheDocument());
    });

    it("hides module and deadline metadata when project data is incomplete", () => {
      getProjectDate.mockReturnValue(null);
      getProjectTeacherName.mockReturnValue("");
      renderProjectHeaderWith({
        project: { ...baseProject, course_code: "", module_name: "", teacher_name: "", deadline: null },
        teamMembers: [{ id: 2, user: 2, role: "member", name: "Member" }],
      });

      expect(screen.queryByLabelText(/Open .* module/i)).toBeNull();
      expect(screen.queryByText(/day left|days left|Due today|overdue/i)).toBeNull();
      expect(screen.queryByLabelText(/Open .* module/i)).toBeNull();
      expect(screen.queryByLabelText(/Open .*'s profile/i)).toBeNull();
    });

    it("treats a non-owner viewer as unable to delete the project", () => {
      useAuthMock.mockReturnValueOnce({ profile: { id: 99 } });
      getStoredViewer.mockReturnValueOnce({ id: 99, user: 99 });
      renderProjectHeaderWith({
        teamMembers: [{ id: 2, user: 2, role: "member", name: "Member" }],
      });

      expect(screen.getByRole("button", { name: /Leave project/i })).toBeInTheDocument();
    });
  });

  describe("ProjectUrgentBanner and deadline labels", () => {
    it("renders 'due today' when the most urgent project has 0 days left", () => {
      useSelectedProjectId.mockReturnValue(null);
      getDaysLeft.mockReturnValue(0);
      getProjectDate.mockReturnValue(new Date());
      const project = { id: 10, name: "Urgent Today", deadline: "2026-03-27T00:00:00.000Z" };
      useGroupProjects.mockReturnValue({ projects: [project], setProjects: vi.fn(), loading: false });
      render(<GroupWorkIndexPage />);
      expect(screen.getByText("Urgent Today")).toBeInTheDocument();
      expect(screen.getByText(/due today/)).toBeInTheDocument();
      expect(screen.getByText("Schedule meeting slots")).toBeInTheDocument();
    });

    it("renders 'due tomorrow' when the most urgent project has 1 day left", () => {
      useSelectedProjectId.mockReturnValue(null);
      getDaysLeft.mockReturnValue(1);
      getProjectDate.mockReturnValue(new Date());
      const project = { id: 11, name: "Urgent Tomorrow", deadline: "2026-03-28T00:00:00.000Z" };
      useGroupProjects.mockReturnValue({ projects: [project], setProjects: vi.fn(), loading: false });
      render(<GroupWorkIndexPage />);
      expect(screen.getByText("Urgent Tomorrow")).toBeInTheDocument();
      expect(screen.getByText(/due tomorrow/)).toBeInTheDocument();
    });

    it("renders 'due in N days' for projects with 2-7 days left", () => {
      useSelectedProjectId.mockReturnValue(null);
      getDaysLeft.mockReturnValue(3);
      getProjectDate.mockReturnValue(new Date());
      const project = { id: 12, name: "Soon Project", deadline: "2026-03-30T00:00:00.000Z" };
      useGroupProjects.mockReturnValue({ projects: [project], setProjects: vi.fn(), loading: false });
      render(<GroupWorkIndexPage />);
      expect(screen.getByText("Soon Project")).toBeInTheDocument();
      expect(screen.getByText(/due in 3 days/)).toBeInTheDocument();
    });

    it("does not render the banner when no projects are urgent (getMostUrgentProject returns null)", () => {
      useSelectedProjectId.mockReturnValue(null);
      getDaysLeft.mockReturnValue(null);
      getProjectDate.mockReturnValue(null);
      const project = { id: 13, name: "No Deadline", deadline: null };
      useGroupProjects.mockReturnValue({ projects: [project], setProjects: vi.fn(), loading: false });
      render(<GroupWorkIndexPage />);
      expect(screen.queryByText("Schedule meeting slots")).not.toBeInTheDocument();
    });

    it("does not render the banner when projects list is empty", () => {
      useSelectedProjectId.mockReturnValue(null);
      getDaysLeft.mockReturnValue(null);
      useGroupProjects.mockReturnValue({ projects: [], setProjects: vi.fn(), loading: false });
      render(<GroupWorkIndexPage />);
      expect(screen.queryByText("Schedule meeting slots")).not.toBeInTheDocument();
    });

    it("navigates to the schedule tab when 'Schedule meeting slots' is clicked (goToSchedule)", () => {
      useSelectedProjectId.mockReturnValue(null);
      getDaysLeft.mockReturnValue(2);
      getProjectDate.mockReturnValue(new Date());
      const project = { id: 14, name: "Schedule Test", deadline: "2026-03-29T00:00:00.000Z" };
      useGroupProjects.mockReturnValue({ projects: [project], setProjects: vi.fn(), loading: false });
      render(<GroupWorkIndexPage />);
      fireEvent.click(screen.getByText("Schedule meeting slots"));
      expect(mockNavigate).toHaveBeenCalledWith("/group-work?project=14&tab=availability");
    });

    it("does not render the banner when project deadline is beyond 7 days", () => {
      useSelectedProjectId.mockReturnValue(null);
      getDaysLeft.mockReturnValue(10);
      getProjectDate.mockReturnValue(new Date("2026-04-06T00:00:00.000Z"));
      const project = { id: 15, name: "Far Away", deadline: "2026-04-06T00:00:00.000Z" };
      useGroupProjects.mockReturnValue({ projects: [project], setProjects: vi.fn(), loading: false });
      render(<GroupWorkIndexPage />);
      expect(screen.queryByText("Schedule meeting slots")).not.toBeInTheDocument();
    });

    it("chooses the most urgent project when several qualify", () => {
      useSelectedProjectId.mockReturnValue(null);
      getProjectDate.mockImplementation((deadline) => new Date(deadline));
      getDaysLeft.mockImplementation((date) => {
        const day = date.getUTCDate();
        if (day === 30) return 3;
        if (day === 29) return 2;
        return null;
      });
      useGroupProjects.mockReturnValue({
        projects: [
          { id: 21, name: "Less urgent", deadline: "2026-03-30T00:00:00.000Z" },
          { id: 22, name: "Most urgent", deadline: "2026-03-29T00:00:00.000Z" },
        ],
        setProjects: vi.fn(),
        loading: false,
      });

      render(<GroupWorkIndexPage />);

      expect(screen.getByText("Most urgent")).toBeInTheDocument();
      expect(screen.getByText(/due in 2 days/)).toBeInTheDocument();
      expect(screen.queryByText("Less urgent")).toBeNull();
    });
  });

  describe("GroupWorkOverview handleProjectCreated", () => {
    it("calls showToast when a project is created via the callback", () => {
      const toast = vi.fn();
      useToast.mockReturnValue(toast);
      const setProjects = vi.fn();
      useSelectedProjectId.mockReturnValue(null);
      getDaysLeft.mockReturnValue(null);
      useGroupProjects.mockReturnValue({ projects: [{ id: 1, name: "Alpha" }], setProjects, loading: false });
      render(<GroupWorkIndexPage />);
      fireEvent.click(screen.getByText("prepend-project"));
      expect(toast).toHaveBeenCalledWith("Group project created successfully!");
      expect(setProjects).toHaveBeenCalled();
    });
  });
});
