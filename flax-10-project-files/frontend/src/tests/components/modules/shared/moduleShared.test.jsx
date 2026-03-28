import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import {
  ModuleItemCardActions,
  ModuleItemDeleteDialog,
} from "../../../../components/modules/shared/moduleCardActions";
import {
  ModuleFormField,
  ModuleFormActions,
  finishValidation,
  requireFieldValue,
  buildValidationState,
  failValidation,
} from "../../../../components/modules/shared/moduleFormParts";
import {
  AddReadingToTasksButton,
  AddDeadlineToTasksButton,
} from "../../../../components/modules/shared/taskButtons";
import {
  WidgetHeader,
  ShowMoreButton,
} from "../../../../components/modules/shared/widgetParts";
import {
  expandBodyVariants,
  listVariants,
  itemVariants,
  containerVariants,
} from "../../../../components/modules/shared/widgetVariants";

const convertReadingToTaskMock = vi.fn();
const createTaskMock = vi.fn();
const getUrgencyTierMock = vi.fn(() => "upcoming");
let toastImpl = vi.fn();

vi.mock("../../../../api/readingApi", () => ({
  convertReadingToTask: (...args) => convertReadingToTaskMock(...args),
}));

vi.mock("../../../../api/taskApi", () => ({
  createTask: (...args) => createTaskMock(...args),
}));

vi.mock("../../../../components/modules/deadlines/upcomingDeadlinesUtils", () => ({
  getUrgencyTier: (...args) => getUrgencyTierMock(...args),
}));

vi.mock("../../../../context/ToastContext", () => ({
  useToast: () => toastImpl,
}));

