import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useNavigateMock = vi.fn();
const useToastMock = vi.fn();
const useCalendarMock = vi.fn();
const useCalendarDispatchMock = vi.fn();
const useEventModalMock = vi.fn();
const useEventPopupMock = vi.fn();
const useCalendarEventsMock = vi.fn();
const useEventActionsMock = vi.fn();
const useTagsMock = vi.fn();
const useTaskCompletionMock = vi.fn();
const useTimerContextMock = vi.fn();
const useHomeDataMock = vi.fn();
const useHomepageActionsMock = vi.fn();
const useHomepageDisplayNameMock = vi.fn();
const useHomepageModalsMock = vi.fn();
const useHomepageRescheduleMock = vi.fn();
const useHomepageResourcesMock = vi.fn();
const useHomepageToastMock = vi.fn();
const useHomepageViewModelMock = vi.fn();
const useHomepageSelectionMock = vi.fn();
const useHomepageEventBootstrapMock = vi.fn();
const useHomepageNowMock = vi.fn();
const useTimerCompletionSoundMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => useNavigateMock(),
  };
});

vi.mock("../../../../context/CalendarContext", () => ({
  useCalendar: () => useCalendarMock(),
  useCalendarDispatch: () => useCalendarDispatchMock(),
  useEventModal: () => useEventModalMock(),
  useEventPopup: () => useEventPopupMock(),
}));

vi.mock("../../../../components/Calendar/hooks/useCalendarEvents", () => ({
  useCalendarEvents: () => useCalendarEventsMock(),
  useEventActions: () => useEventActionsMock(),
}));

vi.mock("../../../../context/TagContext", () => ({
  useTags: () => useTagsMock(),
}));

vi.mock("../../../../context/TaskCompletionContext", () => ({
  useTaskCompletion: () => useTaskCompletionMock(),
}));

vi.mock("../../../../context/ToastContext", () => ({
  useToast: () => useToastMock(),
}));

vi.mock("../../../../context/TimerContext", () => ({
  useTimerContext: () => useTimerContextMock(),
}));

vi.mock("../../../../pages/Homepage/hooks/useHomeData", () => ({
  useHomeData: (...args) => useHomeDataMock(...args),
}));

vi.mock("../../../../pages/Homepage/hooks/useHomepageActions", () => ({
  useHomepageActions: (...args) => useHomepageActionsMock(...args),
}));

vi.mock("../../../../pages/Homepage/hooks/useHomepageDisplayName", () => ({
  useHomepageDisplayName: () => useHomepageDisplayNameMock(),
}));

vi.mock("../../../../pages/Homepage/hooks/useHomepageModals", () => ({
  useHomepageModals: (...args) => useHomepageModalsMock(...args),
}));

vi.mock("../../../../pages/Homepage/hooks/useHomepageReschedule", () => ({
  useHomepageReschedule: (...args) => useHomepageRescheduleMock(...args),
}));

vi.mock("../../../../pages/Homepage/hooks/useHomepageResources", () => ({
  useHomepageResources: () => useHomepageResourcesMock(),
}));

vi.mock("../../../../pages/Homepage/hooks/useHomepageToast", () => ({
  useHomepageToast: (...args) => useHomepageToastMock(...args),
}));

vi.mock("../../../../pages/Homepage/hooks/useHomepageViewModel", () => ({
  useHomepageViewModel: (...args) => useHomepageViewModelMock(...args),
}));

vi.mock("../../../../pages/Homepage/hooks/useHomepagePageEffects", () => ({
  useHomepageEventBootstrap: (...args) => useHomepageEventBootstrapMock(...args),
  useHomepageNow: () => useHomepageNowMock(),
  useHomepageSelection: (...args) => useHomepageSelectionMock(...args),
  useTimerCompletionSound: (...args) => useTimerCompletionSoundMock(...args),
}));

import { useHomepageController } from "../../../../pages/Homepage/hooks/useHomepageController.js";

