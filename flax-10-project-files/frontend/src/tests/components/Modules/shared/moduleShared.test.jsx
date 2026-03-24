import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import {
  ModuleItemCardActions,
  ModuleItemDeleteDialog,
} from "../../../../components/Modules/shared/moduleCardActions";
import {
  ModuleFormField,
  ModuleFormActions,
  finishValidation,
  requireFieldValue,
  buildValidationState,
  failValidation,
} from "../../../../components/Modules/shared/moduleFormParts";
import {
  AddReadingToTasksButton,
  AddDeadlineToTasksButton,
} from "../../../../components/Modules/shared/taskButtons";
import {
  WidgetHeader,
  ShowMoreButton,
} from "../../../../components/Modules/shared/widgetParts";
import {
  expandBodyVariants,
  listVariants,
  itemVariants,
  containerVariants,
} from "../../../../components/Modules/shared/widgetVariants";

const convertReadingToTaskMock = vi.fn();
const createTaskMock = vi.fn();
const useToastMock = vi.fn();

vi.mock("../../../../api/readingApi", () => ({
  convertReadingToTask: (...args) => convertReadingToTaskMock(...args),
}));

vi.mock("../../../../api/taskApi", () => ({
  createTask: (...args) => createTaskMock(...args),
}));

vi.mock("../../../../context/ToastContext", () => ({
  useToast: () => useToastMock,
}));

