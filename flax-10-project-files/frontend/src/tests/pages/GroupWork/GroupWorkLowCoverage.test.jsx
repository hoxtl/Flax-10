import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const toastMock = vi.fn();
const openMemberProfileMock = vi.fn();
const openTeacherProfileMock = vi.fn();
const getStoredViewerMock = vi.fn();
const getDisplayNameMock = vi.fn((member) => member.name || member.username || member.user_name || "User");

vi.mock("react-dom", async () => {
  const actual = await vi.importActual("react-dom");
  return {
    ...actual,
    createPortal: (node) => node,
  };
});

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: new Proxy(
    {},
    {
      get: (_, tag) => {
        const Tag = typeof tag === "string" ? tag : "div";
        return ({ children, ...props }) => <Tag {...props}>{children}</Tag>;
      },
    },
  ),
}));

vi.mock("../../../context/ToastContext", () => ({
  useToast: () => toastMock,
}));

vi.mock("../../../pages/GroupWork/utils/memberAvatarUtils", () => ({
  getDisplayName: (...args) => getDisplayNameMock(...args),
  getStoredViewer: (...args) => getStoredViewerMock(...args),
  openMemberProfile: (...args) => openMemberProfileMock(...args),
}));

vi.mock("../../../pages/GroupWork/utils/projectRowUtils", () => ({
  getProjectMemberCount: vi.fn((members) => members.length),
  getProjectTeacherName: vi.fn((project) => project.teacher_name || null),
  openTeacherProfile: (...args) => openTeacherProfileMock(...args),
  getVisibleMembers: vi.fn((members) => members),
}));

vi.mock("../../../components/common/Badge/Badge", () => ({
  default: ({ children, ...props }) => <span {...props}>{children}</span>,
}));

vi.mock("../../../components/common/Tooltip/Tooltip", () => ({
  default: ({ children, content }) => <span title={content}>{children}</span>,
}));

vi.mock("../../../components/common/HoldConfirmModal/HoldConfirmModal", () => ({
  default: ({ title, warningBanner, warningText, cancelLabel, holdLabel, onCancel, onConfirm }) => (
    <div data-testid="hold-confirm-modal">
      <div>{title}</div>
      <div>{warningBanner}</div>
      <div>{warningText}</div>
      <button type="button" onClick={onCancel}>
        {cancelLabel}
      </button>
      <button type="button" onClick={onConfirm}>
        {holdLabel}
      </button>
    </div>
  ),
}));

