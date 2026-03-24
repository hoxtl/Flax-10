import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockNavigate = vi.fn();
const useSelectedProjectId = vi.fn();
const useGroupProjects = vi.fn();
const useGroupProjectSort = vi.fn();
const useToast = vi.fn();
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

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
}));

vi.mock("../../../context/ToastContext", () => ({
  useToast: () => useToast(),
}));

vi.mock("../../../pages/GroupWork/hooks/groupWorkHooks", () => ({
  useSelectedProjectId: () => useSelectedProjectId(),
  useGroupProjects: () => useGroupProjects(),
  useGroupProjectSort: () => useGroupProjectSort(),
  getAuthHeaders: () => ({ Authorization: "Token test" }),
}));

vi.mock("../../../pages/GroupWork/useGroupTasksTabState", () => ({
  useGroupTasksTabState: (...args) => useGroupTasksTabState(...args),
}));

vi.mock("../../../pages/GroupWork/components/MemberFilter", () => ({
  default: ({ onToggle }) => <button type="button" onClick={() => onToggle("2")}>toggle-filter</button>,
}));

vi.mock("../../../pages/GroupWork/components/AddTaskModal", () => ({
  default: ({ onAdd, onClose }) => (
    <div>
      <button type="button" onClick={() => onAdd({ title: "New task", due_date: "2026-03-30", assigned_to: [2] })}>confirm-add-task</button>
      <button type="button" onClick={onClose}>close-add-modal</button>
    </div>
  ),
}));

vi.mock("../../../pages/GroupWork/components/TaskListView", () => ({
  default: ({ tasks, onToggle, onUpdate, onDelete }) => (
    <div>
      <span>list:{tasks.length}</span>
      <button type="button" onClick={() => onToggle(1, true)}>toggle-task</button>
      <button type="button" onClick={() => onUpdate(1, { title: "Edited" })}>update-task</button>
      <button type="button" onClick={() => onDelete(1)}>delete-task</button>
    </div>
  ),
}));

vi.mock("../../../pages/GroupWork/components/TaskTimelineView", () => ({
  default: () => <div>timeline-view</div>,
}));

vi.mock("../../../pages/GroupWork/components/TaskBoardView", () => ({
  default: ({ onAdd }) => <button type="button" onClick={() => onAdd("Quick add", "todo")}>board-add</button>,
}));

