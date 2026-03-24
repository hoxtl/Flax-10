import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { PopupSection } from "../../../components/Timer/sections/PopupSection";
import { FocusOverlayContent } from "../../../components/Timer/sections/FocusOverlayContent";
import { RightPanel } from "../../../components/Timer/sections/RightPanel";
import { MainSection } from "../../../components/Timer/sections/MainSection";

vi.mock("../../../components/Timer/HistoryModal", () => ({
  default: ({ onClose }) => <button onClick={onClose}>History modal</button>,
}));

vi.mock("../../../components/Timer/TimerPopups", () => ({
  OvertimePopup: ({ mode, onAction }) => <button onClick={onAction}>Overtime {mode}</button>,
  GoalModal: ({ onAction }) => <button onClick={onAction}>Goal modal</button>,
  BreakModal: ({ onAction }) => <button onClick={onAction}>Break modal</button>,
  EndEarlyModal: ({ onConfirm, onCancel }) => <><button onClick={onConfirm}>End early</button><button onClick={onCancel}>Cancel end early</button></>,
  BreakStartedPopup: ({ onAction }) => <button onClick={onAction}>Auto break</button>,
}));

vi.mock("../../../components/Timer/hooks/useTimerPopupEffects", () => ({
  useTimerPopupEffects: vi.fn(),
}));

vi.mock("../../../components/Timer/TimerCircle", () => ({
  default: () => <div>Timer circle</div>,
  TimerRing: () => <div>Timer ring</div>,
}));

vi.mock("../../../components/common/Tabs/Tabs", () => ({
  default: ({ tabs, activeTab, onTabChange }) => (
    <div>
      <div>Active tab: {activeTab}</div>
      {tabs.map((tab) => <button key={tab.id} onClick={() => onTabChange(tab.id)}>{tab.label}</button>)}
      <div>{tabs.find((tab) => tab.id === activeTab)?.content}</div>
    </div>
  ),
}));

vi.mock("../../../components/Timer/InlineSoundPanel", () => ({
  default: () => <div>Inline sound panel</div>,
}));

vi.mock("../../../components/Timer/RightRailHistoryPanel", () => ({
  default: () => <div>Right rail history</div>,
}));

vi.mock("../../../components/Timer/PresetPanel", () => ({
  PresetPanel: () => <div>Preset panel</div>,
  TimerConfigPanel: () => <div>Config panel</div>,
}));

vi.mock("../../../components/Timer/SessionDots", () => ({
  default: () => <div>Session dots</div>,
  LiveStatsRow: ({ onDistract }) => <button onClick={onDistract}>Distract</button>,
  ProgressStrip: () => <div>Progress strip</div>,
}));

vi.mock("../../../components/Timer/TaskInput", () => ({
  TaskInput: ({ onClearTask, onJustStart, onOpenFocus }) => (
    <>
      <button onClick={onClearTask}>Clear task</button>
      <button onClick={onJustStart}>Just start</button>
      <button onClick={onOpenFocus}>Open focus</button>
    </>
  ),
}));

vi.mock("../../../components/Timer/TimerComponents", () => ({
  TimerControls: ({ onToggle, onPause, onReset, onEndEarly }) => (
    <>
      <button onClick={onToggle}>Toggle timer</button>
      <button onClick={onPause}>Pause timer</button>
      <button onClick={onReset}>Reset timer</button>
      <button onClick={onEndEarly}>End early modal</button>
    </>
  ),
  ModeIndicator: () => <div>Mode indicator</div>,
}));

vi.mock("../../../components/Timer/hooks/useSuggestedTimerTask", () => ({
  useSuggestedTimerTask: vi.fn(),
}));

vi.mock("../../../components/Timer/utils/timerTaskActions", () => ({
  clearManualTask: vi.fn(),
  startManualTask: vi.fn(),
  startSuggestedTask: vi.fn(),
}));

vi.mock("../../../components/Timer/utils/presetUtils", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    applyTaskToTimer: vi.fn(),
    AUTOSTART_KEY: "timer_autostart",
  };
});

describe("Timer sections", () => {
  const t = {
    modal: "goal",
    timeLeft: 120,
    completedSessions: 1,
    targetSessions: 3,
    mode: "work",
    workTime: 25,
    breakTime: 5,
    isOvertime: true,
    isBreakOvertime: true,
    blockTotalWork: 30,
    blockTotalBreak: 10,
    distractionCount: 2,
    handlers: {
      autoBreakDone: vi.fn(),
      break: vi.fn(),
      overtimeBreak: vi.fn(),
      goal: vi.fn(),
      endEarly: vi.fn(),
    },
    setModal: vi.fn(),
    isActive: true,
    isPaused: false,
    totalPaused: 3,
    resetTimer: vi.fn(),
    togglePause: vi.fn(),
    setTask: vi.fn(),
    task: "Essay",
    addDistraction: vi.fn(),
  };

  it("renders timer popups and history modal branches", () => {
    localStorage.setItem("timer_autostart", "false");
    render(<PopupSection t={{ ...t, modal: "autoBreak" }} showHistory={true} onCloseHistory={vi.fn()} />);
    expect(screen.getByText("History modal")).toBeInTheDocument();
    expect(screen.getByText("Auto break")).toBeInTheDocument();
    expect(screen.getByText("Overtime work")).toBeInTheDocument();
    expect(screen.getByText("Overtime break")).toBeInTheDocument();

    render(<PopupSection t={{ ...t, modal: "break" }} showHistory={false} onCloseHistory={vi.fn()} />);
    expect(screen.getByText("Break modal")).toBeInTheDocument();

    render(<PopupSection t={{ ...t, modal: "endEarly" }} showHistory={false} onCloseHistory={vi.fn()} />);
    expect(screen.getByText("End early")).toBeInTheDocument();
  });

  it("renders focus overlay, right panel tabs, and main section actions", () => {
    const onExitFocus = vi.fn();
    const onOpenHistory = vi.fn();
    const onOpenFocus = vi.fn();

    render(
      <>
        <FocusOverlayContent t={t} onExitFocus={onExitFocus} />
        <RightPanel t={t} />
        <MainSection t={t} onOpenHistory={onOpenHistory} onOpenFocus={onOpenFocus} isMobile={true} />
      </>
    );

    fireEvent.click(screen.getByText("Exit Focus"));
    expect(onExitFocus).toHaveBeenCalled();

    fireEvent.click(screen.getByText("Configuration"));
    fireEvent.click(screen.getByText("History"));
    expect(screen.getByText("Inline sound panel")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Open focus"));
    fireEvent.click(screen.getByText("Pause timer"));
    fireEvent.click(screen.getByText("Reset timer"));
    fireEvent.click(screen.getByText("End early modal"));
    fireEvent.click(screen.getByText("Distract"));
    fireEvent.click(screen.getByText("View History 📜"));

    expect(onOpenFocus).toHaveBeenCalled();
    expect(t.togglePause).toHaveBeenCalled();
    expect(t.resetTimer).toHaveBeenCalled();
    expect(t.setModal).toHaveBeenCalledWith("endEarly");
    expect(onOpenHistory).toHaveBeenCalled();
  });
});
