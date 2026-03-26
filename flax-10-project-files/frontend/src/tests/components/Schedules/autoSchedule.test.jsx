import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ScheduleAutoForm, ScheduleManualForm } from "../../../components/Schedules/ScheduleForms";
import { AutoScheduleForm } from "../../../components/Schedules/auto/AutoScheduleForm";

const submitAutoSchedule = vi.fn();
const useUpcomingDeadlines = vi.fn();

vi.mock("../../../components/Schedules/auto/submitAutoSchedule", () => ({
  submitAutoSchedule: (...args) => submitAutoSchedule(...args),
}));

vi.mock("../../../components/Schedules/auto/useUpcomingDeadlines", () => ({
  useUpcomingDeadlines: (...args) => useUpcomingDeadlines(...args),
}));

vi.mock("../../../components/Schedules/auto/AutoScheduleSummary", () => ({
  AutoScheduleSummary: ({ deadlines }) => <div>Summary count: {deadlines.length}</div>,
}));

vi.mock("../../../components/Schedules/manual/ManualScheduleForm", () => ({
  ManualScheduleForm: ({ onDone }) => <button onClick={onDone}>manual-proxy</button>,
}));

describe("Auto schedule form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUpcomingDeadlines.mockReturnValue({
      deadlines: [{ id: 1 }, { id: 2 }],
      showToast: vi.fn(),
    });
  });

  it("re-exports the manual and auto schedule entry points", () => {
    const onDone = vi.fn();
    render(
      <>
        <ScheduleManualForm onDone={onDone} />
        <ScheduleAutoForm onDone={onDone} />
      </>,
    );

    fireEvent.click(screen.getByText("manual-proxy"));
    expect(onDone).toHaveBeenCalled();
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
