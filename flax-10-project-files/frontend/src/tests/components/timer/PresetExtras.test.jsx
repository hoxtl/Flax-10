import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const {
  mockApplyPreset,
  mockLoadCustomPresets,
  mockLoadPresetUsage,
  mockSaveCustomPresets,
  mockSavePresetUsage,
} = vi.hoisted(() => ({
  mockApplyPreset: vi.fn(),
  mockLoadCustomPresets: vi.fn(() => []),
  mockLoadPresetUsage: vi.fn(() => ({})),
  mockSaveCustomPresets: vi.fn(),
  mockSavePresetUsage: vi.fn(),
}));

import { AutoStartToggle } from "../../../components/Timer/presets/AutoStartToggle";
import { PresetPanel, TimerConfigPanel } from "../../../components/Timer/PresetPanel";
import { PresetCard } from "../../../components/Timer/presets/PresetCard";
import { PresetSaveArea } from "../../../components/Timer/presets/PresetSaveArea";
import { ProgressBar } from "../../../components/Timer/todayBanner/ProgressBar";
import {
  extractTime,
  fmtDuration,
  formatHoursAsClock,
  formatSessionMinutes,
  isToday,
  taskDueText,
} from "../../../components/Timer/utils/timerFormatters";

vi.mock("../../../components/Timer/utils/presetUtils", () => ({
  AUTOSTART_KEY: "timer.autostart",
  BUILT_IN_PRESETS: [{ id: "pomodoro", label: "Pomodoro", work: 25, brk: 5, sessions: 4 }],
  applyPreset: (...args) => mockApplyPreset(...args),
  getPresetDurationTag: vi.fn(() => "25m"),
  getPresetIcon: vi.fn(() => "🔥"),
  isPresetActive: vi.fn(() => true),
  loadCustomPresets: (...args) => mockLoadCustomPresets(...args),
  loadPresetUsage: (...args) => mockLoadPresetUsage(...args),
  saveCustomPresets: (...args) => mockSaveCustomPresets(...args),
  savePresetUsage: (...args) => mockSavePresetUsage(...args),
}));