vi.mock("../../../../components/common/ConfirmModal/ConfirmModal", () => ({
  default: ({ title, message, onConfirm, onCancel, confirmText }) => (
    <div>
      <div>{title}</div>
      <div>{message}</div>
      <button onClick={onConfirm}>{confirmText}</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock("../../../../components/common/PrimaryButton/PrimaryButton", () => ({
  default: ({ children, onClick, disabled, className }) => (
    <button onClick={onClick} disabled={disabled} className={className}>{children}</button>
  ),
}));

vi.mock("framer-motion", () => ({
  motion: {
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
}));

vi.mock("lucide-react", () => ({
  ChevronDown: () => <svg aria-hidden="true" />,
  ChevronUp: () => <svg aria-hidden="true" />,
}));

const styles = {
  cardActions: "cardActions",
  editButton: "editButton",
  deleteButton: "deleteButton",
  field: "field",
  label: "label",
  actions: "actions",
  cancelButton: "cancelButton",
  submitButton: "submitButton",
  addedLabel: "addedLabel",
  widgetHeader: "widgetHeader",
  widgetIconWrap: "widgetIconWrap",
  widgetTitle: "widgetTitle",
  widgetCount: "widgetCount",
  showMoreBtn: "showMoreBtn",
};

describe("module shared helpers", () => {
  it("renders module action buttons and delete dialog", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <>
        <ModuleItemCardActions onEdit={onEdit} onDelete={onDelete} styles={styles} />
        <ModuleItemDeleteDialog itemTitle="Report" itemType="deadline" onConfirm={onConfirm} onCancel={onCancel} />
      </>
    );

    fireEvent.click(screen.getByText("Edit"));
    fireEvent.click(screen.getAllByText("Delete")[0]);
    fireEvent.click(screen.getAllByText("Delete")[1]);
    fireEvent.click(screen.getByText("Cancel"));

    expect(onEdit).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("renders module form parts and validation helpers", () => {
    const setError = vi.fn();
    render(
      <>
        <ModuleFormField label="Title" styles={styles}><input aria-label="Title field" /></ModuleFormField>
        <ModuleFormActions onCancel={vi.fn()} isEditing={false} createLabel="Create" styles={styles} />
        <ModuleFormActions onCancel={vi.fn()} isEditing={true} createLabel="Create" styles={styles} />
      </>
    );

    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Create")).toBeInTheDocument();
    expect(screen.getByText("Update")).toBeInTheDocument();
    expect(finishValidation(setError)).toBe(true);
    expect(requireFieldValue("value", "Missing", setError)).toBe(true);
    expect(requireFieldValue("", "Missing", setError)).toBe(false);
    expect(buildValidationState("oops", vi.fn())).toEqual({ error: "oops", validate: expect.any(Function) });
    expect(failValidation(setError, "Bad")).toBe(false);
  });

  it("renders widget helpers and exported animation variants", () => {
    const onToggle = vi.fn();
    render(
      <>
        <WidgetHeader icon={() => <svg aria-hidden="true" />} title="Deadlines" count={3} styles={styles} />
        <ShowMoreButton expanded={false} hiddenCount={4} onToggle={onToggle} styles={styles} />
        <ShowMoreButton expanded={true} hiddenCount={0} onToggle={onToggle} styles={styles} />
      </>
    );

    expect(screen.getByText("Deadlines")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    fireEvent.click(screen.getByText("+ 4 more"));
    fireEvent.click(screen.getByText("Show less"));
    expect(onToggle).toHaveBeenCalledTimes(2);
    expect(expandBodyVariants.expanded.height).toBe("auto");
    expect(listVariants.visible.transition.staggerChildren).toBe(0.06);
    expect(itemVariants.hidden.y).toBe(8);
    expect(containerVariants.visible.opacity).toBe(1);
  });

  it("adds readings and deadlines to tasks across success and failure flows", async () => {
    convertReadingToTaskMock.mockResolvedValueOnce({});
    createTaskMock.mockRejectedValueOnce(new Error("nope"));

    render(
      <>
        <AddReadingToTasksButton readingId={44} onAdded={vi.fn()} styles={styles} />
        <AddDeadlineToTasksButton
          deadline={{ id: 55, assessment_title: "Essay", start_due_date: "2099-01-01", module: 7, module_code: "CS1", module_name: "CompSci" }}
          onAdded={vi.fn()}
          styles={styles}
        />
      </>
    );

    fireEvent.click(screen.getAllByText("+ Add to tasks")[0]);
    expect(await screen.findByText("✓ Added")).toBeInTheDocument();
    expect(convertReadingToTaskMock).toHaveBeenCalledWith(44);

    fireEvent.click(screen.getAllByText("+ Add to tasks")[0]);
    await waitFor(() => expect(createTaskMock).toHaveBeenCalledWith(expect.objectContaining({
      title: "Essay",
      priority: "low",
      module_code: "CS1",
    })));
    await waitFor(() => expect(useToastMock).toHaveBeenCalledWith("Failed to add deadline.", { variant: "error" }));
  });

  it("covers loading guards, success toasts, and fallback deadline fields", async () => {
    const readingAdded = vi.fn();
    const deadlineAdded = vi.fn();
    const stopPropagation = vi.fn();

    let releaseReading;
    convertReadingToTaskMock.mockImplementationOnce(
      () => new Promise((resolve) => {
        releaseReading = resolve;
      }),
    );
    createTaskMock.mockResolvedValueOnce({});

    render(
      <>
        <AddReadingToTasksButton readingId={88} onAdded={readingAdded} className="reading-btn" variant="ghost" styles={styles} />
        <AddDeadlineToTasksButton
          deadline={{ id: 99, title: "", assessment_title: "", module_code: "", start_due_date: "2099-01-02" }}
          onAdded={deadlineAdded}
          className="deadline-btn"
          styles={styles}
        />
        <WidgetHeader icon={() => <svg aria-hidden="true" />} title="No Count" count={0} styles={styles} />
      </>,
    );

    const addButtons = screen.getAllByText("+ Add to tasks");
    fireEvent.click(addButtons[0]);
    expect(screen.getByText("Adding…")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Adding…"));
    expect(convertReadingToTaskMock.mock.calls.length).toBeGreaterThanOrEqual(1);

    releaseReading({});
    expect(await screen.findByText("✓ Added")).toBeInTheDocument();
    expect(readingAdded).toHaveBeenCalledWith(88);
    expect(useToastMock).toHaveBeenCalledWith("Reading added to tasks!");

    fireEvent.click(screen.getAllByText("+ Add to tasks")[0]);
    await waitFor(() => expect(createTaskMock).toHaveBeenCalledWith(expect.objectContaining({
      title: "Assignment",
      priority: "low",
      due_date: "2099-01-02",
      module: null,
      module_code: null,
      module_name: null,
    })));
    await waitFor(() => expect(deadlineAdded).toHaveBeenCalledWith(99));
    await waitFor(() => expect(useToastMock).toHaveBeenCalledWith("Deadline added to tasks!"));
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});
