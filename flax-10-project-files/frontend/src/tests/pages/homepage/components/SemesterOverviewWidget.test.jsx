import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SemesterOverviewWidget from "@/pages/homepage/components/SemesterOverviewWidget";

const useSemesterData = vi.fn();
const useSemesterRange = vi.fn();

vi.mock("lucide-react", () => ({
  CalendarDays: () => <svg data-testid="semester-cal" />,
}));

vi.mock("@/components/common/widget_header/WidgetHeader", () => ({
  default: ({ actions, meta, title }) => (
    <div>
      <span>{title}</span>
      <span>{meta}</span>
      {actions}
    </div>
  ),
}));

vi.mock("@/pages/homepage/components/useSemesterOverviewData", () => ({
  useSemesterData: (...args) => useSemesterData(...args),
  useSemesterRange: (...args) => useSemesterRange(...args),
}));

describe("SemesterOverviewWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSemesterRange.mockReturnValue({
      now: new Date("2026-03-20T12:00:00.000Z"),
      semEnd: new Date("2026-05-25T00:00:00.000Z"),
      semStart: new Date("2026-03-02T00:00:00.000Z"),
    });
  });

  it("shows the loading skeleton while semester data fetches", () => {
    useSemesterData.mockReturnValue({ deadlines: [], events: [], loading: true });
    render(<SemesterOverviewWidget numWeeks={2} semesterLabel="Term load" />);
    expect(screen.getByText("Semester Overview")).toBeInTheDocument();
    expect(screen.getByText("Term load")).toBeInTheDocument();
  });

  it("falls back to default props when omitted", () => {
    useSemesterData.mockReturnValue({ deadlines: [], events: [], loading: false });
    render(<SemesterOverviewWidget />);
    expect(screen.getByText("Semester · 2025/26")).toBeInTheDocument();
  });

  it("renders the legend labels for week classifications", () => {
    useSemesterData.mockReturnValue({ deadlines: [], events: [], loading: false });
    render(<SemesterOverviewWidget numWeeks={1} semesterLabel="Spring" semesterStart="2026-03-02" />);
    expect(screen.getByText("Lectures")).toBeInTheDocument();
    expect(screen.getByText("Deadlines")).toBeInTheDocument();
    expect(screen.getByText("Exams")).toBeInTheDocument();
  });

  it("classifies exams, lectures, and deadlines in the weekly title", () => {
    useSemesterData.mockReturnValue({
      deadlines: [{ start_due_date: "2026-03-03T12:00:00.000Z" }],
      events: [
        { start_time: "2026-03-03T10:00:00.000Z", title: "Final assessment" },
        { start_time: "2026-03-03T14:00:00.000Z", title: "Seminar", source: "timetable" },
        { start_time: "2026-03-03T16:00:00.000Z", title: "Workshop" },
      ],
      loading: false,
    });

    render(<SemesterOverviewWidget numWeeks={1} semesterStart="2026-03-02" />);
    expect(screen.getByTitle(/W1: 1 lecture, 1 deadline, 1 exam/)).toBeInTheDocument();
  });

  it("classifies lab events and explicit exam titles", () => {
    useSemesterData.mockReturnValue({
      deadlines: [],
      events: [
        { start_time: "2026-03-03T09:00:00.000Z", title: "Lab session" },
        { start_time: "2026-03-03T11:00:00.000Z", title: "Exam" },
      ],
      loading: false,
    });

    render(<SemesterOverviewWidget numWeeks={1} semesterStart="2026-03-02" />);
    expect(screen.getByTitle(/W1: 1 lecture, 0 deadlines, 1 exam/)).toBeInTheDocument();
  });

  it("counts lectures from timetable source without a title", () => {
    useSemesterData.mockReturnValue({
      deadlines: [],
      events: [{ start_time: "2026-03-03T09:00:00.000Z", title: "", source: "timetable" }],
      loading: false,
    });

    render(<SemesterOverviewWidget numWeeks={1} semesterStart="2026-03-02" />);
    expect(screen.getByTitle(/W1: 1 lecture, 0 deadlines, 0 exams/)).toBeInTheDocument();
  });

  it("classifies tutorial and exam titles within range", () => {
    useSemesterData.mockReturnValue({
      deadlines: [],
      events: [
        { start_time: "2026-03-03T09:00:00.000Z", title: "Tutorial" },
        { start_time: "2026-03-03T11:00:00.000Z", title: "Exam review" },
      ],
      loading: false,
    });

    render(<SemesterOverviewWidget numWeeks={1} semesterStart="2026-03-02" />);
    expect(screen.getByTitle(/W1: 1 lecture, 0 deadlines, 1 exam/)).toBeInTheDocument();
  });

  it("ignores invalid dates and non-classified events", () => {
    useSemesterData.mockReturnValue({
      deadlines: [{ due_date: "invalid-date" }],
      events: [
        { start_time: "2026-03-03T10:00:00.000Z", title: "Workshop" },
        { start_time: "invalid" },
      ],
      loading: false,
    });

    render(<SemesterOverviewWidget numWeeks={1} semesterStart="2026-03-02" />);
    expect(screen.getByTitle(/W1: 0 lectures, 0 deadlines, 0 exams/)).toBeInTheDocument();
  });

  it("counts deadlines using the fallback date field", () => {
    useSemesterData.mockReturnValue({
      deadlines: [{ date: "2026-03-03T12:00:00.000Z" }],
      events: [],
      loading: false,
    });

    render(<SemesterOverviewWidget numWeeks={1} semesterStart="2026-03-02" />);
    expect(screen.getByTitle(/W1: 0 lectures, 1 deadline, 0 exams/)).toBeInTheDocument();
  });

  it("counts due_date deadlines within the week", () => {
    useSemesterData.mockReturnValue({
      deadlines: [{ due_date: "2026-03-03T12:00:00.000Z" }],
      events: [],
      loading: false,
    });

    render(<SemesterOverviewWidget numWeeks={1} semesterStart="2026-03-02" />);
    expect(screen.getByTitle(/W1: 0 lectures, 1 deadline, 0 exams/)).toBeInTheDocument();
  });

  it("ignores deadlines that fall outside the current week", () => {
    useSemesterData.mockReturnValue({
      deadlines: [{ due_date: "2026-04-03T12:00:00.000Z" }],
      events: [],
      loading: false,
    });

    render(<SemesterOverviewWidget numWeeks={1} semesterStart="2026-03-02" />);
    expect(screen.getByTitle(/W1: 0 lectures, 0 deadlines, 0 exams/)).toBeInTheDocument();
  });

  it("counts events using the date field and ignores week-end boundaries", () => {
    useSemesterData.mockReturnValue({
      deadlines: [],
      events: [
        { date: "2026-03-02T09:00:00.000Z", title: "Lecture" },
        { start_time: "2026-03-09T00:00:00.000Z", title: "Lecture" },
      ],
      loading: false,
    });

    render(<SemesterOverviewWidget numWeeks={1} semesterStart="2026-03-02" />);
    expect(screen.getByTitle(/W1: 1 lecture, 0 deadlines, 0 exams/)).toBeInTheDocument();
  });

  it("handles missing events and deadlines arrays", () => {
    useSemesterData.mockReturnValue({ deadlines: undefined, events: undefined, loading: false });
    render(<SemesterOverviewWidget numWeeks={1} semesterStart="2026-03-02" />);
    expect(screen.getByTitle(/W1: 0 lectures, 0 deadlines, 0 exams/)).toBeInTheDocument();
  });

  it("includes events on the week start boundary", () => {
    useSemesterData.mockReturnValue({
      deadlines: [],
      events: [{ start_time: "2026-03-02T00:00:00.000Z", title: "Lecture" }],
      loading: false,
    });

    render(<SemesterOverviewWidget numWeeks={1} semesterStart="2026-03-02" />);
    expect(screen.getByTitle(/W1: 1 lecture, 0 deadlines, 0 exams/)).toBeInTheDocument();
  });

  it("renders empty bars when there are no weekly counts", () => {
    useSemesterData.mockReturnValue({ deadlines: [], events: [], loading: false });
    const { container } = render(<SemesterOverviewWidget numWeeks={1} semesterStart="2026-03-02" />);
    expect(container.querySelector('[class*="barLecture"]')).toBeNull();
  });

  it("renders reading weeks, mixed classifications, and a deadline cluster warning", () => {
    useSemesterData.mockReturnValue({
      deadlines: [
        { due_date: "2026-03-16T12:00:00.000Z" },
        { due_date: "2026-03-18T12:00:00.000Z" },
        { start_due_date: "2026-03-17T12:00:00.000Z" },
      ],
      events: [
        { date: "2026-03-15T10:00:00.000Z", title: "Society social" },
        { source: "timetable", start_time: "2026-03-17T09:00:00.000Z", title: "Lab work" },
        { start_time: "2026-03-19T09:00:00.000Z", title: "Final assessment preparation" },
      ],
      loading: false,
    });

    render(
      <SemesterOverviewWidget
        numWeeks={3}
        readingWeekIndices={[1]}
        semesterLabel="Term A"
        semesterStart="2026-03-02"
      />,
    );

    expect(screen.getByText("Term A")).toBeInTheDocument();
    expect(screen.getByText("RW")).toBeInTheDocument();
    expect(screen.getByText(/Deadline cluster/i)).toBeInTheDocument();
  });

  it("uses the single-row layout variant and surfaces singular week titles", () => {
    useSemesterData.mockReturnValue({
      deadlines: [],
      events: [{ start_time: "2026-03-10T12:00:00.000Z", title: "One lecture only" }],
      loading: false,
    });

    render(<SemesterOverviewWidget numWeeks={2} row={1} semesterStart="2026-03-02" />);
    expect(screen.getByTitle(/: 1 lecture,/)).toBeInTheDocument();
  });

  it("renders reading week bars when counts are empty", () => {
    useSemesterData.mockReturnValue({ deadlines: [], events: [], loading: false });
    const { container } = render(
      <SemesterOverviewWidget numWeeks={2} readingWeekIndices={[0]} semesterStart="2026-03-02" />,
    );
    expect(container.querySelector('[class*="barReading"]')).toBeTruthy();
  });

  it("hides the cluster warning when density stays low", () => {
    useSemesterData.mockReturnValue({ deadlines: [{ due_date: "2026-03-05" }], events: [], loading: false });
    render(<SemesterOverviewWidget numWeeks={2} semesterStart="2026-03-02" />);
    expect(screen.queryByText(/Deadline cluster/)).toBeNull();
  });

  it("summarises exam load alongside clustered deadlines", () => {
    useSemesterData.mockReturnValue({
      deadlines: [
        { due_date: "2026-03-09" },
        { due_date: "2026-03-10" },
        { due_date: "2026-03-16" },
        { due_date: "2026-03-17" },
      ],
      events: [{ start_time: "2026-03-16T09:00:00.000Z", title: "Exam" }],
      loading: false,
    });

    render(<SemesterOverviewWidget numWeeks={3} semesterStart="2026-03-02" />);
  expect(screen.getByText(/Deadline cluster in W\d–W\d/)).toBeInTheDocument();
    expect(screen.getByText(/4 deadlines \+ 1 exam/)).toBeInTheDocument();
  });

  it("pluralises exams in cluster summaries", () => {
    useSemesterData.mockReturnValue({
      deadlines: [{ due_date: "2026-03-09" }, { due_date: "2026-03-10" }, { due_date: "2026-03-11" }],
      events: [
        { start_time: "2026-03-09T09:00:00.000Z", title: "Exam" },
        { start_time: "2026-03-10T09:00:00.000Z", title: "Final exam" },
      ],
      loading: false,
    });

    render(<SemesterOverviewWidget numWeeks={2} semesterStart="2026-03-02" />);
    expect(screen.getByText(/3 deadlines \+ 2 exams/)).toBeInTheDocument();
  });

  it("summarises deadline-only clusters without exam labels", () => {
    useSemesterData.mockReturnValue({
      deadlines: [
        { due_date: "2026-03-02" },
        { due_date: "2026-03-03" },
        { due_date: "2026-03-09" },
        { due_date: "2026-03-10" },
      ],
      events: [],
      loading: false,
    });

    render(<SemesterOverviewWidget numWeeks={3} semesterStart="2026-03-02" />);
    const warning = screen.getByText(/Deadline cluster in/);
    const warningText = warning.parentElement?.textContent || "";
    expect(warningText).toContain("4 deadlines");
    expect(warningText).not.toContain("exam");
  });

  it("renders cluster summaries when no exams are present", () => {
    useSemesterData.mockReturnValue({
      deadlines: [{ due_date: "2026-03-02" }, { due_date: "2026-03-03" }, { due_date: "2026-03-04" }],
      events: [],
      loading: false,
    });

    render(<SemesterOverviewWidget numWeeks={1} semesterStart="2026-03-02" />);
    expect(screen.getByText(/3 deadlines/)).toBeInTheDocument();
  });

  it("summarises deadline clusters when counts exceed the max baseline", () => {
    useSemesterData.mockReturnValue({
      deadlines: [{ due_date: "2026-03-02" }, { due_date: "2026-03-03" }, { due_date: "2026-03-04" }, { due_date: "2026-03-05" }],
      events: [{ start_time: "2026-03-02T09:00:00.000Z", title: "Exam" }],
      loading: false,
    });

    render(<SemesterOverviewWidget numWeeks={1} semesterStart="2026-03-02" />);
    expect(screen.getByText(/4 deadlines \+ 1 exam/)).toBeInTheDocument();
  });

  it("summarises single-week deadline clusters without exams", () => {
    useSemesterData.mockReturnValue({
      deadlines: [{ due_date: "2026-03-02" }, { due_date: "2026-03-03" }, { due_date: "2026-03-04" }],
      events: [],
      loading: false,
    });

    render(<SemesterOverviewWidget numWeeks={1} semesterStart="2026-03-02" />);
    expect(screen.getByText(/3 deadlines/)).toBeInTheDocument();
  });

  it("renders stacked lecture, deadline, and exam bars", () => {
    useSemesterData.mockReturnValue({
      deadlines: [
        { due_date: "2026-03-02T10:00:00.000Z" },
        { due_date: "2026-03-03T12:00:00.000Z" },
      ],
      events: [
        { start_time: "2026-03-02T09:00:00.000Z", title: "Term Exam" },
        { source: "timetable", start_time: "2026-03-02T11:00:00.000Z", title: "Lecture" },
      ],
      loading: false,
    });

    const { container } = render(<SemesterOverviewWidget numWeeks={1} semesterStart="2026-03-02" />);
    expect(container.querySelector('[class*="barDeadline"]')).toBeTruthy();
    expect(container.querySelector('[class*="barExam"]')).toBeTruthy();
    expect(container.querySelector('[class*="barLecture"]')).toBeTruthy();
  });

  it("scales bar heights relative to the weekly maximum", () => {
    useSemesterData.mockReturnValue({
      deadlines: [],
      events: [
        { start_time: "2026-03-02T09:00:00.000Z", title: "Lecture" },
        { start_time: "2026-03-09T09:00:00.000Z", title: "Lecture" },
        { start_time: "2026-03-09T10:00:00.000Z", title: "Lecture" },
      ],
      loading: false,
    });

    const { container } = render(<SemesterOverviewWidget numWeeks={2} semesterStart="2026-03-02" />);
    const bars = container.querySelectorAll('[class*="barLecture"]');
    const heights = Array.from(bars).map((bar) => Number.parseFloat(bar.style.height));
    expect(heights[0]).toBeLessThan(heights[1]);
  });

  it("joins multiple cluster week labels with an en dash", () => {
    useSemesterData.mockReturnValue({
      deadlines: [
        { due_date: "2026-03-02" },
        { due_date: "2026-03-03" },
        { due_date: "2026-03-16" },
        { due_date: "2026-03-17" },
      ],
      events: [],
      loading: false,
    });

    render(<SemesterOverviewWidget numWeeks={3} semesterStart="2026-03-02" />);
    expect(screen.getByText(/W1–W3/)).toBeInTheDocument();
  });
});
