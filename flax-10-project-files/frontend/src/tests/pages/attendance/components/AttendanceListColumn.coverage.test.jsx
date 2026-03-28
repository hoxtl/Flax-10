import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AttendanceListColumn from "../../../../pages/attendance/components/AttendanceListColumn";

const showToastMock = vi.fn();

vi.mock("../../../../context/ToastContext", () => ({
  useToast: () => showToastMock,
}));

vi.mock("../../../../components/common/loading_state/SkeletonBlock", () => ({
  default: ({ className }) => <div data-testid="skeleton" className={className} />,
}));

vi.mock("../../../../components/common", () => ({
  Tabs: ({ tabs, activeTab, onTabChange }) => (
    <div>
      <div>Active tab: {activeTab}</div>
      {tabs.map((tab) => (
        <button key={tab.id} type="button" onClick={() => onTabChange(tab.id)}>
          {tab.id}
        </button>
      ))}
      <div>{tabs.find((tab) => tab.id === activeTab)?.content}</div>
    </div>
  ),
}));

vi.mock("../../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, className, onClick, loading }) => (
    <button type="button" className={className} onClick={onClick} disabled={loading}>
      {children}
    </button>
  ),
}));

describe("AttendanceListColumn coverage", () => {
  beforeEach(() => {
    showToastMock.mockReset();
  });

  it("shows the loading panel when the marked tab is selected and events are loading", () => {
    render(
      <AttendanceListColumn
        model={{
          eventsLoading: true,
          selectedSegment: null,
          listTab: "marked",
          unmarkedEvents: [],
          markedEvents: [],
          showRecordTab: vi.fn(),
          showMarkedTab: vi.fn(),
        }}
      />,
    );

    expect(screen.getByText("Loading attendance events...")).toBeInTheDocument();
    expect(screen.getByLabelText("Loading attendance events")).toBeInTheDocument();
  });

  it("shows the attended success toast when a segment item is toggled from missed to attended", async () => {
    const handleToggleStatus = vi.fn().mockResolvedValue(undefined);

    render(
      <AttendanceListColumn
        model={{
          selectedSegment: { chart: "overall", label: "Missed" },
          segmentLabel: "Overall: Missed",
          segmentEvents: [
            {
              id: 11,
              title: "Lecture 11",
              start_time: "2026-03-18T09:00:00Z",
              event_type: "Lecture",
              attended: false,
            },
          ],
          handleToggleStatus,
          clearSegment: vi.fn(),
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Missed" }));

    await waitFor(() => expect(handleToggleStatus).toHaveBeenCalledWith(11, true));
    await waitFor(() => expect(showToastMock).toHaveBeenCalledWith("Attendance marked."));
  });

  it("shows an error toast when a segment toggle request fails", async () => {
    const handleToggleStatus = vi.fn().mockRejectedValue(new Error("nope"));

    render(
      <AttendanceListColumn
        model={{
          selectedSegment: { chart: "overall", label: "Attended" },
          segmentLabel: "Overall: Attended",
          segmentEvents: [
            {
              id: 12,
              title: "Lecture 12",
              start_time: "2026-03-19T09:00:00Z",
              event_type: "Lecture",
              attended: true,
            },
          ],
          handleToggleStatus,
          clearSegment: vi.fn(),
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Attended" }));

    await waitFor(() => expect(handleToggleStatus).toHaveBeenCalledWith(12, false));
    await waitFor(() =>
      expect(showToastMock).toHaveBeenCalledWith("Couldn't mark attendance. Try again.", {
        variant: "error",
      }),
    );
  });
});
