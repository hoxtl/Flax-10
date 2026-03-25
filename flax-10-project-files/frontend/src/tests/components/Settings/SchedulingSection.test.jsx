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

  it("preserves study input when the save response is empty and falls back to the default value for invalid input", async () => {
    const onStudyTimeSave = vi.fn().mockResolvedValue(null);
    const { result } = renderHook(() => useSchedulingState({
      onStudyTimeSave,
      onWeekPreferenceSave: vi.fn(),
      onWorktimePreferenceSave: vi.fn(),
    }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.studyTimeProps.onMinutesChange("abc");
    });

    await act(async () => {
      await result.current.studyTimeProps.onSubmit({ preventDefault: vi.fn() });
    });

    expect(onStudyTimeSave).toHaveBeenCalledWith({ preferred_study_minutes_per_day: 120 });
    expect(result.current.studyTimeProps.minutesPerDay).toBe("abc");
    expect(result.current.studyTimeProps.hasUnsaved).toBe(true);
  });

  it("updates and saves week preferences", async () => {
    const onWeekSave = vi.fn().mockResolvedValue(null);
    const { result } = renderHook(() => useSchedulingState({ onStudyTimeSave: vi.fn(), onWeekPreferenceSave: onWeekSave, onWorktimePreferenceSave: vi.fn() }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => { result.current.weekPreferenceProps.onWeekPreferenceChange("weekends"); });
    await act(async () => { await result.current.weekPreferenceProps.onSubmit({ preventDefault: vi.fn() }); });
    expect(onWeekSave).toHaveBeenCalledWith({ week_preference: "weekends" });
    expect(result.current.weekPreferenceProps.weekPreference).toBe("weekends");
  });

  it("updates and saves worktime preferences", async () => {
    const onWorktimeSave = vi.fn().mockResolvedValue({ worktime_preference: "" });
    const { result } = renderHook(() => useSchedulingState({ onStudyTimeSave: vi.fn(), onWeekPreferenceSave: vi.fn(), onWorktimePreferenceSave: onWorktimeSave }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => { result.current.worktimeProps.onWorktimePreferenceChange("day"); });
    await act(async () => { await result.current.worktimeProps.onSubmit({ preventDefault: vi.fn() }); });
    expect(onWorktimeSave).toHaveBeenCalledWith({ worktime_preference: "day" });
    expect(result.current.worktimeProps.worktimePreference).toBe("day");
  });

  it("bumps the week save signal when the API returns a saved preference", async () => {
    const onWeekPreferenceSave = vi.fn().mockResolvedValue({ week_preference: "weekends" });
    const { result } = renderHook(() => useSchedulingState({
      onStudyTimeSave: vi.fn(),
      onWeekPreferenceSave,
      onWorktimePreferenceSave: vi.fn(),
    }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.weekPreferenceProps.onWeekPreferenceChange("weekends");
    });

    await act(async () => {
      await result.current.weekPreferenceProps.onSubmit({ preventDefault: vi.fn() });
    });

    expect(onWeekPreferenceSave).toHaveBeenCalledWith({ week_preference: "weekends" });
    expect(result.current.weekPreferenceProps.weekPreference).toBe("weekends");
    expect(result.current.weekPreferenceProps.saveSignal).toBe(1);
    expect(result.current.weekPreferenceProps.hasUnsaved).toBe(false);
  });
});

describe("SchedulingSection components", () => {
  const sectionProps = {
    isSaving: false,
    hasUnsaved: true,
    saveSignal: 1,
    onSubmit: vi.fn((event) => event.preventDefault()),
  };

  const renderSchedulingPanel = () => {
    const handlers = {
      onMinutesChange: vi.fn(),
      onWeekPreferenceChange: vi.fn(),
      onWorktimePreferenceChange: vi.fn(),
      onStudySubmit: vi.fn((event) => event.preventDefault()),
      onWeekSubmit: vi.fn((event) => event.preventDefault()),
      onWorktimeSubmit: vi.fn((event) => event.preventDefault()),
    };

    render(
      <SchedulingPanel
        studyTimeProps={{
          minutesPerDay: "120",
          onMinutesChange: handlers.onMinutesChange,
          onSubmit: handlers.onStudySubmit,
          isSaving: false,
          hasUnsaved: true,
          saveSignal: 0,
        }}
        weekPreferenceProps={{
          weekPreference: "both",
          onWeekPreferenceChange: handlers.onWeekPreferenceChange,
          onSubmit: handlers.onWeekSubmit,
          isSaving: false,
          hasUnsaved: true,
          saveSignal: 0,
        }}
        worktimeProps={{
          worktimePreference: "night",
          onWorktimePreferenceChange: handlers.onWorktimePreferenceChange,
          onSubmit: handlers.onWorktimeSubmit,
          isSaving: false,
          hasUnsaved: true,
          saveSignal: 0,
        }}
      />,
    );

    return handlers;
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

  it("renders the compact scheduling panel and exposes change handlers", () => {
    const handlers = renderSchedulingPanel();
    fireEvent.change(screen.getByTestId("Choose a target"), { target: { value: "150" } });
    fireEvent.change(screen.getByTestId("Choose days"), { target: { value: "weekdays" } });
    fireEvent.change(screen.getByTestId("Choose a time"), { target: { value: "day" } });
    expect(handlers.onMinutesChange).toHaveBeenCalledWith("150");
    expect(handlers.onWeekPreferenceChange).toHaveBeenCalledWith("weekdays");
    expect(handlers.onWorktimePreferenceChange).toHaveBeenCalledWith("day");
    expect(screen.getByText("Scheduling setup")).toBeInTheDocument();
  });

  it("submits each scheduling form via save buttons", async () => {
    const handlers = renderSchedulingPanel();
    fireEvent.click(screen.getByRole("button", { name: "Save target" }));
    fireEvent.click(screen.getByRole("button", { name: "Save days" }));
    fireEvent.click(screen.getByRole("button", { name: "Save study time" }));
    await waitFor(() => {
      expect(handlers.onStudySubmit).toHaveBeenCalled();
      expect(handlers.onWeekSubmit).toHaveBeenCalled();
      expect(handlers.onWorktimeSubmit).toHaveBeenCalled();
    });
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