vi.mock("../../../components/common/PrimaryButton/PrimaryButton", () => ({
  default: ({ children, onClick, disabled, ...props }) => (
    <button type="button" onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("../../../pages/GroupWork/components/AddMemberForm", () => ({
  default: ({ projectId }) => <div data-testid="add-member-form">add members for {projectId}</div>,
}));

vi.mock("../../../pages/GroupWork/components/MembersSection", () => ({
  default: ({ members, onRemove, canRemove, allowOwnerRemove }) => (
    <div data-testid="members-section" data-can-remove={String(canRemove)} data-allow-owner-remove={String(allowOwnerRemove)}>
      <div>{members.map((member) => member.name || member.username || member.user_name).join(",")}</div>
      <button type="button" onClick={() => onRemove(members[0]?.id)}>
        remove-first
      </button>
    </div>
  ),
}));

vi.mock("../../../pages/GroupWork/components/MemberAvatar", () => ({
  default: ({ member }) => <span>{member.name || member.username || member.user_name}</span>,
}));

vi.mock("../../../pages/GroupWork/components/TaskAssigneePopup", () => ({
  default: ({ isOpen, members, onToggleAssignee, onClose }) =>
    isOpen ? (
      <div data-testid="task-assignee-popup">
        <button type="button" onClick={() => onToggleAssignee(members[1]?.user ?? members[1]?.id)}>
          toggle-assignee
        </button>
        <button type="button" onClick={onClose}>
          close-popup
        </button>
      </div>
    ) : null,
}));

vi.mock("../../../pages/GroupWork/components/TaskAvatarStack", () => ({
  default: ({ assignees }) => <div>{`avatars:${assignees.length}`}</div>,
}));

vi.mock("../../../components/common/TaskPriorityPill/TaskPriorityPill", () => ({
  default: ({ priority }) => <div>{priority}</div>,
}));

vi.mock("../../../components/common/inputs/DateTimePicker", () => ({
  default: ({ value, onChange, placeholder }) => (
    <input
      aria-label={placeholder}
      value={value || ""}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

import { ProjectHeaderMeta } from "../../../pages/GroupWork/components/ProjectHeaderMeta";
import { ProjectTeacherMeta } from "../../../pages/GroupWork/components/ProjectHeaderMeta";
import ProjectDeleteAction from "../../../pages/GroupWork/components/ProjectHeaderSub";
import TaskBoardCard from "../../../pages/GroupWork/components/TaskBoardCard";
import TaskContextMenu from "../../../pages/GroupWork/components/TaskContextMenu";
import TaskListRow from "../../../pages/GroupWork/components/TaskListRow";

describe("GroupWork low coverage components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getStoredViewerMock.mockReturnValue({ id: 1, username: "owner" });
    openMemberProfileMock.mockReset();
    openTeacherProfileMock.mockReset();
    toastMock.mockReset();
  });

  it("renders project header metadata and opens the owner removal flow", async () => {
    const onMemberAdded = vi.fn();
    const onMemberRemove = vi.fn();
    const onDeleteProject = vi.fn().mockResolvedValue(true);

    render(
      <MemoryRouter>
        <>
          <ProjectTeacherMeta project={{ teacher_name: "Dr Ada" }} />
          <ProjectHeaderMeta
            project={{ id: 8, teacher_name: "Dr Ada" }}
            members={[{ id: 1, user: 1, name: "Alex", role: "owner" }]}
            teamMembers={[{ id: 1, user: 1, name: "Alex", role: "owner" }]}
            onMemberAdded={onMemberAdded}
            onMemberRemove={onMemberRemove}
            onDeleteProject={onDeleteProject}
          />
        </>
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: /Open Dr Ada's profile/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit team" }));
    expect(screen.getByTestId("add-member-form")).toHaveTextContent("8");
    expect(screen.getByTestId("members-section")).toHaveAttribute("data-can-remove", "true");
    expect(screen.getByTestId("members-section")).toHaveAttribute("data-allow-owner-remove", "true");

    fireEvent.click(screen.getByText("remove-first"));
    expect(screen.getByTestId("hold-confirm-modal")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Hold to delete"));
    await waitFor(() => expect(onDeleteProject).toHaveBeenCalled());
    expect(onMemberRemove).not.toHaveBeenCalled();
  });

  it("hides project team controls for non-owners and no-op metadata is empty", () => {
    getStoredViewerMock.mockReturnValue({ id: 9, username: "guest" });

    const { container, rerender } = render(
      <MemoryRouter>
        <ProjectHeaderMeta project={{ id: 1 }} members={[]} teamMembers={[]} />
      </MemoryRouter>,
    );
    expect(container).toBeDefined();
    expect(container.textContent).toBe("");

    rerender(
      <MemoryRouter>
        <ProjectHeaderMeta
          project={{ id: 1, course_code: "", module_name: "" }}
          members={[{ id: 2, user: 2, name: "Bea", role: "member" }]}
          teamMembers={[{ id: 2, user: 2, name: "Bea", role: "owner" }]}
        />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("button", { name: "Edit team" })).not.toBeInTheDocument();
  });

  it("handles owner and non-owner delete actions", async () => {
    const onDelete = vi.fn().mockResolvedValue(true);

    const { rerender } = render(<ProjectDeleteAction onDelete={onDelete} isOwner={false} />);
    expect(screen.getByRole("button", { name: /Delete project/i })).toBeDisabled();

    rerender(<ProjectDeleteAction onDelete={onDelete} isOwner />);
    fireEvent.click(screen.getByRole("button", { name: /Delete project/i }));

    expect(screen.getByTestId("hold-confirm-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Hold to delete"));
    await waitFor(() => expect(onDelete).toHaveBeenCalled());
    expect(toastMock).toHaveBeenCalledWith("Project deleted.");
  });

  it("supports task board card editing, assignee updates, due dates, and context menu actions", async () => {
    const onUpdate = vi.fn();
    const onDelete = vi.fn();
    const onDragStart = vi.fn();

    render(
      <TaskBoardCard
        task={{
          id: 11,
          title: "Write essay",
          priority: "high",
          status: "todo",
          completed: true,
          due_date: "2026-03-24T09:00:00.000Z",
          assignees_info: [{ id: 1, user: 1, name: "Alex" }],
        }}
        members={[
          { id: 1, user: 1, name: "Alex" },
          { id: 2, user: 2, name: "Bea" },
        ]}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onDragStart={onDragStart}
      />,
    );

    const card = screen.getByText("Write essay").closest("[draggable='true']");
    expect(card.className).toContain("boardCardDone");

    fireEvent.dragStart(card, { dataTransfer: { setData: vi.fn() } });
    expect(onDragStart).toHaveBeenCalledWith(expect.any(Object), 11);

    fireEvent.change(screen.getByLabelText("No due date"), { target: { value: "2026-03-25T09:00:00Z" } });
    expect(onUpdate).toHaveBeenCalledWith(11, { due_date: "2026-03-25T09:00:00.000Z" });

    fireEvent.click(screen.getByText("+"));
    expect(screen.getByTestId("task-assignee-popup")).toBeInTheDocument();
    fireEvent.click(screen.getByText("toggle-assignee"));
    expect(onUpdate).toHaveBeenCalledWith(11, { assigned_to: [1, 2] });

    fireEvent.contextMenu(card, { clientX: 40, clientY: 50 });
    fireEvent.click(screen.getByText("Edit"));
    const titleInput = screen.getByRole("textbox");
    fireEvent.change(titleInput, { target: { value: "Write final essay" } });
    fireEvent.blur(titleInput);
    expect(onUpdate).toHaveBeenCalledWith(11, { title: "Write final essay" });

    fireEvent.contextMenu(screen.getByText("Write essay").closest("[draggable='true']"));
    fireEvent.click(screen.getByText("Delete"));
    expect(onDelete).toHaveBeenCalledWith(11);
  });

  it("updates list row state, assignees, and delete confirmation", async () => {
    const onToggle = vi.fn();
    const onUpdate = vi.fn();
    const onDelete = vi.fn();

    render(
      <TaskListRow
        task={{
          id: 22,
          title: "Draft slides",
          completed: true,
          priority: undefined,
          due_date: "2026-03-26T12:00:00.000Z",
          assignees_info: [{ id: 1, user: 1, name: "Alex" }],
        }}
        members={[
          { id: 1, user: 1, name: "Alex" },
          { id: 2, user: 2, name: "Bea" },
        ]}
        onToggle={onToggle}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText("medium")).toBeInTheDocument();
    expect(screen.getByText("avatars:1")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(onToggle).toHaveBeenCalledWith(22, false);

    fireEvent.click(screen.getByText("Draft slides"));
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Draft final slides" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onUpdate).toHaveBeenCalledWith(22, { title: "Draft final slides" });

    fireEvent.change(screen.getByLabelText("No due date"), { target: { value: "2026-03-27T10:00:00Z" } });
    expect(onUpdate).toHaveBeenCalledWith(22, { due_date: "2026-03-27T10:00:00.000Z" });

    fireEvent.click(screen.getByText("avatars:1").parentElement);
    fireEvent.click(screen.getByText("toggle-assignee"));
    expect(onUpdate).toHaveBeenCalledWith(22, { assigned_to: [2] });

    fireEvent.click(screen.getByTitle("Delete task"));
    expect(screen.getByTestId("hold-confirm-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Hold to delete"));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(22));
  });

  it("closes the task context menu from outside clicks and executes menu actions", () => {
    const onClose = vi.fn();
    const onDelete = vi.fn();
    const onEditStart = vi.fn();

    render(
      <TaskContextMenu
        pos={{ x: 20, y: 30 }}
        task={{ id: 9, title: "Review notes" }}
        onDelete={onDelete}
        onClose={onClose}
        onEditStart={onEditStart}
      />,
    );

    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalled();

    fireEvent.click(screen.getByText("Edit"));
    expect(onEditStart).toHaveBeenCalled();

    fireEvent.click(screen.getByText("Delete"));
    expect(onDelete).toHaveBeenCalledWith(9);
  });
});
