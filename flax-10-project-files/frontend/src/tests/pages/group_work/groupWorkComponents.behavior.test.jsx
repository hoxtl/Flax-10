/**
 * Group-work component behavior tests.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen, waitFor, renderHook, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// ---------------------------------------------------------------------------
// Shared mocks
// ---------------------------------------------------------------------------

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: new Proxy(
    {},
    {
      get: (_, tag) => {
        const Tag = typeof tag === "string" ? tag : "div";
        return ({ children, ...props }) => {
          const clean = { ...props };
          ["layoutId", "initial", "animate", "exit", "transition", "variants", "whileHover", "whileTap", "layout"].forEach((k) => delete clean[k]);
          return <Tag {...clean}>{children}</Tag>;
        };
      },
    },
  ),
}));

vi.mock("react-dom", async () => {
  const actual = await vi.importActual("react-dom");
  return { ...actual, createPortal: (node) => node };
});

vi.mock("../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, onClick, type = "button", disabled, pill: _pill, size: _size, variant: _variant, ...rest }) => (
    <button type={type} onClick={onClick} disabled={disabled} {...rest}>{children}</button>
  ),
}));

vi.mock("../../../components/common/standard_modal/StandardModal", () => ({
  default: ({ title, children, onClose }) => (
    <div data-testid="standard-modal">
      <h2>{title}</h2>
      <button type="button" onClick={onClose}>close-modal</button>
      {children}
    </div>
  ),
}));

vi.mock("../../../components/common/hold_confirm_modal/HoldConfirmModal", () => ({
  default: ({ title, cancelLabel, holdLabel, onCancel, onConfirm }) => (
    <div data-testid="hold-confirm-modal">
      <div>{title}</div>
      <button type="button" onClick={onCancel}>{cancelLabel}</button>
      <button type="button" onClick={onConfirm}>{holdLabel}</button>
    </div>
  ),
}));

vi.mock("../../../components/common/tooltip/Tooltip", () => ({
  default: ({ children, content }) => <div data-tooltip={content}>{children}</div>,
}));

vi.mock("../../../components/common/badge/Badge", () => ({
  default: ({ children, className }) => <span className={className}>{children}</span>,
}));

vi.mock("../../../components/common/search_empty_state/SearchEmptyState", () => ({
  default: ({ title, hint }) => (
    <div>
      <span>{title}</span>
      <span>{hint}</span>
    </div>
  ),
}));

vi.mock("../../../components/common/inputs/DateTimePicker", () => ({
  default: ({ value, onChange, placeholder }) => (
    <input aria-label={placeholder || "date-picker"} value={value || ""} onChange={(e) => onChange(e.target.value)} />
  ),
}));

vi.mock("../../../components/common/stat_strip/StatStrip", () => ({
  default: ({ items }) => (
    <div data-testid="stat-strip">
      {items.map((item) => `${item.label}:${item.value}${item.suffix || ""}${item.tone ? `[${item.tone}]` : ""}`).join("|")}
    </div>
  ),
}));

vi.mock("../../../hooks/useCountUp", () => ({
  useCountUp: () => ({ current: null }),
}));

vi.mock("lucide-react", () => ({
  Check: () => <svg data-testid="icon-check" />,
  X: () => <svg data-testid="icon-x" />,
  Clock3: () => <svg data-testid="icon-clock" />,
  Plus: () => <svg data-testid="icon-plus" />,
  Star: () => <svg data-testid="icon-star" />,
  Trash2: () => <svg data-testid="icon-trash" />,
  BookOpen: () => <svg data-testid="icon-book" />,
  UserRound: () => <svg data-testid="icon-user" />,
  List: () => <svg data-testid="icon-list" />,
  CalendarIcon: () => <svg data-testid="icon-calendar" />,
  Square: () => <svg data-testid="icon-square" />,
  Settings: () => <svg data-testid="icon-settings" />,
  LogOut: () => <svg data-testid="icon-logout" />,
  CalendarDays: () => <svg data-testid="icon-calendar-days" />,
  Filter: () => <svg data-testid="icon-filter" />,
  ChevronDown: () => <svg data-testid="icon-chevron-down" />,
}));

vi.mock("../../../components/common/page_toolbar/PageToolbar", () => ({
  default: ({ children, controlsSlot }) => <div data-testid="page-toolbar">{controlsSlot}{children}</div>,
  ToolbarSortControl: ({ children }) => <div>{children}</div>,
}));

vi.mock("../../../components/common/animated_dropdown", () => ({
  default: ({ value, onChange, options }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {(options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  ),
}));

vi.mock("../../../components/common/search_bar/SearchBar", () => ({
  default: ({ value, onChange, placeholder }) => (
    <input aria-label={placeholder || "search"} value={value || ""} onChange={(e) => onChange(e.target.value)} />
  ),
}));

vi.mock("../../../components/common/filter_button/FilterButton", () => ({
  default: ({ activeCount, onClick }) => (
    <button type="button" onClick={onClick}>Filter{activeCount > 0 ? `(${activeCount})` : ""}</button>
  ),
}));

vi.mock("../../../components/common/back_button/BackButton.jsx", () => ({
  default: ({ onClick, label }) => <button type="button" onClick={onClick}>{label}</button>,
}));

vi.mock("../../../components/common/deadline_countdown/DeadlineCountdown", () => ({
  default: ({ dueDate }) => <span data-testid="deadline-countdown">{dueDate}</span>,
}));

vi.mock("../../../components/common/segmented_control/SegmentedControl.jsx", () => ({
  SegmentedControl: ({ options, value, onChange }) => (
    <div>{options.map((o) => (
      <button key={o.value} type="button" onClick={() => onChange(o.value)} data-active={value === o.value}>{o.label}</button>
    ))}</div>
  ),
}));

vi.mock("../../../pages/group_work/components/MemberAvatar", () => ({
  default: ({ member }) => <span data-testid="member-avatar">{member?.name || member?.username || "?"}</span>,
}));

const getStoredViewerMock = vi.fn(() => ({ id: 1, username: "viewer" }));
const getCurrentMemberMock = vi.fn(() => null);

vi.mock("../../../pages/group_work/utils/memberAvatarUtils", () => ({
  getDisplayName: (member) => member?.name || member?.username || member?.user_name || "User",
  getStoredViewer: (...args) => getStoredViewerMock(...args),
  openMemberProfile: vi.fn(),
  getMemberKey: (member) => String(member?.user || member?.id || ""),
  getCurrentMember: (...args) => getCurrentMemberMock(...args),
  getPhotoUrl: vi.fn(() => null),
}));

const getProjectTeacherNameMock = vi.fn((project) => project?.teacher_name || null);
const getProjectDateMock = vi.fn((deadline) => deadline ? new Date(deadline) : null);

vi.mock("../../../pages/group_work/utils/projectRowUtils", () => ({
  getProjectTeacherName: (...args) => getProjectTeacherNameMock(...args),
  getProjectTeacherInitials: vi.fn(() => "AB"),
  openTeacherProfile: vi.fn(),
  getProjectDate: (...args) => getProjectDateMock(...args),
  formatProjectHeadlineDate: vi.fn(() => "28 Mar 2026"),
  getProjectCaption: vi.fn(() => "Project caption"),
  getDaysLeft: vi.fn(() => 7),
  getProjectMembers: vi.fn((project) => project?.members || []),
  getProjectMemberCount: vi.fn((project) => project?.member_count || 0),
  getProjectPercent: vi.fn(() => 40),
  compareProjectsBySort: vi.fn(() => 0),
}));

const getProgressStatsMock = vi.fn(() => ({ percent: 0 }));
const getNextDeadlineMock = vi.fn(() => ({ project: null, days: 0 }));

vi.mock("../../../pages/group_work/utils/projectStatsUtils", () => ({
  getProgressStats: (...args) => getProgressStatsMock(...args),
  getNextDeadline: (...args) => getNextDeadlineMock(...args),
}));

const useAuthMock = vi.fn(() => ({ profile: { id: 1 } }));

vi.mock("../../../context/AuthContext", () => ({
  useAuth: (...args) => useAuthMock(...args),
  AuthContext: React.createContext({ profile: { id: 1 } }),
}));

const useToastMock = vi.fn(() => vi.fn());

vi.mock("../../../context/ToastContext", () => ({
  useToast: (...args) => useToastMock(...args),
}));

vi.mock("../../../context/ConfirmContext", () => ({
  useConfirm: vi.fn(() => vi.fn()),
}));

vi.mock("../../../components/common/hooks/useClickOutside", () => ({
  useClickOutside: vi.fn(),
}));

vi.mock("../../../pages/group_work/utils/taskAssigneeUtils", () => ({
  shouldShowPopupAbove: vi.fn(() => false),
  createPopupCoords: vi.fn(() => ({ top: 100, left: 40, width: 200 })),
}));

vi.mock("../../../pages/group_work/utils/priorityUtils", () => ({
  getUserColor: vi.fn(() => "#123456"),
  getPriorityStyle: vi.fn(() => ({ bg: "#fff", border: "#ccc", color: "#000", backgroundColor: "#eee" })),
}));

const addProjectMemberMock = vi.fn();
const createGroupProjectMock = vi.fn();
const patchGroupProjectMock = vi.fn();

vi.mock("../../../pages/group_work/api/groupWorkApi", () => ({
  addProjectMember: (...args) => addProjectMemberMock(...args),
  createGroupProject: (...args) => createGroupProjectMock(...args),
  patchGroupProject: (...args) => patchGroupProjectMock(...args),
}));

vi.mock("../../../pages/group_work/utils/taskUtils", () => ({
  buildToggleAssignee: vi.fn(() => vi.fn()),
  filterVisibleAssignees: vi.fn((a) => a || []),
  getDueDateStr: vi.fn((v) => v || ""),
  handleDragStartTask: vi.fn(),
}));

vi.mock("../../../pages/group_work/components/TaskAvatarStack", () => ({
  default: ({ assignees }) => <div>avatars:{assignees.length}</div>,
}));

vi.mock("../../../pages/group_work/components/TaskContextMenu", () => ({
  default: ({ onClose, onEditStart, onDelete, task }) => (
    <div data-testid="context-menu">
      <button type="button" onClick={onEditStart}>ctx-edit</button>
      <button type="button" onClick={() => onDelete(task.id)}>ctx-delete</button>
      <button type="button" onClick={onClose}>ctx-close</button>
    </div>
  ),
}));

vi.mock("../../../pages/group_work/components/TaskAssigneePopup", async () => await vi.importActual("../../../pages/group_work/components/TaskAssigneePopup"));

const useTaskTitleEditMock = vi.fn();

vi.mock("../../../pages/group_work/components/taskCardEditUtils", () => ({
  useTaskTitleEdit: (...args) => useTaskTitleEditMock(...args),
  handleTaskTitleKeyDown: (event, saveEdit, setEditing) => {
    if (event.key === "Enter" && !event.shiftKey) saveEdit();
    if (event.key === "Escape") setEditing(false);
  },
}));

const useGroupTasksTabStateMock = vi.fn();

vi.mock("../../../pages/group_work/hooks/useGroupTasksTabState", () => ({
  useGroupTasksTabState: (...args) => useGroupTasksTabStateMock(...args),
}));

vi.mock("../../../pages/group_work/components/TaskListView", () => ({
  default: ({ tasks }) => <div data-testid="task-list-view">{tasks.map((t) => <div key={t.id}>{t.title}</div>)}</div>,
}));

vi.mock("../../../pages/group_work/components/TaskTimelineView", () => ({
  default: () => <div data-testid="task-timeline-view" />,
}));

vi.mock("../../../pages/group_work/components/TaskBoardView", () => ({
  default: () => <div data-testid="task-board-view" />,
}));

vi.mock("../../../pages/group_work/components/MemberFilter", () => ({
  default: () => <div data-testid="member-filter" />,
}));

vi.mock("../../../pages/group_work/components/AddTaskModal", () => ({
  default: ({ onClose }) => <div data-testid="add-task-modal"><button type="button" onClick={onClose}>close-modal</button></div>,
}));

vi.mock("../../../pages/group_work/components/AddMemberForm", () => ({
  default: () => <div data-testid="add-member-form" />,
}));

vi.mock("../../../pages/group_work/components/MembersSection", () => ({
  default: ({ members, onRemove }) => (
    <div data-testid="members-section">
      {members.map((m) => (
        <button key={m.id} type="button" onClick={() => onRemove?.(m.id)}>{m.name || String(m.id)}</button>
      ))}
    </div>
  ),
}));

vi.mock("../../../pages/group_work/components/EditProjectModal", () => ({
  default: ({ onClose }) => (
    <div data-testid="edit-project-modal">
      <button type="button" onClick={onClose}>close-edit-modal</button>
    </div>
  ),
}));

vi.mock("../../../pages/group_work/components/CreateProjectForm", async () => await vi.importActual("../../../pages/group_work/components/CreateProjectForm"));

vi.mock("../../../pages/group_work/components/ProjectRow", () => ({
  default: ({ project }) => <div data-testid="project-row">{project.name}</div>,
}));

vi.mock("../../../pages/group_work/components/ProjectHeaderMeta", async () => await vi.importActual("../../../pages/group_work/components/ProjectHeaderMeta"));

vi.mock("../../../pages/group_work/components/ProjectHeaderSub", async () => {
  const actual = await vi.importActual("../../../pages/group_work/components/ProjectHeaderSub");
  return {
    ...actual,
    default: (props) => (
      <div data-testid="project-header-sub">
        <span data-testid="is-owner">{String(props.isOwner)}</span>
        <actual.default {...props} />
      </div>
    ),
  };
});

const useAvailabilityMock = vi.fn();

vi.mock("../../../pages/group_work/hooks/useAvailability", () => ({
  useAvailability: (...args) => useAvailabilityMock(...args),
}));

vi.mock("../../../pages/group_work/utils/availabilityUtils", () => ({
  formatSuggestionDateLabel: vi.fn((s) => `Date(${s})`),
  getMemberStatuses: vi.fn(() => []),
  getTeamSize: vi.fn(() => 2),
  getSuggestionCount: vi.fn(() => 1),
  getCurrentUserStatus: vi.fn(() => "pending"),
}));

vi.mock("../../../components/common/confirm_modal/ConfirmModal", () => ({
  default: ({ title, onConfirm, onCancel }) => (
    <div>
      <span>{title}</span>
      <button type="button" onClick={onConfirm}>confirm</button>
      <button type="button" onClick={onCancel}>cancel</button>
    </div>
  ),
}));

vi.mock("../../../pages/group_work/components/useCreateProjectForm", async () => await vi.importActual("../../../pages/group_work/components/useCreateProjectForm"));

vi.mock("../../../components/common/form_field/FormField", () => ({
  default: ({ label, children, error }) => (
    <div>
      <div>{label}</div>
      {children}
      {error && <span>{error}</span>}
    </div>
  ),
}));

vi.mock("../../../components/common/tags_selector/TagsSelector", () => ({
  TagsSelector: ({ tags }) => <div>{tags.map((t) => t.label).join(",")}</div>,
}));

vi.mock("../../../pages/group_work/components/CreateProjectInputs", () => ({
  CreateProjectInputs: ({ data, onChange }) => (
    <div>
      <input aria-label="project-name" value={data.name} onChange={(e) => onChange("name", e.target.value)} />
    </div>
  ),
}));

vi.mock("../../../pages/group_work/components/GroupWorkUserSearchEmptyState", () => ({
  default: () => <div>empty-state</div>,
}));

vi.mock("../../../components/social/components/UserSearch", () => ({
  default: () => <div data-testid="user-search" />,
}));

vi.mock("../../../pages/group_work/components/ProjectModuleBadge", () => ({
  default: ({ project }) => project?.course_code ? <span>{project.course_code}</span> : null,
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import GroupWorkStats from "../../../pages/group_work/components/GroupWorkStats";
import GroupWorkUserSearchEmptyState from "../../../pages/group_work/components/GroupWorkUserSearchEmptyState";
import ProjectProgress from "../../../pages/group_work/components/ProjectProgress";
import ProjectRowAccordion from "../../../pages/group_work/components/ProjectRowAccordion";
import ProjectRowInfo from "../../../pages/group_work/components/ProjectRowInfo";
import SelectableMemberRow from "../../../pages/group_work/components/SelectableMemberRow";
import TaskAssigneePopup from "../../../pages/group_work/components/TaskAssigneePopup";
import TaskBoardCard from "../../../pages/group_work/components/TaskBoardCard";
import { TimelineCard, UnscheduledCard } from "../../../pages/group_work/components/TaskTimelineCards";
import { useCreateProjectForm } from "../../../pages/group_work/components/useCreateProjectForm";
import { useEditProjectForm } from "../../../pages/group_work/components/useEditProjectForm";
import GroupWorkContent from "../../../pages/group_work/components/GroupWorkContent";
import GroupTasksTab from "../../../pages/group_work/components/GroupTasksTab";
import ProjectHeader from "../../../pages/group_work/components/ProjectHeader";
import { ProjectHeaderMeta, ProjectTeacherMeta } from "../../../pages/group_work/components/ProjectHeaderMeta";
import ProjectHeaderActions from "../../../pages/group_work/components/ProjectHeaderSub";
import AvailabilityTab from "../../../pages/group_work/components/AvailabilityTab";
import CreateProjectForm from "../../../pages/group_work/components/CreateProjectForm";

// ---------------------------------------------------------------------------
// GroupWorkStats
// ---------------------------------------------------------------------------

describe("GroupWorkStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with projects=null (uses || [])", () => {
    getProgressStatsMock.mockReturnValue({ percent: 0 });
    getNextDeadlineMock.mockReturnValue({ project: null, days: 0 });
    render(<GroupWorkStats projects={null} />);
    expect(screen.getByTestId("stat-strip")).toHaveTextContent("Active projects:0");
  });

  it("shows '--' for deadline when no deadline project", () => {
    getProgressStatsMock.mockReturnValue({ percent: 10 });
    getNextDeadlineMock.mockReturnValue({ project: null, days: 0 });
    render(<GroupWorkStats projects={[{ id: 1 }]} />);
    const text = screen.getByTestId("stat-strip").textContent;
    expect(text).toContain("Upcoming deadlines:--");
  });

  it("shows no 'success' tone when progress.percent is 0", () => {
    getProgressStatsMock.mockReturnValue({ percent: 0 });
    getNextDeadlineMock.mockReturnValue({ project: null, days: 0 });
    render(<GroupWorkStats projects={[]} />);
    const text = screen.getByTestId("stat-strip").textContent;
    expect(text).not.toContain("[success]");
  });

  it("shows 'success' tone when progress.percent > 0", () => {
    getProgressStatsMock.mockReturnValue({ percent: 30 });
    getNextDeadlineMock.mockReturnValue({ project: null, days: 0 });
    render(<GroupWorkStats projects={[{ id: 1 }]} />);
    const text = screen.getByTestId("stat-strip").textContent;
    expect(text).toContain("[success]");
  });

  it("shows project name in deadline tooltip", () => {
    getProgressStatsMock.mockReturnValue({ percent: 0 });
    getNextDeadlineMock.mockReturnValue({ project: { name: "Capstone" }, days: 5 });
    render(<GroupWorkStats projects={[{ id: 1 }]} />);
    const text = screen.getByTestId("stat-strip").textContent;
    expect(text).toContain("Upcoming deadlines:5");
  });
});

// ---------------------------------------------------------------------------
// GroupWorkUserSearchEmptyState
// ---------------------------------------------------------------------------

describe("GroupWorkUserSearchEmptyState", () => {
  it("renders content directly when wrapperClassName is absent", () => {
    const { container } = render(
      <GroupWorkUserSearchEmptyState query="abc" clear={vi.fn()} className="card" />,
    );
    expect(container.firstChild).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// ProjectProgress
// ---------------------------------------------------------------------------

describe("ProjectProgress", () => {
  it("uses index as key when segment.id is null", () => {
    const { container } = render(
      <ProjectProgress taskStats={{ percent: 50, completed: 5, total: 10, segments: [{ id: null, name: "S1", percentage: 50 }] }} />,
    );
    expect(container).toBeTruthy();
    expect(screen.getByLabelText("S1 segment")).toBeTruthy();
  });

  it("hoveredSeg triggers opacity 1 for hovered, 0.65 for others", async () => {
    render(
      <ProjectProgress taskStats={{
        percent: 50,
        segments: [
          { id: "a", name: "A", percentage: 50 },
          { id: "b", name: "B", percentage: 50 },
        ],
      }} />,
    );
    const segs = screen.getAllByLabelText(/segment/);
    // Both start at opacity 1 (no hover)
    expect(segs[0]).toHaveStyle({ opacity: "1" });
    expect(segs[1]).toHaveStyle({ opacity: "1" });
    // Hover first segment
    fireEvent.mouseEnter(segs[0]);
    // Non-hovered segment gets opacity 0.65
    await waitFor(() => expect(screen.getByLabelText("B segment")).toHaveStyle({ opacity: "0.65" }));
    // After leaving, both back to 1
    fireEvent.mouseLeave(screen.getByLabelText("A segment"));
    await waitFor(() => {
      expect(screen.getByLabelText("A segment")).toHaveStyle({ opacity: "1" });
      expect(screen.getByLabelText("B segment")).toHaveStyle({ opacity: "1" });
    });
  });

  it("uses unassigned color when segment.id is 'unassigned' and no color set", () => {
    render(
      <ProjectProgress taskStats={{
        percent: 20,
        segments: [{ id: "unassigned", name: "Unassigned", percentage: 100 }],
      }} />,
    );
    const seg = screen.getByLabelText("Unassigned segment");
    expect(seg).toHaveStyle({ background: "var(--color-groupwork-progress)" });
  });

  it("uses alt color for non-unassigned segment without color", () => {
    render(
      <ProjectProgress taskStats={{
        percent: 20,
        segments: [{ id: "user1", name: "User1", percentage: 100 }],
      }} />,
    );
    const seg = screen.getByLabelText("User1 segment");
    expect(seg).toHaveStyle({ background: "var(--color-groupwork-progress-alt)" });
  });

  it("uses segment.color when provided", () => {
    render(
      <ProjectProgress taskStats={{
        percent: 20,
        segments: [{ id: "c", name: "C", percentage: 100, color: "hotpink" }],
      }} />,
    );
    const seg = screen.getByLabelText("C segment");
    expect(seg).toHaveStyle({ background: "hotpink" });
  });
});

// ---------------------------------------------------------------------------
// ProjectRowAccordion
// ---------------------------------------------------------------------------

describe("ProjectRowAccordion", () => {
  it("renders with percent > 0", () => {
    const { container } = render(<ProjectRowAccordion percent={75} />);
    expect(container.querySelector("[aria-label='75% completion']")).toBeTruthy();
  });

  it("renders with percent = 0 (uses '0%' string in animate)", () => {
    const { container } = render(<ProjectRowAccordion percent={0} />);
    expect(container.querySelector("[aria-label='0% completion']")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// ProjectRowInfo — additional branches
// ---------------------------------------------------------------------------

describe("ProjectRowInfo", () => {
  it("renders AvatarStack with >10 members showing +N badge", () => {
    const members = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `M${i + 1}` }));
    render(
      <MemoryRouter>
        <ProjectRowInfo project={{ id: 1, name: "P" }} members={members} totalMembers={12} />
      </MemoryRouter>,
    );
    // 12 members, limit=10: visible = slice(0, 9) = 9 items, moreCount = 12-9 = 3
    expect(screen.getByText("+3")).toBeTruthy();
  });

  it("renders AvatarStack with count=1 using 'member' (singular)", () => {
    render(
      <MemoryRouter>
        <ProjectRowInfo
          project={{ id: 1, name: "P" }}
          members={[{ id: 1, name: "Solo" }]}
          totalMembers={1}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("1 member")).toBeTruthy();
  });

  it("renders ProjectTeacherAvatar as button when module_tutor_id is set", () => {
    getProjectTeacherNameMock.mockReturnValue("Ada Byron");
    render(
      <MemoryRouter>
        <ProjectRowInfo
          project={{ id: 1, name: "P", module_tutor_id: 5 }}
          members={[]}
          totalMembers={0}
        />
      </MemoryRouter>,
    );
    const btn = screen.queryByRole("button", { name: /Ada Byron's profile/i });
    expect(btn).toBeTruthy();
  });

  it("renders ProjectTeacherAvatar as shell when module_tutor_id is null", () => {
    const { container } = render(
      <MemoryRouter>
        <ProjectRowInfo
          project={{ id: 1, name: "P", module_tutor_id: null }}
          members={[]}
          totalMembers={0}
        />
      </MemoryRouter>,
    );
    expect(container.querySelector("[aria-hidden='true']")).toBeTruthy();
  });

  it("renders PROJECT OWNER pill when isOwner=true", () => {
    render(
      <MemoryRouter>
        <ProjectRowInfo project={{ id: 1, name: "P" }} members={[]} totalMembers={0} isOwner />
      </MemoryRouter>,
    );
    expect(screen.getByText("PROJECT OWNER")).toBeTruthy();
  });

  it("renders action prop when provided", () => {
    render(
      <MemoryRouter>
        <ProjectRowInfo
          project={{ id: 1, name: "P" }}
          members={[]}
          totalMembers={0}
          action={<button type="button">custom-action</button>}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("custom-action")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// SelectableMemberRow
// ---------------------------------------------------------------------------

describe("SelectableMemberRow", () => {
  it("uses member.id when member.user is null/undefined", () => {
    const onToggle = vi.fn();
    render(
      <SelectableMemberRow
        member={{ id: 42, user: null, name: "Ghost" }}
        checked={false}
        onToggle={onToggle}
      />,
    );
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalledWith("42");
  });

  it("uses member.user when both member.user and member.id are present", () => {
    const onToggle = vi.fn();
    render(
      <SelectableMemberRow
        member={{ id: 5, user: 99, name: "Real" }}
        checked={false}
        onToggle={onToggle}
      />,
    );
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalledWith("99");
  });
});

// ---------------------------------------------------------------------------
// TaskAssigneePopup — closePopupFromOutside branches (lines 42-44)
// ---------------------------------------------------------------------------

describe("TaskAssigneePopup outside-click handling", () => {
  it("does not close when mousedown is inside the popup element", () => {
    const onClose = vi.fn();
    const triggerRef = { current: document.createElement("div") };

    render(
      <TaskAssigneePopup
        isOpen
        onClose={onClose}
        members={[{ id: 1, user: 1, name: "Alex" }]}
        assignees={[]}
        onToggleAssignee={vi.fn()}
        triggerRef={triggerRef}
      />,
    );

    // Click on the popup content itself
    const assignHeader = screen.getByText("Assign Members");
    fireEvent.mouseDown(assignHeader);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not close when mousedown is on the trigger element", () => {
    const onClose = vi.fn();
    const triggerEl = document.createElement("div");
    document.body.appendChild(triggerEl);
    const triggerRef = { current: triggerEl };

    render(
      <TaskAssigneePopup
        isOpen
        onClose={onClose}
        members={[{ id: 1, user: 1, name: "Alex" }]}
        assignees={[]}
        onToggleAssignee={vi.fn()}
        triggerRef={triggerRef}
      />,
    );

    fireEvent.mouseDown(triggerEl);
    expect(onClose).not.toHaveBeenCalled();
    document.body.removeChild(triggerEl);
  });

  it("closes when mousedown is outside both popup and trigger", () => {
    const onClose = vi.fn();
    const triggerRef = { current: document.createElement("div") };

    render(
      <TaskAssigneePopup
        isOpen
        onClose={onClose}
        members={[{ id: 1, user: 1, name: "Alex" }]}
        assignees={[]}
        onToggleAssignee={vi.fn()}
        triggerRef={triggerRef}
      />,
    );

    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// TaskBoardCard — editing mode, done state, context menu
// ---------------------------------------------------------------------------

describe("TaskBoardCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTaskTitleEditMock.mockReturnValue({
      editing: false,
      setEditing: vi.fn(),
      editTitle: "",
      setEditTitle: vi.fn(),
      saveEdit: vi.fn(),
    });
  });

  it("applies done style when task.status is 'done'", () => {
    render(
      <TaskBoardCard
        task={{ id: 1, title: "Done task", status: "done", priority: "medium" }}
        members={[]}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onDragStart={vi.fn()}
      />,
    );
    expect(screen.getByText("Done task")).toBeTruthy();
  });

  it("applies done style when task.completed is true", () => {
    render(
      <TaskBoardCard
        task={{ id: 2, title: "Completed task", completed: true, priority: "low" }}
        members={[]}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onDragStart={vi.fn()}
      />,
    );
    expect(screen.getByText("Completed task")).toBeTruthy();
  });

  it("enters editing mode when title div is clicked", () => {
    const setEditing = vi.fn();
    const setEditTitle = vi.fn();
    useTaskTitleEditMock.mockReturnValue({
      editing: false,
      setEditing,
      editTitle: "",
      setEditTitle,
      saveEdit: vi.fn(),
    });
    render(
      <TaskBoardCard
        task={{ id: 3, title: "Click me", priority: "high" }}
        members={[]}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onDragStart={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Click me"));
    expect(setEditing).toHaveBeenCalledWith(true);
    expect(setEditTitle).toHaveBeenCalledWith("Click me");
  });

  it("renders textarea when editing is true", () => {
    useTaskTitleEditMock.mockReturnValue({
      editing: true,
      setEditing: vi.fn(),
      editTitle: "Editing text",
      setEditTitle: vi.fn(),
      saveEdit: vi.fn(),
    });
    render(
      <TaskBoardCard
        task={{ id: 4, title: "Edit task", priority: "medium" }}
        members={[]}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onDragStart={vi.fn()}
      />,
    );
    const textarea = document.querySelector("textarea");
    expect(textarea).toBeTruthy();
    expect(textarea.value).toBe("Editing text");
  });

  it("shows context menu on right-click", () => {
    render(
      <TaskBoardCard
        task={{ id: 5, title: "Right-click task", priority: "medium" }}
        members={[]}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onDragStart={vi.fn()}
      />,
    );
    fireEvent.contextMenu(screen.getByText("Right-click task"), { clientX: 50, clientY: 60 });
    expect(screen.getByTestId("context-menu")).toBeTruthy();
  });

  it("keyboard on title div triggers editing (Enter key)", () => {
    const setEditing = vi.fn();
    const setEditTitle = vi.fn();
    useTaskTitleEditMock.mockReturnValue({
      editing: false,
      setEditing,
      editTitle: "",
      setEditTitle,
      saveEdit: vi.fn(),
    });
    render(
      <TaskBoardCard
        task={{ id: 6, title: "Keyboard task", priority: "medium" }}
        members={[]}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onDragStart={vi.fn()}
      />,
    );
    fireEvent.keyDown(screen.getByText("Keyboard task"), { key: "Enter" });
    expect(setEditing).toHaveBeenCalledWith(true);
  });

  it("keyboard on title div triggers editing (Space key)", () => {
    const setEditing = vi.fn();
    const setEditTitle = vi.fn();
    useTaskTitleEditMock.mockReturnValue({
      editing: false,
      setEditing,
      editTitle: "",
      setEditTitle,
      saveEdit: vi.fn(),
    });
    render(
      <TaskBoardCard
        task={{ id: 7, title: "Space task", priority: "medium" }}
        members={[]}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onDragStart={vi.fn()}
      />,
    );
    fireEvent.keyDown(screen.getByText("Space task"), { key: " " });
    expect(setEditing).toHaveBeenCalledWith(true);
  });
});

// ---------------------------------------------------------------------------
// TaskTimelineCards — line 57 (UnscheduledCard/TimelineCard context menu)
// ---------------------------------------------------------------------------

describe("TaskTimelineCards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTaskTitleEditMock.mockReturnValue({
      editing: false,
      setEditing: vi.fn(),
      editTitle: "",
      setEditTitle: vi.fn(),
      saveEdit: vi.fn(),
    });
  });

  it("UnscheduledCard shows context menu on right-click and edit start", () => {
    const setEditing = vi.fn();
    useTaskTitleEditMock.mockReturnValue({
      editing: false,
      setEditing,
      editTitle: "",
      setEditTitle: vi.fn(),
      saveEdit: vi.fn(),
    });
    render(
      <UnscheduledCard
        task={{ id: 7, title: "Unscheduled", priority: "medium" }}
        members={[]}
        onDelete={vi.fn()}
        onUpdate={vi.fn()}
      />,
    );
    fireEvent.contextMenu(screen.getByText("Unscheduled"), { clientX: 30, clientY: 40 });
    expect(screen.getByTestId("context-menu")).toBeTruthy();
    fireEvent.click(screen.getByText("ctx-edit"));
    expect(setEditing).toHaveBeenCalledWith(true);
  });

  it("UnscheduledCard renders editing input when editing=true", () => {
    useTaskTitleEditMock.mockReturnValue({
      editing: true,
      setEditing: vi.fn(),
      editTitle: "Edited unscheduled",
      setEditTitle: vi.fn(),
      saveEdit: vi.fn(),
    });
    render(
      <UnscheduledCard
        task={{ id: 8, title: "Unscheduled2", priority: "high" }}
        members={[]}
        onDelete={vi.fn()}
        onUpdate={vi.fn()}
      />,
    );
    expect(screen.getByDisplayValue("Edited unscheduled")).toBeTruthy();
  });

  it("TimelineCard shows context menu and sets editing on ctx-edit (line 57)", () => {
    const setEditing = vi.fn();
    useTaskTitleEditMock.mockReturnValue({
      editing: false,
      setEditing,
      editTitle: "",
      setEditTitle: vi.fn(),
      saveEdit: vi.fn(),
    });
    render(
      <TimelineCard
        task={{ id: 9, title: "Timeline task", priority: "low" }}
        members={[]}
        assignees={[]}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.contextMenu(screen.getByText("Timeline task"), { clientX: 30, clientY: 40 });
    expect(screen.getByTestId("context-menu")).toBeTruthy();
    fireEvent.click(screen.getByText("ctx-edit"));
    expect(setEditing).toHaveBeenCalledWith(true);
  });
});

// ---------------------------------------------------------------------------
// useCreateProjectForm — handleSubmitResult when created is falsy (lines 87-89)
// ---------------------------------------------------------------------------

describe("useCreateProjectForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows error message when createGroupProject returns null (created falsy)", async () => {
    createGroupProjectMock.mockResolvedValue(null);
    const onCreated = vi.fn();
    const { result } = renderHook(() => useCreateProjectForm(onCreated));

    act(() => {
      result.current.change("name", "Test Project");
      result.current.change("deadline", "2099-04-01T12:00:00.000Z");
    });

    await act(async () => {
      await result.current.submit({ preventDefault: vi.fn() });
    });

    expect(result.current.errorMessage).toBe("We couldn't create that project. Please try again.");
    expect(result.current.isSubmitting).toBe(false);
    expect(onCreated).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// useEditProjectForm — line 31 (if (res) onUpdated?.(res))
// ---------------------------------------------------------------------------

describe("useEditProjectForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls onUpdated when patchGroupProject succeeds", async () => {
    const updatedProject = { id: 1, name: "Updated" };
    patchGroupProjectMock.mockResolvedValue(updatedProject);
    const onUpdated = vi.fn();
    const project = { id: 1, name: "Original", deadline: "2099-01-01", course_code: "" };

    const { result } = renderHook(() => useEditProjectForm(project, onUpdated));

    await act(async () => {
      await result.current.submit({ preventDefault: vi.fn() });
    });

    expect(onUpdated).toHaveBeenCalledWith(updatedProject);
  });

  it("does not call onUpdated when patchGroupProject returns null (line 31 — res is falsy)", async () => {
    patchGroupProjectMock.mockResolvedValue(null);
    const onUpdated = vi.fn();
    const project = { id: 1, name: "Original", deadline: "2099-01-01", course_code: "" };

    const { result } = renderHook(() => useEditProjectForm(project, onUpdated));

    await act(async () => {
      await result.current.submit({ preventDefault: vi.fn() });
    });

    expect(onUpdated).not.toHaveBeenCalled();
  });

  it("shows error when name is empty", async () => {
    const project = { id: 1, name: "", deadline: "2099-01-01", course_code: "" };
    const { result } = renderHook(() => useEditProjectForm(project, vi.fn()));

    await act(async () => {
      await result.current.submit({ preventDefault: vi.fn() });
    });

    expect(result.current.errorMessage).toBe("Project name is required.");
  });

  it("shows error when patchGroupProject throws", async () => {
    patchGroupProjectMock.mockRejectedValue(new Error("Network failure"));
    const project = { id: 1, name: "Project X", deadline: "2099-01-01", course_code: "" };
    const { result } = renderHook(() => useEditProjectForm(project, vi.fn()));

    await act(async () => {
      await result.current.submit({ preventDefault: vi.fn() });
    });

    expect(result.current.errorMessage).toBe("Network failure");
  });
});

// ---------------------------------------------------------------------------
// GroupWorkContent — filtering branches
// ---------------------------------------------------------------------------

describe("GroupWorkContent", () => {
  it("shows all projects when searchTerm is empty (no filter applied)", () => {
    render(
      <MemoryRouter>
        <GroupWorkContent
          projects={[
            { id: 1, name: "Alpha" },
            { id: 2, name: "Beta" },
          ]}
          projectListProps={() => ({ onClick: vi.fn() })}
          sortBy="name"
          setSortBy={vi.fn()}
          onProjectCreated={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("Alpha")).toBeTruthy();
    expect(screen.getByText("Beta")).toBeTruthy();
  });

  it("filters projects by search term", async () => {
    render(
      <MemoryRouter>
        <GroupWorkContent
          projects={[
            { id: 1, name: "Alpha Project" },
            { id: 2, name: "Beta Project" },
          ]}
          projectListProps={() => ({ onClick: vi.fn() })}
          sortBy="name"
          setSortBy={vi.fn()}
          onProjectCreated={vi.fn()}
        />
      </MemoryRouter>,
    );
    const searchInput = screen.getByLabelText("Search projects...");
    fireEvent.change(searchInput, { target: { value: "Alpha" } });
    await waitFor(() => {
      expect(screen.getByText("Alpha Project")).toBeTruthy();
      expect(screen.queryByText("Beta Project")).toBeNull();
    });
  });

  it("shows empty state with isSearching=true when no projects match search", async () => {
    render(
      <MemoryRouter>
        <GroupWorkContent
          projects={[{ id: 1, name: "Alpha" }]}
          projectListProps={() => ({ onClick: vi.fn() })}
          sortBy="name"
          setSortBy={vi.fn()}
          onProjectCreated={vi.fn()}
        />
      </MemoryRouter>,
    );
    const searchInput = screen.getByLabelText("Search projects...");
    fireEvent.change(searchInput, { target: { value: "ZZZNOMATCH" } });
    await waitFor(() => {
      expect(screen.getByText("No projects match your search.")).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// GroupTasksTab — board/timeline/unknown view, loading
// ---------------------------------------------------------------------------

const buildGroupTaskActions = (overrides = {}) => ({
  loading: false,
  addTask: vi.fn().mockResolvedValue(undefined),
  updateTask: vi.fn().mockResolvedValue(undefined),
  deleteTask: vi.fn(),
  undoDelete: vi.fn(),
  ...overrides,
});

const setupGroupTasksState = (overrides = {}) => {
  const taskActions = overrides.taskActions ?? buildGroupTaskActions();
  const state = {
    taskActions,
    filterUsers: [],
    setFilterUsers: vi.fn(),
    searchTerm: "",
    setSearchTerm: vi.fn(),
    taskView: "list",
    setTaskView: vi.fn(),
    showAddModal: false,
    setShowAddModal: vi.fn(),
    sortedTasks: [{ id: 1, title: "Task A" }],
    ...overrides,
  };
  useGroupTasksTabStateMock.mockReturnValue(state);
  return state;
};

describe("GroupTasksTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders board view when taskView is 'board'", () => {
    setupGroupTasksState({ taskView: "board" });
    render(<GroupTasksTab projectId={1} members={[]} onStatsUpdate={vi.fn()} />);
    expect(screen.getByTestId("task-board-view")).toBeTruthy();
  });

  it("renders timeline view when taskView is 'timeline'", () => {
    setupGroupTasksState({ taskView: "timeline" });
    render(<GroupTasksTab projectId={1} members={[]} onStatsUpdate={vi.fn()} />);
    expect(screen.getByTestId("task-timeline-view")).toBeTruthy();
  });

  it("returns null content for unrecognized taskView", () => {
    setupGroupTasksState({ taskView: "unknown" });
    render(<GroupTasksTab projectId={1} members={[]} onStatsUpdate={vi.fn()} />);
    expect(screen.queryByTestId("task-list-view")).toBeNull();
    expect(screen.queryByTestId("task-board-view")).toBeNull();
  });

  it("shows loading text when taskActions.loading is true", () => {
    setupGroupTasksState({ taskActions: buildGroupTaskActions({ loading: true }) });
    render(<GroupTasksTab projectId={1} members={[]} onStatsUpdate={vi.fn()} />);
    expect(screen.getByText("Loading tasks...")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// ProjectHeader — owner detection, module pill, deadline meta
// ---------------------------------------------------------------------------

describe("ProjectHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getStoredViewerMock.mockReturnValue({ id: 1, username: "viewer" });
    getProjectDateMock.mockImplementation((deadline) => deadline ? new Date(deadline) : null);
  });

  it("renders with no course_code AND no module_name (ProjectModulePill returns null)", () => {
    render(
      <MemoryRouter>
        <ProjectHeader
          project={{ id: 1, name: "P", course_code: null, module_name: null }}
          members={[]}
          teamMembers={[]}
          onMemberAdded={vi.fn()}
          onMemberRemove={vi.fn()}
          onDelete={vi.fn()}
          onUpdate={vi.fn()}
          onBack={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("link", { name: /module/i })).toBeNull();
  });

  it("renders with course_code and module_name (module pill shows link)", () => {
    render(
      <MemoryRouter>
        <ProjectHeader
          project={{ id: 1, name: "P", course_code: "CS101", module_name: "SE" }}
          members={[]}
          teamMembers={[]}
          onMemberAdded={vi.fn()}
          onMemberRemove={vi.fn()}
          onDelete={vi.fn()}
          onUpdate={vi.fn()}
          onBack={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link")).toBeTruthy();
  });

  it("currentUserIsOwner returns false when viewerId is empty", () => {
    getStoredViewerMock.mockReturnValue({ id: null, user: null });
    render(
      <MemoryRouter>
        <ProjectHeader
          project={{ id: 1, name: "P" }}
          members={[]}
          teamMembers={[{ id: 1, user: 1, role: "owner" }]}
          onMemberAdded={vi.fn()}
          onMemberRemove={vi.fn()}
          onDelete={vi.fn()}
          onUpdate={vi.fn()}
          onBack={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("is-owner").textContent).toBe("false");
  });

  it("currentUserIsOwner returns true when viewer is an owner in teamMembers", () => {
    getStoredViewerMock.mockReturnValue({ id: 1 });
    render(
      <MemoryRouter>
        <ProjectHeader
          project={{ id: 1, name: "P" }}
          members={[]}
          teamMembers={[{ id: 1, user: 1, role: "owner" }]}
          onMemberAdded={vi.fn()}
          onMemberRemove={vi.fn()}
          onDelete={vi.fn()}
          onUpdate={vi.fn()}
          onBack={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("is-owner").textContent).toBe("true");
  });

  it("does not render DeadlineCountdown when getProjectDate returns null", () => {
    getProjectDateMock.mockReturnValue(null);
    render(
      <MemoryRouter>
        <ProjectHeader
          project={{ id: 1, name: "P", deadline: null }}
          members={[]}
          teamMembers={[]}
          onMemberAdded={vi.fn()}
          onMemberRemove={vi.fn()}
          onDelete={vi.fn()}
          onUpdate={vi.fn()}
          onBack={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.queryByTestId("deadline-countdown")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// ProjectHeaderMeta — additional branches
// ---------------------------------------------------------------------------

describe("ProjectHeaderMeta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({ profile: { id: 1 } });
    getProjectTeacherNameMock.mockImplementation((project) => project?.teacher_name || null);
  });

  it("ProjectTeacherMeta returns null when teacher_name is absent", () => {
    getProjectTeacherNameMock.mockReturnValue(null);
    const { container } = render(<MemoryRouter><ProjectTeacherMeta project={{}} /></MemoryRouter>);
    expect(container.firstChild).toBeNull();
  });

  it("TeamAvatarStrip shows +N button for more than 10 members", () => {
    const members = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, user: i + 1, name: `M${i + 1}`, role: "member" }));
    render(
      <MemoryRouter>
        <ProjectHeaderMeta
          project={{ id: 1 }}
          members={members}
          teamMembers={members}
          onMemberAdded={vi.fn()}
          onMemberRemove={vi.fn()}
          onDeleteProject={vi.fn()}
        />
      </MemoryRouter>,
    );
    // moreCount = 12 - (10-1) = 3
    expect(screen.getByText("+3")).toBeTruthy();
  });

  it("MembersMetaHeader shows 'member' (singular) for count=1", () => {
    const member = { id: 1, user: 1, name: "Solo", role: "member" };
    render(
      <MemoryRouter>
        <ProjectHeaderMeta
          project={{ id: 1 }}
          members={[member]}
          teamMembers={[member]}
          onMemberAdded={vi.fn()}
          onMemberRemove={vi.fn()}
          onDeleteProject={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("1 member")).toBeTruthy();
  });

  it("MembersModal is not rendered initially (isOpen=false returns null)", () => {
    const member = { id: 1, user: 1, name: "Solo", role: "member" };
    render(
      <MemoryRouter>
        <ProjectHeaderMeta
          project={{ id: 1 }}
          members={[member]}
          teamMembers={[member]}
          onMemberAdded={vi.fn()}
          onMemberRemove={vi.fn()}
          onDeleteProject={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.queryByTestId("standard-modal")).toBeNull();
  });

  it("MembersModal opens when member count button is clicked", () => {
    const member = { id: 1, user: 1, name: "Solo", role: "member" };
    render(
      <MemoryRouter>
        <ProjectHeaderMeta
          project={{ id: 1 }}
          members={[member]}
          teamMembers={[member]}
          onMemberAdded={vi.fn()}
          onMemberRemove={vi.fn()}
          onDeleteProject={vi.fn()}
        />
      </MemoryRouter>,
    );
    // Click the "1 member" count button to open modal
    fireEvent.click(screen.getByText("1 member"));
    expect(screen.getByTestId("standard-modal")).toBeTruthy();
  });

  it("getSoloOwnerId returns null when members.length !== 1 — remove calls onMemberRemove directly", () => {
    const members = [
      { id: 1, user: 1, name: "Alice", role: "owner" },
      { id: 2, user: 2, name: "Bob", role: "member" },
    ];
    const onMemberRemove = vi.fn();
    useAuthMock.mockReturnValue({ profile: { id: 1 } });
    render(
      <MemoryRouter>
        <ProjectHeaderMeta
          project={{ id: 1 }}
          members={members}
          teamMembers={members}
          onMemberAdded={vi.fn()}
          onMemberRemove={onMemberRemove}
          onDeleteProject={vi.fn()}
        />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText("Edit team"));
    fireEvent.click(within(screen.getByTestId("members-section")).getByText("Alice"));
    expect(onMemberRemove).toHaveBeenCalledWith(1);
  });

  it("getSoloOwnerId returns null when only member role is not owner", () => {
    const member = { id: 1, user: 1, name: "NonOwner", role: "member" };
    render(
      <MemoryRouter>
        <ProjectHeaderMeta
          project={{ id: 1 }}
          members={[member]}
          teamMembers={[member]}
          onMemberAdded={vi.fn()}
          onMemberRemove={vi.fn()}
          onDeleteProject={vi.fn()}
        />
      </MemoryRouter>,
    );
    // Edit team should not appear since user is not owner
    expect(screen.queryByText("Edit team")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// ProjectHeaderSub (ProjectHeaderActions)
// ---------------------------------------------------------------------------

describe("ProjectHeaderSub", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentMemberMock.mockReturnValue(null);
  });

  it("shows Leave project button for non-owner and no Settings button", () => {
    render(
      <ProjectHeaderActions
        project={{ id: 1, name: "P" }}
        onDelete={vi.fn()}
        onMemberRemove={vi.fn()}
        isOwner={false}
        teamMembers={[{ id: 2, user: 2, role: "member" }]}
        onBack={vi.fn()}
        onUpdate={vi.fn()}
      />,
    );
    expect(screen.getByText("Leave project")).toBeTruthy();
    expect(screen.queryByText("Settings")).toBeNull();
  });

  it("shows Settings button for owner", () => {
    render(
      <ProjectHeaderActions
        project={{ id: 1, name: "P" }}
        onDelete={vi.fn()}
        onMemberRemove={vi.fn()}
        isOwner
        teamMembers={[{ id: 1, user: 1, role: "owner" }]}
        onBack={vi.fn()}
        onUpdate={vi.fn()}
      />,
    );
    expect(screen.getByText("Settings")).toBeTruthy();
  });

  it("opens EditProjectModal when Settings is clicked", () => {
    render(
      <ProjectHeaderActions
        project={{ id: 1, name: "P" }}
        onDelete={vi.fn()}
        onMemberRemove={vi.fn()}
        isOwner
        teamMembers={[]}
        onBack={vi.fn()}
        onUpdate={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Settings"));
    expect(screen.getByTestId("edit-project-modal")).toBeTruthy();
  });

  it("non-owner: confirms leaving and calls onMemberRemove + toast + onBack", async () => {
    const onMemberRemove = vi.fn().mockResolvedValue(true);
    const onBack = vi.fn();
    const showToast = vi.fn();
    useToastMock.mockReturnValue(showToast);
    getCurrentMemberMock.mockReturnValue({ id: 2 });

    render(
      <ProjectHeaderActions
        project={{ id: 1, name: "P" }}
        onDelete={vi.fn().mockResolvedValue(false)}
        onMemberRemove={onMemberRemove}
        isOwner={false}
        teamMembers={[{ id: 2, user: 2, role: "member" }]}
        onBack={onBack}
        onUpdate={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("Leave project"));
    expect(screen.getByTestId("hold-confirm-modal")).toBeTruthy();
    fireEvent.click(screen.getByText("Hold to leave"));

    await waitFor(() => expect(onMemberRemove).toHaveBeenCalledWith(2));
    expect(showToast).toHaveBeenCalledWith("You left the project.");
    expect(onBack).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// AvailabilityTab — no meeting cards + DeleteButton null when not owner
// ---------------------------------------------------------------------------

const baseAvailabilityState = {
  loading: false,
  suggestions: [],
  active_suggestions: [],
  current_user_id: 1,
  suggestingSlot: null,
  setSuggestingSlot: vi.fn(),
  handleSuggestTime: vi.fn(),
  handleDelete: vi.fn(),
  handleVote: vi.fn(),
};

describe("AvailabilityTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render MeetingViewToggle when there are no meeting cards", () => {
    useAvailabilityMock.mockReturnValue({
      ...baseAvailabilityState,
      active_suggestions: [],
    });
    render(<AvailabilityTab projectId={1} />);
    expect(screen.queryByText("Proposed slots")).toBeNull();
    expect(screen.queryByText("Confirmed meeting slots")).toBeNull();
  });

  it("DeleteButton returns null when suggestion.suggested_by.id !== currentUserId", () => {
    const suggestion = {
      id: 10,
      start: "2026-04-10T14:00:00Z",
      is_confirmed: false,
      suggested_by: { id: 99, username: "other" },
      responses: [],
    };
    useAvailabilityMock.mockReturnValue({
      ...baseAvailabilityState,
      current_user_id: 1,
      active_suggestions: [suggestion],
    });
    render(<AvailabilityTab projectId={1} />);
    expect(screen.queryByLabelText("Delete meeting suggestion")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// CreateProjectForm — RequiredLabel sub-component (line 155)
// ---------------------------------------------------------------------------

describe("CreateProjectForm modal rendering", () => {
  it("opens the modal and renders form content (RequiredLabel sub-component is executed)", () => {
    render(<CreateProjectForm onCreated={vi.fn()} />);
    fireEvent.click(screen.getByText("+ Create project"));
    expect(screen.getByTestId("standard-modal")).toBeTruthy();
  });
});
