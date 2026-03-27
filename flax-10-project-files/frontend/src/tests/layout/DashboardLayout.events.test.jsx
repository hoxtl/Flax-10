import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  mockOpenModal,
  prepareDashboardLayoutTest,
  renderDashboardLayout,
} from "./dashboardLayoutTestUtils";

beforeEach(async () => {
  await prepareDashboardLayoutTest();
});

describe("DashboardLayout Modals and Events", () => {
  it("opens QuickAdd modal from QuickAdd event selection", () => {
    renderDashboardLayout();
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Add Event"));
    expect(mockOpenModal).toHaveBeenCalledWith(null, "event", expect.any(Date));
  });

  it("shows EventModal when isModalOpen is true", async () => {
    const { useEventModal } = await import("../../context/CalendarContext");
    useEventModal.mockReturnValue({
      isModalOpen: true,
      closeModal: vi.fn(),
      openModal: vi.fn(),
      modalEvent: { id: 1, title: "Test" },
      modalType: "event",
      modalInitialDate: null,
    });
    renderDashboardLayout();
    expect(screen.getByTestId("event-modal")).toBeTruthy();
  });

  it("EventModal closeModal is called when Close Event Modal clicked", async () => {
    const closeModal = vi.fn();
    const { useEventModal } = await import("../../context/CalendarContext");
    useEventModal.mockReturnValue({
      isModalOpen: true,
      closeModal,
      openModal: vi.fn(),
      modalEvent: null,
      modalType: null,
      modalInitialDate: null,
    });
    renderDashboardLayout();
    fireEvent.click(screen.getByText("Close Event Modal"));
    expect(closeModal).toHaveBeenCalled();
  });

  it("opens CreateSociety modal from QuickAdd", () => {
    renderDashboardLayout();
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Add Society"));
    expect(screen.getByTestId("society-modal")).toBeTruthy();
    fireEvent.click(screen.getByText("Close Society Modal"));
    expect(screen.queryByTestId("society-modal")).toBeNull();
  });

  it("onSelectType add_deadline opens DeadlineModal", () => {
    renderDashboardLayout();
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Add Deadline"));
    expect(screen.getByTestId("deadline-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Close Deadline Modal"));
    expect(screen.queryByTestId("deadline-modal")).toBeNull();
  });

  it("onSelectType add_reading opens ReadingModal", () => {
    renderDashboardLayout();
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Add Reading"));
    expect(screen.getByTestId("reading-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Close Reading Modal"));
    expect(screen.queryByTestId("reading-modal")).toBeNull();
  });
});