describe("useHomepageController", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useNavigateMock.mockReturnValue(vi.fn());
    useToastMock.mockReturnValue({ push: vi.fn() });
    useCalendarMock.mockReturnValue({
      selectedDate: new Date("2026-03-25T00:00:00Z"),
      events: [{ id: "event-1" }],
      allEvents: [{ id: "event-all" }],
    });
    useCalendarDispatchMock.mockReturnValue(vi.fn());
    useEventModalMock.mockReturnValue({ openModal: vi.fn() });
    useEventPopupMock.mockReturnValue({ openPopup: vi.fn() });
    useCalendarEventsMock.mockReturnValue({ loadEvents: vi.fn() });
    useEventActionsMock.mockReturnValue({
      addEvent: vi.fn(),
      editEvent: vi.fn(),
      removeEvent: vi.fn(),
    });
    useTagsMock.mockReturnValue({ getTag: vi.fn(), tags: [{ id: 1, name: "Academic" }] });
    useTaskCompletionMock.mockReturnValue({ showCompletionToast: vi.fn() });
    useTimerContextMock.mockReturnValue({
      breakTime: 5,
      isActive: true,
      mode: "work",
      task: "Essay",
      timeLeft: 120,
      workTime: 25,
    });
    useHomeDataMock.mockReturnValue({
      allTasks: [{ id: 1 }],
      dayEvents: [{ id: "day-1" }],
      dayTasks: [{ id: 2 }],
      loading: false,
      refetchTasks: vi.fn(),
      removePendingTask: vi.fn(),
    });
    useHomepageDisplayNameMock.mockReturnValue("Alice");
    useHomepageModalsMock.mockReturnValue({ showCreateTaskModal: true });
    useHomepageResourcesMock.mockReturnValue({
      enrollments: [{ id: 1 }],
      modulesList: [{ id: 2 }],
      setTaskLists: vi.fn(),
      taskLists: [{ id: 3 }],
      upcomingDeadlines: [{ id: 4 }],
    });
    useHomepageToastMock.mockReturnValue({ fallbackToast: null, setFallbackToast: vi.fn(), showToast: vi.fn() });
    useHomepageNowMock.mockReturnValue(new Date("2026-03-25T09:00:00Z"));
    useHomepageViewModelMock.mockReturnValue({ sortedEvents: ["sorted"], missedItems: ["missed"], overdueTasksForNow: ["overdue"] });
    useHomepageActionsMock.mockReturnValue({ deleteTaskAndRefresh: vi.fn(), handleTaskWidgetComplete: vi.fn() });
    useHomepageRescheduleMock.mockReturnValue({ handleReschedule: vi.fn() });
  });

  it("wires independent hook dependencies with provided configuration", () => {
    renderHook(() => useHomepageController(true, { id: "read-1" }));
    expect(useHomepageModalsMock).toHaveBeenCalledWith(true, { id: "read-1" });
    expect(useHomeDataMock).toHaveBeenCalledWith(new Date("2026-03-25T00:00:00Z"));
    expect(useHomepageToastMock).toHaveBeenCalledWith({ push: expect.any(Function) });
    expect(useHomepageSelectionMock).toHaveBeenCalled();
    expect(useHomepageEventBootstrapMock).toHaveBeenCalledWith([{ id: "event-1" }], expect.any(Function), new Date("2026-03-25T00:00:00Z"));
    expect(useTimerCompletionSoundMock).toHaveBeenCalledWith(true, 120, "work");
  });

  it("constructs the homepage view model using aggregated api resources", () => {
    renderHook(() => useHomepageController(true, { id: "read-1" }));
    expect(useHomepageViewModelMock).toHaveBeenCalledWith(expect.objectContaining({
      allCalEvents: [{ id: "event-1" }],
      allTasks: [{ id: 1 }],
      dayEvents: [{ id: "day-1" }],
      dayTasks: [{ id: 2 }],
      enrollments: [{ id: 1 }],
      modulesList: [{ id: 2 }],
      upcomingDeadlines: [{ id: 4 }],
    }));
  });

  it("binds action handlers mapping events and tasks onto utilities", () => {
    renderHook(() => useHomepageController(true, { id: "read-1" }));
    expect(useHomepageActionsMock).toHaveBeenCalledWith(expect.objectContaining({
      addEvent: expect.any(Function), loadEvents: expect.any(Function), refetchTasks: expect.any(Function), removePendingTask: expect.any(Function), selectedDate: new Date("2026-03-25T00:00:00Z"),
    }));
    expect(useHomepageRescheduleMock).toHaveBeenCalledWith(expect.objectContaining({
      addEvent: expect.any(Function), deleteTask: expect.any(Function), editEvent: expect.any(Function), loadEvents: expect.any(Function), missedItems: ["missed"], overdueTasksForNow: ["overdue"], removeEvent: expect.any(Function), sortedEvents: ["sorted"],
    }));
  });

  it("returns the composed controller payload matching all dimensions", () => {
    const { result } = renderHook(() => useHomepageController(true, { id: "read-1" }));
    expect(result.current).toEqual(expect.objectContaining({
      displayName: "Alice", dayTasks: [{ id: 2 }], homeDataLoading: false, modals: { showCreateTaskModal: true },
      state: { sortedEvents: ["sorted"], missedItems: ["missed"], overdueTasksForNow: ["overdue"] },
      reschedule: { handleReschedule: expect.any(Function) }, tags: [{ id: 1, name: "Academic" }],
      taskLists: [{ id: 3 }], upcomingDeadlines: [{ id: 4 }], breakTime: 5, hasTimerSession: true,
      timerMode: "work", timerTask: "Essay", workTime: 25,
    }));
  });
});