vi.mock("../../../../components/common/confirm_modal/ConfirmModal", () => ({
  default: ({ title, message, onConfirm, onCancel, confirmText }) => (
    <div>
      <div>{title}</div>
      <div>{message}</div>
      <button onClick={onConfirm}>{confirmText}</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock("../../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, onClick, disabled, className }) => (
    <button onClick={onClick} data-disabled={disabled} className={className}>{children}</button>
  ),
}));

vi.mock("framer-motion", () => ({
  motion: {
    button: ({ children, whileHover: _whileHover, whileTap: _whileTap, ...props }) => <button {...props}>{children}</button>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
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

const baseDeadline = {
  id: 55,
  assessment_title: "Essay",
  start_due_date: "2099-01-01",
  module: 7,
  module_code: "CS1",
  module_name: "CompSci",
};

const renderCardActions = () => {
  const callbacks = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };
  render(
    <>
      <ModuleItemCardActions onEdit={callbacks.onEdit} onDelete={callbacks.onDelete} styles={styles} />
      <ModuleItemDeleteDialog
        itemTitle="Report"
        itemType="deadline"
        onConfirm={callbacks.onConfirm}
        onCancel={callbacks.onCancel}
      />
    </>,
  );
  return callbacks;
};

const renderFormParts = () => {
  const setError = vi.fn();
  render(
    <>
      <ModuleFormField label="Title" styles={styles}>
        <input aria-label="Title field" />
      </ModuleFormField>
      <ModuleFormActions onCancel={vi.fn()} isEditing={false} createLabel="Create" styles={styles} />
      <ModuleFormActions onCancel={vi.fn()} isEditing styles={styles} createLabel="Create" />
    </>,
  );
  return setError;
};

const renderWidgetParts = () => {
  const onToggle = vi.fn();
  render(
    <>
      <WidgetHeader icon={() => <svg aria-hidden="true" />} title="Deadlines" count={3} styles={styles} />
      <ShowMoreButton expanded={false} hiddenCount={4} onToggle={onToggle} styles={styles} />
      <ShowMoreButton expanded hiddenCount={0} onToggle={onToggle} styles={styles} />
    </>,
  );
  return onToggle;
};

const renderReadingButton = (props = {}) => {
  const onAdded = props.onAdded ?? vi.fn();
  render(<AddReadingToTasksButton readingId={props.readingId ?? 44} onAdded={onAdded} styles={styles} {...props} />);
  return { onAdded };
};

const renderDeadlineButton = (deadline = baseDeadline, props = {}) => {
  const onAdded = props.onAdded ?? vi.fn();
  render(
    <AddDeadlineToTasksButton deadline={deadline} onAdded={onAdded} styles={styles} {...props} />,
  );
  return { onAdded };
};

describe("module shared helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toastImpl = vi.fn();
    getUrgencyTierMock.mockReset();
    getUrgencyTierMock.mockReturnValue("upcoming");
  });

  describe("card actions", () => {
    it("triggers edit and delete handlers", () => {
      const { onEdit, onDelete } = renderCardActions();
      fireEvent.click(screen.getByText("Edit"));
      fireEvent.click(screen.getAllByText("Delete")[0]);
      expect(onEdit).toHaveBeenCalledOnce();
      expect(onDelete).toHaveBeenCalledOnce();
    });

    it("confirms or cancels delete dialog", () => {
      const { onConfirm, onCancel } = renderCardActions();
      fireEvent.click(screen.getAllByText("Delete")[0]);
      fireEvent.click(screen.getAllByText("Delete")[1]);
      fireEvent.click(screen.getByText("Cancel"));
      expect(onConfirm).toHaveBeenCalledOnce();
      expect(onCancel).toHaveBeenCalledOnce();
    });
  });

  describe("form helpers", () => {
    it("shows labels and action variants", () => {
      renderFormParts();
      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText("Create")).toBeInTheDocument();
      expect(screen.getByText("Update")).toBeInTheDocument();
    });

    it("runs validation utilities", () => {
      const setError = renderFormParts();
      expect(finishValidation(setError)).toBe(true);
      expect(requireFieldValue("value", "Missing", setError)).toBe(true);
      expect(requireFieldValue("", "Missing", setError)).toBe(false);
      expect(buildValidationState("oops", vi.fn())).toEqual({ error: "oops", validate: expect.any(Function) });
      expect(failValidation(setError, "Bad")).toBe(false);
    });
  });

  describe("widget helpers", () => {
    it("toggles the show more button", () => {
      const onToggle = renderWidgetParts();
      fireEvent.click(screen.getByText("+ 4 more"));
      fireEvent.click(screen.getByText("Show less"));
      expect(onToggle).toHaveBeenCalledTimes(2);
    });

    it("exposes animation variants", () => {
      renderWidgetParts();
      expect(expandBodyVariants.expanded.height).toBe("auto");
      expect(listVariants.visible.transition.staggerChildren).toBe(0.06);
      expect(itemVariants.hidden.y).toBe(8);
      expect(containerVariants.visible.opacity).toBe(1);
    });

    it("hides empty counts", () => {
      render(<WidgetHeader icon={() => <svg aria-hidden="true" />} title="No Count" count={0} styles={styles} />);
      expect(screen.queryByText("0")).not.toBeInTheDocument();
    });
  });

  describe("task buttons", () => {
    it("adds readings to tasks and shows success toast", async () => {
      convertReadingToTaskMock.mockResolvedValueOnce({});
      const { onAdded } = renderReadingButton();
      fireEvent.click(screen.getByText("+ Add to tasks"));
      expect(await screen.findByText("✓ Added")).toBeInTheDocument();
      expect(onAdded).toHaveBeenCalledWith(44);
      expect(toastImpl).toHaveBeenCalledWith("Reading added to tasks!");
    });

    it("shows toast when deadline creation fails", async () => {
      createTaskMock.mockRejectedValueOnce(new Error("nope"));
      renderDeadlineButton();
      fireEvent.click(screen.getByText("+ Add to tasks"));
      await waitFor(() => expect(createTaskMock).toHaveBeenCalled());
      await waitFor(() =>
        expect(toastImpl).toHaveBeenCalledWith("Failed to add deadline.", { variant: "error" }),
      );
    });

    it("guards repeated clicks while reading is adding", async () => {
      let release;
      convertReadingToTaskMock.mockImplementationOnce(() => new Promise((resolve) => {
        release = resolve;
      }));
      renderReadingButton({ readingId: 88 });
      fireEvent.click(screen.getByText("+ Add to tasks"));
      expect(screen.getByText("Adding…")).toBeInTheDocument();
      fireEvent.click(screen.getByText("Adding…"));
      expect(screen.getByText("Adding…")).toBeInTheDocument();
      release({});
      expect(await screen.findByText("✓ Added")).toBeInTheDocument();
    });

    it("adds deadlines with fallback metadata and success toast", async () => {
      createTaskMock.mockResolvedValueOnce({});
      const deadline = { id: 99, title: "", assessment_title: "", module_code: "", start_due_date: "2099-01-02" };
      const { onAdded } = renderDeadlineButton(deadline);
      fireEvent.click(screen.getByText("+ Add to tasks"));
      await waitFor(() =>
        expect(createTaskMock).toHaveBeenCalledWith(expect.objectContaining({
          title: "Assignment",
          priority: "low",
          due_date: "2099-01-02",
          module: null,
          module_code: null,
          module_name: null,
        })),
      );
      await waitFor(() => expect(onAdded).toHaveBeenCalledWith(99));
      await waitFor(() => expect(toastImpl).toHaveBeenCalledWith("Deadline added to tasks!"));
    });

    it("maps urgent deadlines to medium-priority tasks", async () => {
      getUrgencyTierMock.mockReturnValueOnce("urgent");
      createTaskMock.mockResolvedValueOnce({});
      renderDeadlineButton({ id: 12, title: "Quiz prep", start_due_date: "2099-01-03", module: 4, module_code: "CS4", module_name: "Systems" });
      fireEvent.click(screen.getByText("+ Add to tasks"));
      await waitFor(() =>
        expect(createTaskMock).toHaveBeenCalledWith(expect.objectContaining({
          title: "Quiz prep", priority: "medium", due_date: "2099-01-03", module: 4, module_code: "CS4", module_name: "Systems",
        })),
      );
    });

    it("maps critical deadlines to high-priority tasks and prefers assessment titles", async () => {
      getUrgencyTierMock.mockReturnValueOnce("critical");
      createTaskMock.mockResolvedValueOnce({});

      renderDeadlineButton({
        id: 21,
        title: "Fallback title",
        assessment_title: "Capstone demo",
        start_due_date: "2099-01-04",
      });

      fireEvent.click(screen.getByText("+ Add to tasks"));

      await waitFor(() =>
        expect(createTaskMock).toHaveBeenCalledWith(expect.objectContaining({
          title: "Capstone demo",
          priority: "high",
        })),
      );
    });

    it("falls back to an upcoming task with no due date when the deadline has no start date", async () => {
      createTaskMock.mockResolvedValueOnce({});

      renderDeadlineButton({
        id: 33,
        title: "Plan revision",
        start_due_date: "",
      });

      fireEvent.click(screen.getByText("+ Add to tasks"));

      await waitFor(() =>
        expect(createTaskMock).toHaveBeenCalledWith(expect.objectContaining({
          priority: "low",
          due_date: null,
        })),
      );
      expect(getUrgencyTierMock).not.toHaveBeenCalled();
    });

    it("ignores duplicate loading clicks for deadlines", async () => {
      let release;
      createTaskMock.mockImplementationOnce(() => new Promise((resolve) => {
        release = resolve;
      }));

      renderDeadlineButton();
      fireEvent.click(screen.getByText("+ Add to tasks"));
      fireEvent.click(screen.getByText("Adding…"));

      expect(createTaskMock).toHaveBeenCalledTimes(1);

      release({});
      expect(await screen.findByText("✓ Added")).toBeInTheDocument();
    });

    it("handles missing toast and added callbacks safely", async () => {
      toastImpl = undefined;
      convertReadingToTaskMock.mockResolvedValueOnce({});

      render(<AddReadingToTasksButton readingId={77} styles={styles} />);
      fireEvent.click(screen.getByText("+ Add to tasks"));

      expect(await screen.findByText("✓ Added")).toBeInTheDocument();
    });
  });
});
