import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ScheduleAutoForm } from "../../../../components/schedules/components/ScheduleForms";
import { AutoScheduleForm } from "../../../../components/schedules/auto/AutoScheduleForm";

const submitAutoSchedule = vi.fn();
const useUpcomingDeadlines = vi.fn();

vi.mock("../../../../components/schedules/auto/submitAutoSchedule", () => ({
  submitAutoSchedule: (...args) => submitAutoSchedule(...args),
}));

vi.mock("../../../../components/schedules/auto/useUpcomingDeadlines", () => ({
  useUpcomingDeadlines: (...args) => useUpcomingDeadlines(...args),
}));

vi.mock("../../../../components/schedules/auto/AutoScheduleSummary", () => ({
  AutoScheduleSummary: ({ deadlines }) => <div>Summary count: {deadlines.length}</div>,
}));

describe("Auto schedule form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUpcomingDeadlines.mockReturnValue({
      deadlines: [{ id: 1 }, { id: 2 }],
      showToast: vi.fn(),
    });
  });

  it("re-exports the auto schedule entry point", () => {
    render(<ScheduleAutoForm onDone={vi.fn()} />);
    expect(screen.getByText("Generate Auto Schedule")).toBeInTheDocument();
  });

  it("submits the auto schedule with the edited title", async () => {
    const onDone = vi.fn();
    submitAutoSchedule.mockResolvedValue(undefined);

    render(<AutoScheduleForm onDone={onDone} />);
    fireEvent.change(screen.getByPlaceholderText("Auto schedule"), {
      target: { value: "Exam Week" },
    });
    fireEvent.click(screen.getByText("Generate Auto Schedule"));

    await waitFor(() =>
      expect(submitAutoSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Exam Week",
          deadlines: [{ id: 1 }, { id: 2 }],
          onDone,
        }),
      ),
    );
  });

  it("shows the fallback error message when submit fails without a message", async () => {
    const showToast = vi.fn();
    useUpcomingDeadlines.mockReturnValue({
      deadlines: [{ id: 1 }],
      showToast,
    });
    submitAutoSchedule.mockRejectedValueOnce({});

    render(<AutoScheduleForm onDone={vi.fn()} />);
    fireEvent.click(screen.getByText("Generate Auto Schedule"));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith("Unable to generate auto schedule.", { variant: "error" }),
    );
  });

  it("shows the explicit error message when submit fails with a message", async () => {
    const showToast = vi.fn();
    useUpcomingDeadlines.mockReturnValue({
      deadlines: [{ id: 1 }],
      showToast,
    });
    submitAutoSchedule.mockRejectedValueOnce(new Error("Server busy"));

    render(<AutoScheduleForm onDone={vi.fn()} />);
    fireEvent.click(screen.getByText("Generate Auto Schedule"));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith("Server busy", { variant: "error" }),
    );
  });
});