vi.mock("../../../components/common/SegmentedControl/SegmentedControl.jsx", () => ({
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

vi.mock("../../../components/common/PrimaryButton/PrimaryButton", () => ({
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
}));

vi.mock("../../../components/common/AppPage/AppPage", () => ({
  default: ({ title, subtitle, children }) => <div><h1>{title}</h1><div>{subtitle}</div>{children}</div>,
}));

vi.mock("../../../components/Pagination/Pagination", () => ({
  BackToTop: () => <div>Back to top</div>,
}));

vi.mock("../../../pages/GroupWork/GroupWorkDetail", () => ({
  default: ({ onBack }) => <button type="button" onClick={onBack}>detail-view</button>,
}));

vi.mock("../../../pages/GroupWork/components/GroupWorkStats", () => ({
  default: ({ projects }) => <div>stats:{projects.length}</div>,
}));

vi.mock("../../../pages/GroupWork/components/GroupWorkIndexSkeleton", () => ({
  default: () => <div>groupwork-skeleton</div>,
}));

vi.mock("../../../pages/GroupWork/components/GroupWorkContent", () => ({
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

vi.mock("../../../pages/GroupWork/utils/projectRowUtils", () => ({
  getProjectDate: (...args) => getProjectDate(...args),
  formatProjectHeadlineDate: (...args) => formatProjectHeadlineDate(...args),
  getProjectCaption: (...args) => getProjectCaption(...args),
  getProjectTeacherName: (...args) => getProjectTeacherName(...args),
  getProjectMemberCount: (...args) => getProjectMemberCount(...args),
  openTeacherProfile: (...args) => openTeacherProfile(...args),
}));

vi.mock("../../../pages/GroupWork/utils/memberAvatarUtils", () => ({
  getDisplayName: vi.fn((member) => member.name || member.username || "Member"),
  openMemberProfile: vi.fn(),
  getStoredViewer: (...args) => getStoredViewer(...args),
}));

vi.mock("../../../components/common/DeadlineCountdown/DeadlineCountdown", () => ({
  default: ({ dueDate }) => <span>countdown:{String(dueDate)}</span>,
}));

vi.mock("../../../components/common/BackButton/BackButton.jsx", () => ({
  default: ({ onClick, label }) => <button type="button" onClick={onClick}>{label}</button>,
}));

vi.mock("../../../components/common/Badge/Badge", () => ({
  default: ({ children }) => <span>{children}</span>,
}));

vi.mock("../../../components/common/Tooltip/Tooltip", () => ({
  default: ({ children, content }) => <div data-tooltip={content}>{children}</div>,
}));

vi.mock("../../../components/common/HoldConfirmModal/HoldConfirmModal", () => ({
  default: ({ title, onCancel, onConfirm }) => <div><span>{title}</span><button type="button" onClick={onCancel}>cancel-hold</button><button type="button" onClick={onConfirm}>confirm-hold</button></div>,
}));

vi.mock("../../../pages/GroupWork/components/AddMemberForm", () => ({
  default: ({ onAdded }) => <button type="button" onClick={() => onAdded({ id: 9, user: 9 })}>add-member</button>,
}));

vi.mock("../../../pages/GroupWork/components/MembersSection", () => ({
  default: ({ onRemove, members }) => <button type="button" onClick={() => onRemove(members[0].id)}>remove-member</button>,
}));

vi.mock("../../../pages/GroupWork/components/MemberAvatar", () => ({
  default: ({ member }) => <span>{member.name || member.username}</span>,
}));

vi.mock("../../../hooks/useCountUp", () => ({
  useCountUp: (...args) => useCountUp(...args),
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock("../../../components/common/StatStrip/StatStrip", () => ({
  default: ({ items }) => <div>{items.map((item) => `${item.label}:${item.value}`).join("|")}</div>,
}));

import GroupTasksTab from "../../../pages/GroupWork/GroupTasksTab";
import GroupWorkIndexPage from "../../../pages/GroupWork/GroupWorkIndexPage";
import ProjectHeader from "../../../pages/GroupWork/components/ProjectHeader";
import ProjectDeleteAction from "../../../pages/GroupWork/components/ProjectHeaderSub";
import ProjectProgress from "../../../pages/GroupWork/components/ProjectProgress";

describe("GroupWork pages and header extras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("handles GroupTasksTab list, timeline, board, add, toggle, delete, and loading branches", async () => {
    const toast = vi.fn();
    useToast.mockReturnValue(toast);
    const addTask = vi.fn().mockResolvedValue(undefined);
    const updateTask = vi.fn().mockResolvedValue(undefined);
    const deleteTask = vi.fn().mockResolvedValue(undefined);
    const setFilterUsers = vi.fn();
    const setTaskView = vi.fn();
    const setShowAddModal = vi.fn();
    useGroupTasksTabState.mockReturnValue({
      taskActions: { loading: false, addTask, updateTask, deleteTask },
      filterUsers: [],
      setFilterUsers,
      taskView: "list",
      setTaskView,
      showAddModal: true,
      setShowAddModal,
      sortedTasks: [{ id: 1, title: "Task A" }],
    });

    render(<GroupTasksTab projectId={3} members={[{ user: 2, name: "Alex" }]} onStatsUpdate={vi.fn()} />);
    fireEvent.click(screen.getByText("toggle-filter"));
    expect(setFilterUsers).toHaveBeenCalled();
    fireEvent.click(screen.getByText("toggle-task"));
    await waitFor(() => expect(updateTask).toHaveBeenCalledWith(1, { completed: true }));
    expect(toast).toHaveBeenCalledWith("Task completed!", expect.any(Object));
    fireEvent.click(screen.getByText("delete-task"));
    await waitFor(() => expect(deleteTask).toHaveBeenCalledWith(1));
    fireEvent.click(screen.getByText("confirm-add-task"));
    await waitFor(() => expect(addTask).toHaveBeenCalledWith("New task", { due_date: "2026-03-30", assigned_to: [2] }));
    fireEvent.click(screen.getByText("List"));
    fireEvent.click(screen.getByText("Timeline"));
    fireEvent.click(screen.getByText("Kanban"));
    expect(setTaskView).toHaveBeenCalled();
    fireEvent.click(screen.getByText("close-add-modal"));
    expect(setShowAddModal).toHaveBeenCalledWith(false);

    useGroupTasksTabState.mockReturnValue({
      taskActions: { loading: true, addTask, updateTask, deleteTask },
      filterUsers: [],
      setFilterUsers,
      taskView: "board",
      setTaskView,
      showAddModal: false,
      setShowAddModal,
      sortedTasks: [],
    });
    render(<GroupTasksTab projectId={3} members={[]} onStatsUpdate={vi.fn()} />);
    expect(screen.getByText("Loading tasks...")).toBeInTheDocument();
  });

  it("routes GroupWorkIndexPage between detail, loading, and overview content", () => {
    useSelectedProjectId.mockReturnValueOnce("44");
    render(<GroupWorkIndexPage />);
    fireEvent.click(screen.getByText("detail-view"));
    expect(mockNavigate).toHaveBeenCalledWith("/group-work", { replace: true });

    const setProjects = vi.fn();
    useSelectedProjectId.mockReturnValue(null);
    useGroupProjects.mockReturnValueOnce({ projects: [], setProjects, loading: true });
    render(<GroupWorkIndexPage />);
    expect(screen.getByText("groupwork-skeleton")).toBeInTheDocument();

    useGroupProjects.mockReturnValueOnce({ projects: [{ id: 1, name: "Alpha" }], setProjects, loading: false });
    render(<GroupWorkIndexPage />);
    expect(screen.getByText("stats:1")).toBeInTheDocument();
    fireEvent.click(screen.getByText("open-project"));
    expect(mockNavigate).toHaveBeenCalledWith("/group-work?project=1");
    fireEvent.click(screen.getByText("prepend-project"));
    expect(setProjects).toHaveBeenCalled();
    fireEvent.click(screen.getByText("set-sort"));
    expect(screen.getAllByText("Back to top").length).toBeGreaterThan(0);
  });

  it("renders project header branches, teacher/module pills, delete flow, and progress stats", async () => {
    const toast = vi.fn();
    useToast.mockReturnValue(toast);
    const onDelete = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const onBack = vi.fn();
    const onMemberRemove = vi.fn();
    const onDeleteProject = vi.fn();

    render(
      <>
        <ProjectHeader
          project={{ id: 7, name: "Alpha", deadline: "2026-03-30T00:00:00.000Z", course_code: "5CCS2SEG", module_name: "Software Eng", teacher_name: "Dr Lee" }}
          members={[{ id: 1, user: 1, name: "Owner" }]}
          teamMembers={[{ id: 1, user: 1, role: "owner", name: "Owner" }]}
          onMemberAdded={vi.fn()}
          onMemberRemove={onMemberRemove}
          onDelete={onDeleteProject}
          onBack={onBack}
        />
        <ProjectDeleteAction onDelete={onDelete} isOwner />
        <ProjectProgress taskStats={{ percent: 40, total: 5, completed: 2, segments: [{ id: "owner", name: "Owner", percentage: 40 }] }} />
      </>,
    );

    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Shared project caption")).toBeInTheDocument();
    expect(screen.getByText("30 Mar")).toBeInTheDocument();
    expect(screen.getByText("countdown:Mon Mar 30 2026 01:00:00 GMT+0100 (British Summer Time)")).toBeTruthy();
    expect(screen.getByText("Dr Lee")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Open Dr Lee's profile"));
    expect(openTeacherProfile).toHaveBeenCalled();
    fireEvent.click(screen.getByText("Back to all projects"));
    expect(onBack).toHaveBeenCalled();
    fireEvent.click(screen.getByText("Edit team"));
    fireEvent.click(screen.getByText("remove-member"));
    expect(screen.getAllByText("Delete project").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByText("confirm-hold"));
    await waitFor(() => expect(onDeleteProject).toHaveBeenCalled());

    fireEvent.click(screen.getAllByRole("button", { name: /Delete project/i })[1]);
    fireEvent.click(screen.getByText("confirm-hold"));
    await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1));
    expect(toast).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole("button", { name: /Delete project/i })[1]);
    fireEvent.click(screen.getByText("confirm-hold"));
    await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(2));
    expect(toast).toHaveBeenCalledWith("Project deleted.");
    expect(screen.getByText(/Overall:40/)).toBeInTheDocument();
  });
});