describe("Preset extras", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockLoadCustomPresets.mockReturnValue([]);
    mockLoadPresetUsage.mockReturnValue({});
  });

  it("persists and restores the auto-start toggle", () => {
    render(<AutoStartToggle />);
    const checkbox = screen.getByRole("checkbox");

    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(localStorage.getItem("timer.autostart")).toBe("true");

    render(<AutoStartToggle />);
    expect(screen.getAllByRole("checkbox")[1]).toBeChecked();
  });

  it("renders preset card states, apply, delete, and context menu behavior", () => {
    const onApply = vi.fn();
    const onDelete = vi.fn();

    render(
      <PresetCard
        preset={{ label: "Sprint", work: 25, brk: 5, sessions: 4 }}
        t={{ isActive: false }}
        onApply={onApply}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /sprint/i }));
    expect(onApply).toHaveBeenCalledWith({ label: "Sprint", work: 25, brk: 5, sessions: 4 });

    fireEvent.click(screen.getByLabelText("Delete preset"));
    expect(onDelete).toHaveBeenCalledTimes(1);

    fireEvent.contextMenu(screen.getByText("Sprint").closest("div"));
    expect(screen.getByText(/delete preset/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText("🗑 Delete preset"));
    expect(onDelete).toHaveBeenCalledTimes(2);

    fireEvent.contextMenu(screen.getByText("Sprint").closest("div"));
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("🗑 Delete preset")).not.toBeInTheDocument();
  });

  it("disables preset apply while the timer is active and ignores context menu without delete handler", () => {
    const onApply = vi.fn();
    render(
      <PresetCard
        preset={{ label: "Focus", work: 50, brk: 10, sessions: 2 }}
        t={{ isActive: true }}
        onApply={onApply}
      />,
    );

    const button = screen.getByRole("button", { name: /focus/i });
    expect(button).toBeDisabled();
    fireEvent.contextMenu(button.closest("div"));
    expect(screen.queryByText("🗑 Delete preset")).not.toBeInTheDocument();
  });

  it("renders save area button and keyboard shortcuts", () => {
    const setSaving = vi.fn();
    const setSaveName = vi.fn();
    const onSave = vi.fn();
    const { rerender } = render(
      <PresetSaveArea
        saving={false}
        saveName=""
        setSaveName={setSaveName}
        setSaving={setSaving}
        disabled={false}
        onSave={onSave}
      />,
    );

    fireEvent.click(screen.getByText("+ Save current"));
    expect(setSaving).toHaveBeenCalledWith(true);

    rerender(
      <PresetSaveArea
        saving
        saveName="Deep Work"
        setSaveName={setSaveName}
        setSaving={setSaving}
        disabled={false}
        onSave={onSave}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Preset name…"), { target: { value: "Exam" } });
    expect(setSaveName).toHaveBeenCalledWith("Exam");
    fireEvent.keyDown(screen.getByPlaceholderText("Preset name…"), { key: "Enter" });
    expect(onSave).toHaveBeenCalled();
    fireEvent.keyDown(screen.getByPlaceholderText("Preset name…"), { key: "Escape" });
    expect(setSaving).toHaveBeenCalledWith(false);
  });

  it("renders preset panel save/apply/delete flows and embedded config quick actions", () => {
    mockLoadCustomPresets.mockReturnValue([{ id: "custom_1", label: "Deep", work: 40, brk: 8, sessions: 3 }]);
    mockLoadPresetUsage.mockReturnValue({ pomodoro: 1 });
    const t = {
      isActive: false,
      isPaused: false,
      workTime: 35,
      breakTime: 7,
      targetSessions: 2,
      updateTime: vi.fn(),
      setTimeLeft: vi.fn(),
    };

    const { container, rerender } = render(<PresetPanel t={t} />);
    expect(container.firstChild).toHaveClass(/presetPanelCard/);

    fireEvent.click(screen.getByRole("button", { name: /pomodoro/i }));
    expect(mockApplyPreset).toHaveBeenCalledWith(
      expect.objectContaining({ id: "pomodoro" }),
      t,
    );
    expect(mockSavePresetUsage).toHaveBeenCalledWith({ pomodoro: 2 });
    fireEvent.click(screen.getByRole("button", { name: /deep/i }));
    expect(mockSavePresetUsage).toHaveBeenCalledWith({ pomodoro: 1, custom_1: 1 });

    fireEvent.click(screen.getAllByLabelText("Delete preset")[0]);
    expect(mockSaveCustomPresets).toHaveBeenCalledWith([]);

    fireEvent.click(screen.getByText("+ Save current"));
    fireEvent.change(screen.getByPlaceholderText("Preset name…"), { target: { value: "  Exam Mode  " } });
    fireEvent.keyDown(screen.getByPlaceholderText("Preset name…"), { key: "Enter" });
    expect(mockSaveCustomPresets).toHaveBeenLastCalledWith([
      expect.objectContaining({
        label: "Exam Mode",
        work: 35,
        brk: 7,
        sessions: 2,
      }),
    ]);
    fireEvent.click(screen.getByText("+ Save current"));
    fireEvent.keyDown(screen.getByPlaceholderText("Preset name…"), { key: "Enter" });
    expect(mockSaveCustomPresets).toHaveBeenCalledTimes(2);

    rerender(<TimerConfigPanel t={t} embedded />);
    expect(container.querySelector('[class*="presetPanelCard"]')).toBeNull();
    fireEvent.click(screen.getByText("-5m"));
    fireEvent.click(screen.getByText("25m"));
    fireEvent.click(screen.getByText("50m"));
    fireEvent.click(screen.getByText("90m"));
    fireEvent.click(screen.getByText("+5m"));
    expect(t.updateTime).toHaveBeenCalledWith("work", 30);
    expect(t.updateTime).toHaveBeenCalledWith("work", 25);
    expect(t.updateTime).toHaveBeenCalledWith("work", 50);
    expect(t.updateTime).toHaveBeenCalledWith("work", 90);
    expect(t.updateTime).toHaveBeenCalledWith("work", 40);
    expect(t.setTimeLeft).toHaveBeenCalledWith(30 * 60);
    expect(t.setTimeLeft).toHaveBeenCalledWith(25 * 60);
    expect(t.setTimeLeft).toHaveBeenCalledWith(50 * 60);
    expect(t.setTimeLeft).toHaveBeenCalledWith(90 * 60);
    expect(t.setTimeLeft).toHaveBeenCalledWith(40 * 60);

    rerender(<TimerConfigPanel t={{ ...t, isActive: true, isPaused: false }} />);
    expect(screen.getByText("-5m")).toBeDisabled();
    expect(screen.getByText("25m")).toBeDisabled();
    expect(screen.getByText("50m")).toBeDisabled();
    expect(screen.getByText("90m")).toBeDisabled();
    expect(screen.getByText("+5m")).toBeDisabled();

    const minClamp = { ...t, isActive: false, isPaused: false, workTime: 5 };
    rerender(<TimerConfigPanel t={minClamp} />);
    fireEvent.click(screen.getByText("-5m"));
    expect(minClamp.updateTime).toHaveBeenCalledWith("work", 5);
    expect(minClamp.setTimeLeft).toHaveBeenCalledWith(5 * 60);
  });

  it("renders progress bar ticks and live pulse only while studying below the goal", () => {
    const { container, rerender } = render(
      <ProgressBar
        sessions={1}
        goalSessions={4}
        sessionPct={25}
        fillAnimating
        isStudying
        activePulseLeft={40}
        tickCount={4}
      />,
    );

    expect(container.querySelectorAll("span").length).toBeGreaterThan(4);

    rerender(
      <ProgressBar
        sessions={4}
        goalSessions={4}
        sessionPct={100}
        fillAnimating={false}
        isStudying={false}
        activePulseLeft={100}
        tickCount={1}
      />,
    );
    expect(container.querySelectorAll("span").length).toBeGreaterThan(1);
  });
});

