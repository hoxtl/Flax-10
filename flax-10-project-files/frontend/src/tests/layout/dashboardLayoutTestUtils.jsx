import { render } from "@testing-library/react";
import { vi } from "vitest";

const hoistedMocks = vi.hoisted(() => ({
  authService: { logout: vi.fn() },
  clearUserData: vi.fn(),
  mockOpenModal: vi.fn(),
  useCalendar: vi.fn(() => ({ selectedDate: new Date() })),
  useEventModal: vi.fn(() => ({
    isModalOpen: false,
    closeModal: vi.fn(),
    openModal: null,
    modalEvent: null,
    modalType: null,
    modalInitialDate: null,
  })),
  useLocation: vi.fn(() => ({
    pathname: "/",
    search: "",
    hash: "",
    state: null,
    key: "default",
  })),
}));

const DEFAULT_LOCATION = {
  pathname: "/",
  search: "",
  hash: "",
  state: null,
  key: "default",
};

export const mockOpenModal = hoistedMocks.mockOpenModal;

export const mockUser = {
  name: "John Doe",
  first_name: "John",
  last_name: "Doe",
  username: "jdoe",
  email: "j@d.com",
};

export const mockTimerContext = {
  isActive: false,
  isPaused: false,
  mode: "work",
  timeLeft: 1500,
  togglePause: vi.fn(),
  setIsActive: vi.fn(),
  setMode: vi.fn(),
  setTimeLeft: vi.fn(),
  resetTimer: vi.fn(),
};

const mockStore = {};

vi.mock("../../context/CalendarContext", () => ({
  useCalendar: hoistedMocks.useCalendar,
  useEventModal: hoistedMocks.useEventModal,
}));

vi.mock("../../components/dashboard/components/Sidebar", async () => {
  const { SidebarMock } = await import("./dashboardMocks");
  return { default: SidebarMock };
});
vi.mock("../../components/dashboard/components/Topbar", async () => {
  const { TopbarMock } = await import("./dashboardMocks");
  return { default: TopbarMock };
});
vi.mock("../../components/dashboard/components/QuickAddModal", async () => {
  const { QuickAddMock } = await import("./dashboardMocks");
  return { default: QuickAddMock };
});
vi.mock("../../components/Calendar/EventModal/EventModal", async () => {
  const { EventModalMock } = await import("./dashboardMocks");
  return { EventModal: EventModalMock };
});
vi.mock("../../components/society/components/CreateSocietyModal", async () => {
  const { CreateSocietyMock } = await import("./dashboardMocks");
  return { default: CreateSocietyMock };
});
vi.mock("../../components/modules/deadlines/DeadlineModal", async () => {
  const { DeadlineModalMock } = await import("./dashboardMocks");
  return { default: DeadlineModalMock };
});
vi.mock("../../components/modules/readings/ReadingModal", async () => {
  const { ReadingModalMock } = await import("./dashboardMocks");
  return { default: ReadingModalMock };
});
vi.mock("../../components/timer/components/TimerPopups", async () => {
  const { LeaveTimerMock } = await import("./dashboardMocks");
  return { LeaveTimerModal: LeaveTimerMock };
});
vi.mock("../../pages/tasks/components/CreateTaskModal", async () => {
  const { CreateTaskMock } = await import("./dashboardMocks");
  return { default: CreateTaskMock };
});

vi.mock("../../components/dashboard/components/WeekBar", () => ({ default: () => <div data-testid="weekbar" /> }));
vi.mock("../../components/floating_chat/components/FloatingChat", () => ({ default: () => <div data-testid="floating-chat" /> }));
vi.mock("../../components/pagination/Pagination", () => ({ BackToTop: () => <div data-testid="back-to-top" /> }));
vi.mock("../../api/authApi", () => ({ authService: hoistedMocks.authService }));
vi.mock("../../components/Authentication/utils/authHelpers", () => ({ clearUserData: hoistedMocks.clearUserData }));
vi.mock("react-router-dom", () => ({ useLocation: hoistedMocks.useLocation }));
vi.mock("../../context/TimerContext", () => ({ useTimerContext: vi.fn(() => mockTimerContext) }));
vi.mock("../../context/NotificationContext", () => ({ useNotifications: () => ({ addNotification: vi.fn() }) }));
vi.mock("../../api/societyApi", () => ({ createSociety: vi.fn().mockResolvedValue({}) }));
vi.mock("../../api/taskApi", () => ({
  createTask: vi.fn().mockResolvedValue({}),
  fetchTaskLists: vi.fn().mockResolvedValue([]),
}));
vi.mock("../../api/moduleApi", () => ({
  getModules: vi.fn().mockResolvedValue([]),
  getEnrollments: vi.fn().mockResolvedValue([]),
}));
vi.mock("../../components/modules/utils/moduleUtils", () => ({ isEnrolledIn: vi.fn(() => false) }));

import DashboardLayout from "../../layout/DashboardLayout";
vi.stubGlobal("localStorage", {
  setItem: (key, val) => {
    mockStore[key] = val.toString();
  },
  getItem: (key) => mockStore[key] || null,
  removeItem: (key) => {
    delete mockStore[key];
  },
});

export function setDashboardLayoutViewport(width) {
  window.innerWidth = width;
  window.dispatchEvent(new Event("resize"));
}

export async function prepareDashboardLayoutTest({
  user = mockUser,
  selectedDate = new Date(),
  width = 1024,
  location = DEFAULT_LOCATION,
  eventModal = {},
  timer = {},
} = {}) {
  vi.clearAllMocks();
  const { useCalendar, useEventModal } = await import("../../context/CalendarContext");
  const { useLocation } = await import("react-router-dom");
  useCalendar.mockReturnValue({ selectedDate });
  useEventModal.mockReturnValue({
    isModalOpen: false,
    closeModal: vi.fn(),
    openModal: mockOpenModal,
    modalEvent: null,
    modalType: null,
    modalInitialDate: null,
    ...eventModal,
  });
  useLocation.mockReturnValue(location);
  Object.assign(mockTimerContext, {
    isActive: false,
    isPaused: false,
    mode: "work",
    timeLeft: 1500,
    ...timer,
  });
  if (user === null) {
    localStorage.removeItem("user");
  } else {
    localStorage.setItem("user", JSON.stringify(user));
  }
  setDashboardLayoutViewport(width);
}

export function renderDashboardLayout({
  activeNav = "home",
  onNavChange = () => {},
  children = "Content",
} = {}) {
  return render(
    <DashboardLayout activeNav={activeNav} onNavChange={onNavChange}>
      {children}
    </DashboardLayout>,
  );
}
