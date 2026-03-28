/*
 * Tests attendance page status, lists, overlays, and segment details.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import AttendancePageStatus from "../../../../pages/attendance/components/AttendancePageStatus";
import AttendancePageBody from "../../../../pages/attendance/components/AttendancePageBody";
import AttendanceListSection from "../../../../pages/attendance/components/AttendanceListSection";
import AttendanceListColumn from "../../../../pages/attendance/components/AttendanceListColumn";
import RecordAttendanceList from "../../../../pages/attendance/components/RecordAttendanceList";
import MarkedAttendanceList from "../../../../pages/attendance/components/MarkedAttendanceList";
import AttendanceEventList from "../../../../pages/attendance/components/AttendanceEventList";
import AttendanceEventInfo from "../../../../pages/attendance/components/AttendanceEventInfo";
import AttendanceRecordActions from "../../../../pages/attendance/components/AttendanceRecordActions";
import AttendanceMarkedActions from "../../../../pages/attendance/components/AttendanceMarkedActions";
import AttendanceSuccessOverlay from "../../../../pages/attendance/components/AttendanceSuccessOverlay";
import SegmentDetailPanel from "../../../../pages/attendance/components/SegmentDetailPanel";
import SegmentDetailHeader from "../../../../pages/attendance/components/SegmentDetailHeader";
import SegmentDetailList from "../../../../pages/attendance/components/SegmentDetailList";

const recordAttendanceMock = vi.fn();
const showToastMock = vi.fn();

vi.mock("../../../../api/attendanceApi", () => ({
  recordAttendance: (...args) => recordAttendanceMock(...args),
}));

vi.mock("../../../../context/ToastContext", () => ({
  useToast: () => showToastMock,
}));

vi.mock("../../../../components/common/loading_state/SkeletonBlock", () => ({
  default: ({ className }) => <div data-testid="skeleton" className={className} />,
}));

vi.mock("../../../../pages/attendance/components/AttendanceChartsColumn", () => ({
  default: ({ model }) => <div>Charts: {model.summary?.pct}</div>,
}));

vi.mock("../../../../pages/attendance/components/AttendanceSummaryBar", () => ({
  default: ({ summary }) => <div>Summary: {summary?.pct}</div>,
}));

vi.mock("../../../../components/common", () => ({
  Tabs: ({ tabs, activeTab, onTabChange }) => (
    <div>
      <div>Active tab: {activeTab}</div>
      {tabs.map((tab) => (
        <button key={tab.id} onClick={() => onTabChange(tab.id)}>
          {typeof tab.label === "string" ? tab.label : tab.id}
        </button>
      ))}
      <div>{tabs.find((tab) => tab.id === activeTab)?.content}</div>
    </div>
  ),
}));

vi.mock("../../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, onClick, className }) => (
    <button className={className} onClick={onClick}>{children}</button>
  ),
}));

describe("Attendance components", () => {
  beforeEach(() => {
    vi.useRealTimers();
    recordAttendanceMock.mockReset();
    recordAttendanceMock.mockResolvedValue({});
    showToastMock.mockReset();
  });

  it("renders loading and error states for the status component", () => {
    const { rerender } = render(<AttendancePageStatus loading={true} error={null} />);
    expect(screen.getAllByTestId("skeleton")).toHaveLength(4);

    rerender(<AttendancePageStatus loading={false} error="Failed to load" />);
    expect(screen.getByText("Failed to load")).toBeInTheDocument();

    rerender(<AttendancePageStatus loading={false} error={null} />);
    expect(screen.queryByText("Failed to load")).not.toBeInTheDocument();
  });

  it("renders the body layout and list section footer states", () => {
    render(
      <>
        <AttendancePageBody model={{ summary: { pct: 95 }, eventsLoading: false, selectedSegment: null, listTab: "record", unmarkedEvents: [], markedEvents: [], refetchAll: vi.fn(), showRecordTab: vi.fn(), showMarkedTab: vi.fn() }} />
        <AttendanceListSection hint="Hint text" footer="Footer text"><div>Child content</div></AttendanceListSection>
        <AttendanceListSection hint="Hint only"><div>Child two</div></AttendanceListSection>
      </>
    );

    expect(screen.getByText("Summary: 95")).toBeInTheDocument();
    expect(screen.getByText("Charts: 95")).toBeInTheDocument();
    expect(screen.getByText("Hint text")).toBeInTheDocument();
    expect(screen.getByText("Footer text")).toBeInTheDocument();
    expect(screen.getByText("Child two")).toBeInTheDocument();
  });

  const unmarkedEvent = { id: 1, title: "Lecture", start_time: "2026-03-01T09:00:00Z" };
  const segmentEvent = { id: 2, title: "Lab", start_time: "2026-03-01T10:00:00Z", attended: true, event_type: "Lab" };
  const selectedSegment = { chart: "overall", label: "Attended" };

  const generateEvents = (startId, count, overrides = {}) =>
    Array.from({ length: count }, (_, index) => ({
      id: startId + index,
      title: `Lecture ${startId + index}`,
      start_time: `2026-03-${String((index % 20) + 1).padStart(2, "0")}T09:00:00Z`,
      event_type: "Lecture",
      attended: index % 2 === 0,
      ...overrides,
    }));

  function renderCourseworkRecordList(onRecorded) {
    const courseworkOnly = [{ id: 90, title: "Lecture 90", start_time: "2026-03-01T09:00:00Z", event_type: "Coursework" }];
    return render(<RecordAttendanceList events={courseworkOnly} onRecorded={onRecorded} />);
  }

  function rerenderLectureRecordList(rerender, onRecorded) {
    rerender(<RecordAttendanceList events={[{ id: 91, title: "Lecture 91", start_time: "2026-03-01T09:00:00Z", event_type: "Lecture" }]} onRecorded={onRecorded} />);
  }

  async function expectSubmitFailure(onRecorded) {
    recordAttendanceMock.mockRejectedValueOnce(new Error("save failed"));
    fireEvent.click(screen.getByRole("button", { name: "Attended" }));
    await waitFor(() => expect(recordAttendanceMock).toHaveBeenCalledWith(91, true));
    expect(onRecorded).not.toHaveBeenCalled();
    expect(showToastMock).toHaveBeenCalledWith("Couldn't mark attendance. Try again.", { variant: "error" });
  }

  async function expectMissedOverlayToClear() {
    recordAttendanceMock.mockResolvedValueOnce({});
    fireEvent.click(screen.getByRole("button", { name: "Missed" }));
    await waitFor(() => expect(screen.getByText("Missed session noted.")).toBeInTheDocument());
    expect(showToastMock).toHaveBeenCalledWith("Attendance marked as missed.");
    await waitFor(() => expect(screen.queryByText("Missed session noted.")).toBeNull(), { timeout: 2000 });
  }

  it("renders the record tab and switches to marked tab", () => {
    const showMarkedTab = vi.fn();
    render(
      <AttendanceListColumn
        model={{
          eventsLoading: false,
          selectedSegment: null,
          listTab: "record",
          unmarkedEvents: [unmarkedEvent],
          markedEvents: [],
          refetchAll: vi.fn(),
          showRecordTab: vi.fn(),
          showMarkedTab,
        }}
      />
    );

    expect(screen.getByText("Active tab: record")).toBeInTheDocument();
    fireEvent.click(screen.getByText("marked"));
    expect(showMarkedTab).toHaveBeenCalled();
  });

  it("renders the segment detail panel and clears the segment", () => {
    const clearSegment = vi.fn();
    render(
      <AttendanceListColumn
        model={{
          eventsLoading: false,
          selectedSegment,
          segmentLabel: "Overall: Attended",
          segmentEvents: [segmentEvent],
          handleToggleStatus: vi.fn(),
          clearSegment,
        }}
      />
    );

    expect(screen.getByText("Overall: Attended")).toBeInTheDocument();
    fireEvent.click(screen.getByText("✕"));
    expect(clearSegment).toHaveBeenCalled();
  });

  it("shows a loading panel while events are loading", () => {
    render(
      <AttendanceListColumn
        model={{
          eventsLoading: true,
          listTab: "record",
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

  it("renders empty marked list and switches to record tab", () => {
    const showRecordTab = vi.fn();
    render(
      <AttendanceListColumn
        model={{
          eventsLoading: false,
          listTab: "marked",
          unmarkedEvents: [{ id: 1, title: "Lecture 1" }],
          markedEvents: [],
          showRecordTab,
          showMarkedTab: vi.fn(),
        }}
      />,
    );
    expect(screen.getByText("No marked events yet")).toBeInTheDocument();
    fireEvent.click(screen.getByText("record"));
    expect(showRecordTab).toHaveBeenCalled();
  });

  it("renders populated marked tab content and marked badge count", () => {
    render(
      <AttendanceListColumn
        model={{
          eventsLoading: false,
          listTab: "marked",
          unmarkedEvents: [],
          markedEvents: generateEvents(401, 2),
          refetchAll: vi.fn(),
          showRecordTab: vi.fn(),
          showMarkedTab: vi.fn(),
        }}
      />,
    );

    expect(screen.getByText("Active tab: marked")).toBeInTheDocument();
    expect(screen.getByText("Your recorded attendance. Once marked, attendance cannot be changed.")).toBeInTheDocument();
  });

  it("renders empty and populated record and marked lists and records changes", async () => {
    const onRecorded = vi.fn();
    const manyEvents = generateEvents(1, 21, { start_time: "2024-03-01T09:00:00Z" });
    
    render(<RecordAttendanceList events={manyEvents} onRecorded={onRecorded} />);
    const firstAttendButton = screen.getAllByRole("button", { name: "Attended" })[0];
    expect(firstAttendButton).toBeEnabled();
    fireEvent.click(firstAttendButton);
    await waitFor(() => expect(recordAttendanceMock).toHaveBeenCalledWith(1, true));
    expect(onRecorded).toHaveBeenCalled();
    expect(showToastMock).toHaveBeenCalledWith("Attendance marked.");
    expect(screen.getByText("Showing first 20 events.")).toBeInTheDocument();
  });

  it("renders populated marked list with recent events", () => {
    const manyMarkedEvents = generateEvents(101, 31);
    render(<MarkedAttendanceList markedEvents={manyMarkedEvents} />);
    expect(screen.queryByRole("button", { name: "Change" })).not.toBeInTheDocument();
    expect(screen.getAllByText("Attended").length).toBeGreaterThan(0);
    expect(screen.getByText(/Showing 30 most recent/)).toBeInTheDocument();
  });

  it("renders a marked list without the truncation footer when under the limit", () => {
    render(<MarkedAttendanceList markedEvents={generateEvents(501, 2)} />);
    expect(screen.getByText("Your recorded attendance. Once marked, attendance cannot be changed.")).toBeInTheDocument();
    expect(screen.queryByText(/Showing 30 most recent/)).not.toBeInTheDocument();
  });

  it("covers coursework filtering, submit failures, overlay variants, and empty marked lists", async () => {
    const onRecorded = vi.fn();
    const { rerender, container } = renderCourseworkRecordList(onRecorded);
    expect(container).toBeEmptyDOMElement();
    rerenderLectureRecordList(rerender, onRecorded);
    await expectSubmitFailure(onRecorded);
    await expectMissedOverlayToClear();
    rerender(<MarkedAttendanceList markedEvents={[]} />);
    expect(screen.queryByText("Your recorded attendance. Once marked, attendance cannot be changed.")).not.toBeInTheDocument();
  }, 10000);

  it("ignores non-attendance events when the title is missing", () => {
    const { container } = render(
      <RecordAttendanceList
        events={[{ id: 92, start_time: "2026-03-01T09:00:00Z", event_type: "Lecture" }]}
        onRecorded={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the unattended success overlay variant", () => {
    render(<AttendanceSuccessOverlay attended={false} />);
    expect(screen.getByText("Missed session noted.")).toBeInTheDocument();
  });

  it("renders event info, record actions, marked actions, and segment detail rows", async () => {
    const onRecord = vi.fn();
    render(
      <>
        <AttendanceEventList
          events={[{ id: 1, title: "Algebra", start_time: "2026-03-01T09:00:00Z" }]}
          renderActions={(event) => <button>{event.id}</button>}
        />
        <AttendanceEventInfo event={{ title: "Biology", start_time: "2026-03-01T10:00:00Z" }} />
        <AttendanceRecordActions event={{ id: 2, start_time: "2026-03-01T12:00:00Z" }} submittingId={null} onRecord={onRecord} />
      </>
    );

    expect(screen.getByText("Algebra")).toBeInTheDocument();
    expect(screen.getByText("Biology")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Attended" })[0]);
    expect(onRecord).toHaveBeenCalledWith(2, true);
  });

  it("renders marked actions and segment detail sections", async () => {
    const onToggleStatus = vi.fn().mockResolvedValue(undefined);
    render(
      <>
        <AttendanceMarkedActions event={{ id: 3, attended: true }} />
        <SegmentDetailHeader segmentLabel="Lecture" count={2} onClose={vi.fn()} />
        <SegmentDetailPanel
          segmentLabel="Lecture"
          events={[{ id: 4, title: "Chemistry", start_time: "2026-03-01T11:00:00Z", attended: false, event_type: "Lecture" }]}
          onToggleStatus={onToggleStatus}
          onClose={vi.fn()}
        />
      </>
    );
    expect(screen.getByText("2 events")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Missed" }).at(-1));
    await waitFor(() => expect(onToggleStatus).toHaveBeenCalledWith(4, true));
  });

  it("shows a toast after toggling a segment detail attendance state", async () => {
    const onToggleStatus = vi.fn().mockResolvedValue(undefined);
    render(
      <AttendanceListColumn
        model={{
          eventsLoading: false,
          selectedSegment,
          segmentLabel: "Overall: Attended",
          segmentEvents: [segmentEvent],
          handleToggleStatus: onToggleStatus,
          clearSegment: vi.fn(),
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Attended" }));
    await waitFor(() => expect(onToggleStatus).toHaveBeenCalledWith(2, false));
    expect(showToastMock).toHaveBeenCalledWith("Attendance marked as missed.");
  });

  it("renders the empty segment detail state", () => {
    render(<SegmentDetailList events={[]} toggling={{}} onToggleStatus={vi.fn()} />);
    expect(screen.getByText("No records found for this segment.")).toBeInTheDocument();
  });
});