describe("timer formatters", () => {
  it("formats durations and session values", () => {
    expect(fmtDuration(0)).toBe("0m");
    expect(fmtDuration(3900)).toBe("1h 5m");
    expect(fmtDuration(3600)).toBe("1h");
    expect(fmtDuration(1800)).toBe("30m");
    expect(formatHoursAsClock(1.5)).toBe("01:30:00");
    expect(formatHoursAsClock(0)).toBe("00:00:00");
    expect(formatSessionMinutes(179)).toBe("3m");
  });

  it("builds due text for now, remaining, overdue, and invalid tasks", () => {
    const now = new Date("2026-03-24T10:00:00.000Z");
    expect(taskDueText(null, now)).toBeNull();
    expect(taskDueText({ due_date: "invalid" }, now)).toBeNull();
    expect(taskDueText({ due_date: "2026-03-24T10:03:00.000Z" }, now)).toBe("now");
    expect(taskDueText({ due_date: "2026-03-24T11:45:00.000Z" }, now)).toBe("1h 45m left");
    expect(taskDueText({ due_date: "2026-03-26T12:00:00.000Z" }, now)).toBe("2d 2h left");
    expect(taskDueText({ due_date: "2026-03-24T08:30:00.000Z" }, now)).toBe("1h 30m overdue");
    expect(taskDueText({ due_date: "2026-03-20T08:00:00.000Z" }, now)).toBe("4d 2h overdue");
  });

  it("extracts times safely and checks same-day comparisons", () => {
    expect(extractTime("not-a-date")).toBeNull();
    expect(extractTime("2026-03-24T09:00:00.000Z")).toBeInstanceOf(Date);
    expect(isToday("2099-03-24T09:00:00.000Z")).toBe(false);

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T12:00:00.000Z"));
    expect(isToday("2026-03-24T09:00:00.000Z")).toBe(true);
    vi.useRealTimers();
  });
});
