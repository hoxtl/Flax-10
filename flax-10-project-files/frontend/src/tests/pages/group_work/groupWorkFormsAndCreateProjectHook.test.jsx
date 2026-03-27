import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, renderHook } from "@testing-library/react";

const addProjectMember = vi.fn();
const createGroupProject = vi.fn();
const getStoredViewer = vi.fn();
const getDisplayName = vi.fn((member) => member.name || member.username || member.user_name || "User");

vi.mock("../../../pages/group_work/api/groupWorkApi", () => ({
  addProjectMember: (...args) => addProjectMember(...args),
  createGroupProject: (...args) => createGroupProject(...args),
}));

vi.mock("../../../pages/group_work/utils/memberAvatarUtils", () => ({
  getStoredViewer: (...args) => getStoredViewer(...args),
  getDisplayName: (...args) => getDisplayName(...args),
}));

vi.mock("../../../components/common/search_empty_state/SearchEmptyState", () => ({
  default: ({ title, hint, query, onClear }) => (
    <div>
      <span>{title}</span>
      <span>{hint}</span>
      <span>{query}</span>
      <button type="button" onClick={onClear}>clear-empty</button>
    </div>
  ),
}));

vi.mock("../../../components/social/components/UserSearch", () => ({
  default: ({ onUserSelect, filterUsers, renderEmptyState }) => {
    const filtered = filterUsers?.([
      { id: 1, username: "owner" },
      { id: 2, username: "alex" },
      { id: 3, username: "bea" },
    ]) || [];
    return (
      <div>
        <button type="button" onClick={() => onUserSelect?.({ id: 2, username: "alex" })}>select-user</button>
        <div>{filtered.map((user) => user.username).join(",")}</div>
        {renderEmptyState?.({ query: "nobody", clear: vi.fn() })}
      </div>
    );
  },
}));

vi.mock("../../../components/common/standard_modal/StandardModal", () => ({
  default: ({ title, children, onClose }) => (
    <div>
      <h2>{title}</h2>
      <button type="button" onClick={onClose}>close-modal</button>
      {children}
    </div>
  ),
}));

