import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockOpenModal = vi.fn();

vi.mock("../../context/CalendarContext", () => ({
  useCalendar: vi.fn(() => ({ selectedDate: new Date() })),
  useEventModal: vi.fn(() => ({
    isModalOpen: false, closeModal: vi.fn(), openModal: mockOpenModal,
    modalEvent: null, modalType: null, modalInitialDate: null,
  })),
}));

import DashboardLayout from "../../layout/DashboardLayout";
import { useEventModal } from "../../context/CalendarContext";

vi.mock("../../components/dashboard/sidebar", async () => {
  const { SidebarMock } = await import("./dashboardMocks");
  return { default: SidebarMock };
});
vi.mock("../../components/dashboard/Topbar", async () => {
  const { TopbarMock } = await import("./dashboardMocks");
  return { default: TopbarMock };
});
vi.mock("../../components/dashboard/QuickAddModal", async () => {
  const { QuickAddMock } = await import("./dashboardMocks");
  return { default: QuickAddMock };
});
vi.mock("../../components/calendar/event_modal/EventModal", async () => {
  const { EventModalMock } = await import("./dashboardMocks");
  return { EventModal: EventModalMock };
});
vi.mock("../../components/society/CreateSocietyModal", async () => {
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
vi.mock("../../components/timer/TimerPopups", async () => {
  const { LeaveTimerMock } = await import("./dashboardMocks");
  return { LeaveTimerModal: LeaveTimerMock };
});
vi.mock("../../pages/tasks/components/CreateTaskModal", async () => {
  const { CreateTaskMock } = await import("./dashboardMocks");
  return { default: CreateTaskMock };
});

vi.mock("../../components/dashboard/WeekBar", () => ({ default: () => <div data-testid="weekbar" /> }));
vi.mock("../../components/FloatingChat", () => ({ default: () => <div data-testid="floating-chat" /> }));
vi.mock("../../components/pagination/Pagination", () => ({ BackToTop: () => <div data-testid="back-to-top" /> }));
vi.mock("../../api/authApi", () => ({ authService: { logout: vi.fn() } }));
vi.mock("../../components/Auth/utils/authHelpers", () => ({ clearUserData: vi.fn() }));
vi.mock("react-router-dom", () => ({
  useLocation: vi.fn(() => ({ pathname: "/", search: "", hash: "", state: null, key: "default" })),
}));

vi.mock("../../context/TimerContext", () => ({ useTimerContext: vi.fn(() => ({ isActive: false })) }));
vi.mock("../../context/NotificationContext", () => ({ useNotifications: () => ({ addNotification: vi.fn() }) }));

describe("DashboardLayout Modals and Events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useEventModal.mockReturnValue({
      isModalOpen: false, closeModal: vi.fn(), openModal: mockOpenModal,
      modalEvent: null, modalType: null, modalInitialDate: null,
    });
  });

  it("opens QuickAdd modal from QuickAdd event selection", () => {
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Add Event"));
    expect(mockOpenModal).toHaveBeenCalledWith(null, "event", expect.any(Date));
  });

  it("shows EventModal when isModalOpen is true", () => {
    useEventModal.mockReturnValue({
      isModalOpen: true, closeModal: vi.fn(), openModal: vi.fn(),
      modalEvent: { id: 1, title: 'Test' }, modalType: 'event', modalInitialDate: null,
    });
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    expect(screen.getByTestId("event-modal")).toBeTruthy();
  });

  it("EventModal closeModal is called when Close Event Modal clicked", () => {
    const closeModal = vi.fn();
    useEventModal.mockReturnValue({
      isModalOpen: true, closeModal, openModal: vi.fn(),
      modalEvent: null, modalType: null, modalInitialDate: null,
    });
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Close Event Modal"));
    expect(closeModal).toHaveBeenCalled();
  });

  it("opens CreateSociety modal from QuickAdd", () => {
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Add Society"));
    expect(screen.getByTestId("society-modal")).toBeTruthy();
    fireEvent.click(screen.getByText("Close Society Modal"));
    expect(screen.queryByTestId("society-modal")).toBeNull();
  });

  it("onSelectType add_deadline opens DeadlineModal", () => {
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Add Deadline"));
    expect(screen.getByTestId("deadline-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Close Deadline Modal"));
    expect(screen.queryByTestId("deadline-modal")).toBeNull();
  });

  it("onSelectType add_reading opens ReadingModal", () => {
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Add Reading"));
    expect(screen.getByTestId("reading-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Close Reading Modal"));
    expect(screen.queryByTestId("reading-modal")).toBeNull();
  });
});
