import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen, waitFor, renderHook } from "@testing-library/react";

const getUserSettings = vi.fn();

vi.mock("../../../api/userApi", () => ({
  getUserSettings: (...args) => getUserSettings(...args),
}));

vi.mock("../../../components/common/AnimatedDropdown", () => ({
  default: ({ value, onChange, options = [], placeholder }) => (
    <select
      aria-label={placeholder}
      data-testid={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

import useSchedulingState from "../../../components/Settings/scheduling/useSchedulingState";
import {
  SchedulingPanel,
  StudyTimeSection,
  WeekPreferenceSection,
  WorktimePreferenceSection,
} from "../../../components/Settings/scheduling/SchedulingSection";

describe("useSchedulingState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserSettings.mockResolvedValue({
      preferred_study_minutes_per_day: 180,
      week_preference: "weekdays",
      worktime_preference: "night",
    });
  });

  it("hydrates scheduling settings from the API", async () => {
    const { result } = renderHook(() => useSchedulingState({
      onStudyTimeSave: vi.fn(),
      onWeekPreferenceSave: vi.fn(),
      onWorktimePreferenceSave: vi.fn(),
    }));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.studyTimeProps.minutesPerDay).toBe("180");
    expect(result.current.weekPreferenceProps.weekPreference).toBe("weekdays");
    expect(result.current.worktimeProps.worktimePreference).toBe("night");
  });

  it("saves and clamps study time values", async () => {
    const onStudyTimeSave = vi.fn().mockResolvedValue({});
    const { result } = renderHook(() => useSchedulingState({
      onStudyTimeSave,
      onWeekPreferenceSave: vi.fn(),
      onWorktimePreferenceSave: vi.fn(),
    }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.studyTimeProps.onMinutesChange("999");
    });
    expect(result.current.studyTimeProps.hasUnsaved).toBe(true);

    await act(async () => {
      await result.current.studyTimeProps.onSubmit({ preventDefault: vi.fn() });
    });

    expect(onStudyTimeSave).toHaveBeenCalledWith({ preferred_study_minutes_per_day: 600 });
    expect(result.current.studyTimeProps.minutesPerDay).toBe("600");
    expect(result.current.studyTimeProps.hasUnsaved).toBe(false);
  });

  it("saves week and worktime preferences and keeps current values when APIs return nullish settings", async () => {
    const onWeekPreferenceSave = vi.fn().mockResolvedValue(null);
    const onWorktimePreferenceSave = vi.fn().mockResolvedValue({ worktime_preference: "" });
    const { result } = renderHook(() => useSchedulingState({
      onStudyTimeSave: vi.fn(),
      onWeekPreferenceSave,
      onWorktimePreferenceSave,
    }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.weekPreferenceProps.onWeekPreferenceChange("weekends");
      result.current.worktimeProps.onWorktimePreferenceChange("day");
    });

    await act(async () => {
      await result.current.weekPreferenceProps.onSubmit({ preventDefault: vi.fn() });
      await result.current.worktimeProps.onSubmit({ preventDefault: vi.fn() });
    });

    expect(onWeekPreferenceSave).toHaveBeenCalledWith({ week_preference: "weekends" });
    expect(onWorktimePreferenceSave).toHaveBeenCalledWith({ worktime_preference: "day" });
    expect(result.current.weekPreferenceProps.weekPreference).toBe("weekends");
    expect(result.current.worktimeProps.worktimePreference).toBe("day");
  });
});

describe("SchedulingSection components", () => {
  const sectionProps = {
    isSaving: false,
    hasUnsaved: true,
    saveSignal: 1,
    onSubmit: vi.fn((event) => event.preventDefault()),
  };

  it("renders each standalone section with the full layout", () => {
    render(
      <>
        <StudyTimeSection {...sectionProps} minutesPerDay="120" onMinutesChange={vi.fn()} />
        <WeekPreferenceSection {...sectionProps} weekPreference="both" onWeekPreferenceChange={vi.fn()} />
        <WorktimePreferenceSection {...sectionProps} worktimePreference="day" onWorktimePreferenceChange={vi.fn()} />
      </>,
    );

    expect(screen.getByText("Daily study target")).toBeInTheDocument();
    expect(screen.getByText("Scheduling days")).toBeInTheDocument();
    expect(screen.getByText("Study time preference")).toBeInTheDocument();
    expect(screen.getAllByText("Quick guide").length).toBeGreaterThan(0);
  });

  it("renders the compact scheduling panel and submits through each form", async () => {
    const onMinutesChange = vi.fn();
    const onWeekPreferenceChange = vi.fn();
    const onWorktimePreferenceChange = vi.fn();
    const onStudySubmit = vi.fn((event) => event.preventDefault());
    const onWeekSubmit = vi.fn((event) => event.preventDefault());
    const onWorktimeSubmit = vi.fn((event) => event.preventDefault());

    render(
      <SchedulingPanel
        studyTimeProps={{
          minutesPerDay: "120",
          onMinutesChange,
          onSubmit: onStudySubmit,
          isSaving: false,
          hasUnsaved: true,
          saveSignal: 0,
        }}
        weekPreferenceProps={{
          weekPreference: "both",
          onWeekPreferenceChange,
          onSubmit: onWeekSubmit,
          isSaving: false,
          hasUnsaved: true,
          saveSignal: 0,
        }}
        worktimeProps={{
          worktimePreference: "night",
          onWorktimePreferenceChange,
          onSubmit: onWorktimeSubmit,
          isSaving: false,
          hasUnsaved: true,
          saveSignal: 0,
        }}
      />,
    );

    fireEvent.change(screen.getByTestId("Choose a target"), { target: { value: "150" } });
    fireEvent.change(screen.getByTestId("Choose days"), { target: { value: "weekdays" } });
    fireEvent.change(screen.getByTestId("Choose a time"), { target: { value: "day" } });

    expect(onMinutesChange).toHaveBeenCalledWith("150");
    expect(onWeekPreferenceChange).toHaveBeenCalledWith("weekdays");
    expect(onWorktimePreferenceChange).toHaveBeenCalledWith("day");

    fireEvent.click(screen.getByRole("button", { name: "Save target" }));
    fireEvent.click(screen.getByRole("button", { name: "Save days" }));
    fireEvent.click(screen.getByRole("button", { name: "Save study time" }));

    await waitFor(() => {
      expect(onStudySubmit).toHaveBeenCalled();
      expect(onWeekSubmit).toHaveBeenCalled();
      expect(onWorktimeSubmit).toHaveBeenCalled();
    });

    expect(screen.getByText("Scheduling setup")).toBeInTheDocument();
  });

  it("stops loading and preserves defaults when settings are empty", async () => {
    getUserSettings.mockResolvedValueOnce({});

    const { result } = renderHook(() => useSchedulingState({
      onStudyTimeSave: vi.fn(),
      onWeekPreferenceSave: vi.fn(),
      onWorktimePreferenceSave: vi.fn(),
    }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.studyTimeProps.minutesPerDay).toBe("120");
    expect(result.current.weekPreferenceProps.weekPreference).toBe("both");
    expect(result.current.worktimeProps.worktimePreference).toBe("both");
  });
});