vi.mock("../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, onClick, type = "button", disabled, pill, variant, size, ...props }) => (
    <button type={type} onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("../../../components/common/inputs/DateTimePicker", () => ({
  default: ({ value, onChange, placeholder }) => (
    <input
      aria-label={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

vi.mock("../../../pages/group_work/components/MemberAvatar", () => ({
  default: ({ member }) => <span>{member.name || member.username || member.user_name}</span>,
}));

vi.mock("../../../components/common/form_field/FormField", () => ({
  default: ({ label, children, error }) => (
    <div>
      <div>{label}</div>
      {children}
      {error ? <span>{error}</span> : null}
    </div>
  ),
}));

vi.mock("../../../components/common/text_input/TextInput", () => ({
  default: ({ value, onChange, placeholder }) => (
    <input aria-label={placeholder} value={value} onChange={onChange} />
  ),
}));

vi.mock("../../../components/modules/components/UserModuleDropdown", () => ({
  default: ({ value, onChange, placeholder }) => (
    <select aria-label={placeholder} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">None</option>
      <option value="5CCS2SEG">5CCS2SEG</option>
    </select>
  ),
}));

vi.mock("../../../components/common/tags_selector/TagsSelector", () => ({
  TagsSelector: ({ tags, onSelectionChange }) => (
    <div>
      <span>{tags.map((tag) => tag.label).join(",")}</span>
      <button type="button" onClick={() => onSelectionChange([])}>trim-tags</button>
    </div>
  ),
}));

import AddMemberForm from "../../../pages/group_work/components/AddMemberForm";
import AddTaskModal from "../../../pages/group_work/components/AddTaskModal";
import CreateProjectForm from "../../../pages/group_work/components/CreateProjectForm";
import { CreateProjectInputs } from "../../../pages/group_work/components/CreateProjectInputs";
import { useCreateProjectForm } from "../../../pages/group_work/components/useCreateProjectForm";

describe("GroupWork forms extras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getStoredViewer.mockReturnValue({ id: 1, username: "owner" });
  });

  it("filters existing members and adds a new member through AddMemberForm", async () => {
    const onAdded = vi.fn();
    addProjectMember.mockResolvedValue({ id: 2, user: 2, username: "alex" });

    render(
      <AddMemberForm
        projectId={7}
        members={[{ id: 1, user: 1 }, { id: 3, user: 3 }]}
        onAdded={onAdded}
      />,
    );

    expect(screen.getByText("alex")).toBeInTheDocument();
    expect(screen.queryByText("owner")).not.toBeInTheDocument();
    expect(screen.queryByText("bea")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("select-user"));
    await waitFor(() => expect(addProjectMember).toHaveBeenCalledWith(7, 2));
    expect(onAdded).toHaveBeenCalledWith({ id: 2, user: 2, username: "alex" });
  });

  it("renders members in AddTaskModal", () => {
    render(
      <AddTaskModal
        members={[{ id: 10, name: "Ava" }]}
        onAdd={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getAllByText("Ava").length).toBeGreaterThan(0);
  });

  it("hides the assignee field when AddTaskModal has no members", () => {
    render(<AddTaskModal members={[]} onAdd={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByText("Assign to")).toBeNull();
  });

  it("prevents submission of AddTaskModal without required fields", async () => {
    const onAdd = vi.fn();
    render(<AddTaskModal members={[]} onAdd={onAdd} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("Add task"));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("submits AddTaskModal when title and due date are provided", async () => {
    const onAdd = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();
    render(<AddTaskModal members={[{ id: 10, name: "Ava" }]} onAdd={onAdd} onClose={onClose} />);
    
    fireEvent.change(screen.getByPlaceholderText("What needs to be done?"), { target: { value: "Draft slides" } });
    fireEvent.change(screen.getByLabelText("Pick a due date"), { target: { value: "2026-03-28" } });
    fireEvent.click(screen.getByText("Add task"));

    await waitFor(() => expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ title: "Draft slides", due_date: "2026-03-28" })));
    expect(onClose).toHaveBeenCalled();
  });

  it("removes an assignee when the same member is toggled twice", async () => {
    const onAdd = vi.fn().mockResolvedValue(true);
    render(<AddTaskModal members={[{ id: 10, name: "Ava" }]} onAdd={onAdd} onClose={vi.fn()} />);

    const [checkbox] = screen.getAllByRole("checkbox");
    fireEvent.click(checkbox);
    fireEvent.click(checkbox);
    fireEvent.change(screen.getByPlaceholderText("What needs to be done?"), { target: { value: "Draft slides" } });
    fireEvent.click(screen.getByText("Add task"));

    await waitFor(() => expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ assigned_to: [] })));
  });

  it("renders CreateProjectInputs and forwards field changes", () => {
    const onChange = vi.fn();
    render(
      <CreateProjectInputs
        data={{ name: "Alpha", course_code: "", deadline: "" }}
        onChange={onChange}
        errors={{ name: "Missing name" }}
      />,
    );

    fireEvent.change(screen.getByLabelText("e.g. Machine Learning Research..."), { target: { value: "Beta" } });
    fireEvent.change(screen.getByLabelText("Select..."), { target: { value: "5CCS2SEG" } });
    fireEvent.change(screen.getByLabelText("Select due date"), { target: { value: "2026-03-30" } });

    expect(onChange).toHaveBeenCalledWith("name", "Beta");
    expect(onChange).toHaveBeenCalledWith("course_code", "5CCS2SEG");
    expect(onChange).toHaveBeenCalledWith("deadline", "2026-03-30");
    expect(screen.getByText("Missing name")).toBeInTheDocument();
  });

  it("opens, submits, trims member tags, and closes CreateProjectForm", async () => {
    const onCreated = vi.fn();
    createGroupProject.mockResolvedValue({
      id: 9,
      name: "Systems Sprint",
    });

    render(<CreateProjectForm onCreated={onCreated} />);
    fireEvent.click(screen.getByText("+ Create project"));

    fireEvent.change(screen.getByLabelText("e.g. Machine Learning Research..."), { target: { value: "Systems Sprint" } });
    fireEvent.change(screen.getByLabelText("Select due date"), { target: { value: "2099-03-30T12:00" } });
    fireEvent.click(screen.getByText("select-user"));
    fireEvent.click(screen.getByText("trim-tags"));
    fireEvent.click(screen.getAllByText("+ Create project")[1]);

    await waitFor(() =>
      expect(createGroupProject).toHaveBeenCalledWith({
        name: "Systems Sprint",
        deadline: "2099-03-30T12:00",
        member_ids: [],
      }),
    );
    expect(onCreated).toHaveBeenCalledWith({ id: 9, name: "Systems Sprint" });
  });

  it("closes and resets CreateProjectForm when cancel is pressed", () => {
    render(<CreateProjectForm onCreated={vi.fn()} />);
    fireEvent.click(screen.getByText("+ Create project"));
    fireEvent.click(screen.getByText("close-modal"));
    fireEvent.click(screen.getByText("+ Create project"));
    expect(screen.getByText("Create project")).toBeInTheDocument();
  });
});

describe("useCreateProjectForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates required fields on submission", async () => {
    const { result } = renderHook(() => useCreateProjectForm(vi.fn()));
    await act(async () => { await result.current.submit({ preventDefault: vi.fn() }); });
    expect(result.current.errorMessage).toBe("Please fix the highlighted fields.");
    expect(result.current.errors.name).toBe("Project name is required.");
  });

  it("handles project member addition and removal", () => {
    const { result } = renderHook(() => useCreateProjectForm(vi.fn()));
    act(() => {
      result.current.addMember({ id: 10, username: "alex" });
      result.current.addMember({ id: 10, username: "alex" }); // Deduplicate
      result.current.removeMember(10);
    });
    expect(result.current.form.members).toEqual([]);
  });

  it("ignores members without an id", () => {
    const { result } = renderHook(() => useCreateProjectForm(vi.fn()));
    act(() => {
      result.current.addMember({ username: "missing-id" });
    });
    expect(result.current.form.members).toEqual([]);
  });

  it("submits the form successfully and resets state", async () => {
    const onCreated = vi.fn();
    createGroupProject.mockResolvedValue({ id: 4, name: "Capstone" });
    const { result } = renderHook(() => useCreateProjectForm(onCreated));

    act(() => {
      result.current.change("name", "Capstone");
      result.current.change("course_code", " 5CCS2SEG ");
      result.current.change("deadline", "2099-04-01T12:00:00.000Z");
      result.current.addMember({ id: 7, username: "alex" });
    });
    await act(async () => { await result.current.submit({ preventDefault: vi.fn() }); });

    expect(createGroupProject).toHaveBeenCalledWith(expect.objectContaining({ name: "Capstone", course_code: "5CCS2SEG", member_ids: [7] }));
    expect(onCreated).toHaveBeenCalled();
    expect(result.current.form.name).toBe("");
  });

  it("rejects past deadlines and shows a fallback error when creation fails", async () => {
    createGroupProject.mockRejectedValueOnce(new Error("API Error"));
    const { result } = renderHook(() => useCreateProjectForm());

    act(() => {
      result.current.change("name", "Past project");
      result.current.change("deadline", "2000-01-01T00:00:00.000Z");
    });
    expect(result.current.errors.deadline).toBe("Project due date can't be in the past.");

    act(() => {
      result.current.change("deadline", "2099-01-01T00:00:00.000Z");
    });

    await act(async () => {
      await result.current.submit({ preventDefault: vi.fn() });
    });
    expect(result.current.errorMessage).toBe("API Error");
  });

  it("accepts today's date as a valid deadline", async () => {
    const { result } = renderHook(() => useCreateProjectForm());
    const todayStr = new Date().toISOString().split("T")[0];
    
    act(() => {
      result.current.change("deadline", todayStr);
    });
    
    expect(result.current.errors.deadline).toBe("");
  });
});
