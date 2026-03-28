import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const applyPresetMock = vi.fn();

vi.mock("../../../../components/timer/components/TimerComponents", () => ({
  TimerSettings: ({ breakTime, disabled, sessions, work }) => (
    <div data-testid="timer-settings">{`${work}:${breakTime}:${sessions}:${disabled}`}</div>
  ),
}));

vi.mock("../../../../components/timer/presets/PresetCard", () => ({
  PresetCard: ({ onApply, preset }) => (
    <button type="button" onClick={() => onApply(preset)}>
      {preset.label}
    </button>
  ),
}));

vi.mock("../../../../components/timer/presets/AutoStartToggle", () => ({
  AutoStartToggle: () => <div data-testid="auto-start-toggle">Auto-start</div>,
}));

vi.mock("../../../../components/timer/utils/presetUtils", async () => {
  const actual = await vi.importActual("../../../../components/Timer/utils/presetUtils");
  return {
    ...actual,
    applyPreset: (...args) => applyPresetMock(...args),
  };
});

import { PresetPanel, TimerConfigPanel } from "../../../../components/timer/components/PresetPanel";

function createTimer(overrides = {}) {
  return {
    breakTime: 5,
    isActive: false,
    isPaused: false,
    setTimeLeft: vi.fn(),
    targetSessions: 4,
    updateTime: vi.fn(),
    workTime: 5,
    ...overrides,
  };
}

describe("PresetPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders presets and applies the chosen preset in both wrapper modes", () => {
    const timer = createTimer();
    const { rerender } = render(<PresetPanel t={timer} />);

    fireEvent.click(screen.getByText("Pomodoro"));
    expect(applyPresetMock).toHaveBeenCalledWith(expect.objectContaining({ id: "pomodoro" }), timer);

    rerender(<PresetPanel t={timer} embedded />);
    expect(screen.getByText("Deep Work")).toBeInTheDocument();
  });
});

describe("TimerConfigPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies quick-adjust presets and enforces the minimum study length", () => {
    const timer = createTimer({ workTime: 5 });
    render(<TimerConfigPanel t={timer} />);

    fireEvent.click(screen.getByText("-5m"));
    fireEvent.click(screen.getByText("25m"));
    fireEvent.click(screen.getByText("50m"));
    fireEvent.click(screen.getByText("90m"));
    fireEvent.click(screen.getByText("+5m"));

    expect(timer.updateTime).toHaveBeenCalledWith("work", 5);
    expect(timer.updateTime).toHaveBeenCalledWith("work", 25);
    expect(timer.updateTime).toHaveBeenCalledWith("work", 50);
    expect(timer.updateTime).toHaveBeenCalledWith("work", 90);
    expect(timer.updateTime).toHaveBeenCalledWith("work", 10);
    expect(timer.setTimeLeft).toHaveBeenCalledWith(300);
    expect(timer.setTimeLeft).toHaveBeenCalledWith(1500);
    expect(timer.setTimeLeft).toHaveBeenCalledWith(3000);
    expect(timer.setTimeLeft).toHaveBeenCalledWith(5400);
    expect(timer.setTimeLeft).toHaveBeenCalledWith(600);
    expect(screen.getByTestId("auto-start-toggle")).toBeInTheDocument();
  });

  it("falls back to a 25 minute base when the current work time is missing", () => {
    const timer = createTimer({ workTime: 0 });
    render(<TimerConfigPanel t={timer} />);

    fireEvent.click(screen.getByText("+5m"));

    expect(timer.updateTime).toHaveBeenCalledWith("work", 30);
    expect(timer.setTimeLeft).toHaveBeenCalledWith(1800);
  });

  it("disables adjustments while the timer is actively running", () => {
    const timer = createTimer({ isActive: true, isPaused: false, workTime: 25 });
    render(<TimerConfigPanel t={timer} embedded />);

    expect(screen.getByTestId("timer-settings")).toHaveTextContent("25:5:4:true");
    expect(screen.getAllByRole("button").every((button) => button.disabled)).toBe(true);
  });
});
