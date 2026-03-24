import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import AttendancePageStatus from "../../../pages/Attendance/components/AttendancePageStatus";
import AttendancePageBody from "../../../pages/Attendance/components/AttendancePageBody";
import AttendanceListSection from "../../../pages/Attendance/components/AttendanceListSection";
import AttendanceListColumn from "../../../pages/Attendance/components/AttendanceListColumn";
import RecordAttendanceList from "../../../pages/Attendance/components/RecordAttendanceList";
import MarkedAttendanceList from "../../../pages/Attendance/components/MarkedAttendanceList";
import AttendanceEventList from "../../../pages/Attendance/components/AttendanceEventList";
import AttendanceEventInfo from "../../../pages/Attendance/components/AttendanceEventInfo";
import AttendanceRecordActions from "../../../pages/Attendance/components/AttendanceRecordActions";
import AttendanceMarkedActions from "../../../pages/Attendance/components/AttendanceMarkedActions";
import SegmentDetailPanel from "../../../pages/Attendance/components/SegmentDetailPanel";
import SegmentDetailHeader from "../../../pages/Attendance/components/SegmentDetailHeader";
import SegmentDetailList from "../../../pages/Attendance/components/SegmentDetailList";

const recordAttendanceMock = vi.fn();

vi.mock("../../../api/attendanceApi", () => ({
  recordAttendance: (...args) => recordAttendanceMock(...args),
}));

vi.mock("../../../components/common/LoadingState/SkeletonBlock", () => ({
  default: ({ className }) => <div data-testid="skeleton" className={className} />,
}));

vi.mock("../../../pages/Attendance/components/AttendanceChartsColumn", () => ({
  default: ({ model }) => <div>Charts: {model.summary?.pct}</div>,
}));

vi.mock("../../../pages/Attendance/components/AttendanceSummaryBar", () => ({
  default: ({ summary }) => <div>Summary: {summary?.pct}</div>,
}));

vi.mock("../../../components/common", () => ({
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

vi.mock("../../../components/common/PrimaryButton/PrimaryButton", () => ({
  default: ({ children, onClick, className }) => (
    <button className={className} onClick={onClick}>{children}</button>
  ),
}));

describe("Attendance components", () => {
  beforeEach(() => {
    recordAttendanceMock.mockReset();
    recordAttendanceMock.mockResolvedValue({});
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

  it("renders the tabbed list and the segment panel branch", () => {
    const showRecordTab = vi.fn();
    const showMarkedTab = vi.fn();
    const clearSegment = vi.fn();
    const handleToggleStatus = vi.fn();

    const { rerender } = render(
      <AttendanceListColumn
        model={{
          eventsLoading: false,
          selectedSegment: null,
          listTab: "record",
          unmarkedEvents: [{ id: 1, title: "Lecture", start_time: "2026-03-01T09:00:00Z" }],
          markedEvents: [],
          refetchAll: vi.fn(),
          showRecordTab,
          showMarkedTab,
        }}
      />
    );

    expect(screen.getByText("Active tab: record")).toBeInTheDocument();
    fireEvent.click(screen.getByText("marked"));
    expect(showMarkedTab).toHaveBeenCalled();

    rerender(
      <AttendanceListColumn
        model={{
          eventsLoading: false,
          selectedSegment: { chart: "overall", label: "Attended" },
          segmentLabel: "Overall: Attended",
          segmentEvents: [{ id: 2, title: "Lab", start_time: "2026-03-01T10:00:00Z", attended: true, event_type: "Lab" }],
          handleToggleStatus,
          clearSegment,
        }}
      />
    );

    expect(screen.getByText("Overall: Attended")).toBeInTheDocument();
    fireEvent.click(screen.getByText("✕"));
    expect(clearSegment).toHaveBeenCalled();
  });

  it("renders empty and populated record and marked lists and records changes", async () => {
    const onRecorded = vi.fn();
    const manyEvents = Array.from({ length: 21 }, (_, index) => ({
      id: index + 1,
      title: `Lecture ${index + 1}`,
      start_time: "2026-03-01T09:00:00Z",
      attended: index % 2 === 0,
      event_type: "Lecture",
    }));

    const { rerender, container } = render(<RecordAttendanceList events={[]} onRecorded={onRecorded} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<RecordAttendanceList events={manyEvents} onRecorded={onRecorded} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Attended" })[0]);
    await waitFor(() => expect(recordAttendanceMock).toHaveBeenCalledWith(1, true));
    expect(onRecorded).toHaveBeenCalled();
    expect(screen.getByText("Showing first 20 events.")).toBeInTheDocument();

    const manyMarkedEvents = Array.from({ length: 31 }, (_, index) => ({
      id: index + 101,
      title: `Lecture ${index + 1}`,
      start_time: "2026-03-01T09:00:00Z",
      attended: index % 2 === 0,
      event_type: "Lecture",
    }));
    rerender(<MarkedAttendanceList markedEvents={manyMarkedEvents} />);
    expect(screen.queryByRole("button", { name: "Change" })).not.toBeInTheDocument();
    expect(screen.getAllByText("Attended").length).toBeGreaterThan(0);
    expect(screen.getByText(/Showing 30 most recent/)).toBeInTheDocument();
  }, 15000);

  it("renders event info, record actions, marked actions, and segment detail rows", async () => {
    const onRecord = vi.fn();
    const onToggleStatus = vi.fn().mockResolvedValue(undefined);

    render(
      <>
        <AttendanceEventList
          events={[{ id: 1, title: "Algebra", start_time: "2026-03-01T09:00:00Z" }]}
          renderActions={(event) => <button>{event.id}</button>}
        />
        <AttendanceEventInfo event={{ title: "Biology", start_time: "2026-03-01T10:00:00Z" }} />
        <AttendanceRecordActions event={{ id: 2, start_time: "2026-03-01T12:00:00Z" }} submittingId={null} onRecord={onRecord} />
        <AttendanceMarkedActions event={{ id: 3, attended: true }} />
        <SegmentDetailHeader segmentLabel="Lecture" count={2} onClose={vi.fn()} />
        <SegmentDetailList events={[]} toggling={{}} onToggleStatus={vi.fn()} />
        <SegmentDetailPanel
          segmentLabel="Lecture"
          events={[{ id: 4, title: "Chemistry", start_time: "2026-03-01T11:00:00Z", attended: false, event_type: "Lecture" }]}
          onToggleStatus={onToggleStatus}
          onClose={vi.fn()}
          className="extra-panel"
        />
      </>
    );

    expect(screen.getByText("Algebra")).toBeInTheDocument();
    expect(screen.getByText("Biology")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Attended" })[0]);
    expect(onRecord).toHaveBeenCalledWith(2, true);
    expect(screen.getByText("2 events")).toBeInTheDocument();
    expect(screen.getByText("No records found for this segment.")).toBeInTheDocument();
    expect(screen.getAllByText("Attended").length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole("button", { name: "Missed" }).at(-1));
    await waitFor(() => expect(onToggleStatus).toHaveBeenCalledWith(4, true));
  });
});
