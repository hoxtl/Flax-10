import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import PhotoWidget from "../../../pages/Homepage/components/PhotoWidget";
import SemesterOverviewWidget from "../../../pages/Homepage/components/SemesterOverviewWidget";
import WeeklyGoalWidget from "../../../pages/Homepage/components/WeeklyGoalWidget";

const useSemesterData = vi.fn();
const useSemesterRange = vi.fn();

vi.mock("lucide-react", () => ({
  CalendarDays: () => <svg aria-hidden="true" />,
  ImageIcon: () => <svg aria-hidden="true" />,
  Target: () => <svg aria-hidden="true" />,
  Upload: () => <svg aria-hidden="true" />,
}));

vi.mock("../../../pages/Homepage/components/useSemesterOverviewData", () => ({
  useSemesterData: (...args) => useSemesterData(...args),
  useSemesterRange: (...args) => useSemesterRange(...args),
}));

describe("Homepage widget extras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("uploads and previews a homepage photo", async () => {
    vi.stubGlobal("FileReader", class { readAsDataURL() { this.onload?.({ target: { result: "data:abc" } }); } });
    const { container } = render(<PhotoWidget editMode />);
    fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [new File(["x"], "p.png")] } });
    await waitFor(() => expect(screen.getByAltText("Your photo")).toHaveAttribute("src", "data:abc"));
    expect(localStorage.getItem("homepage_photo_src")).toBe("data:abc");
  });

  it("adds and persists a photo caption", () => {
    localStorage.setItem("homepage_photo_src", "data:abc");
    render(<PhotoWidget editMode />);
    fireEvent.click(screen.getByText("+ Caption"));
    fireEvent.change(screen.getByPlaceholderText(/caption/i), { target: { value: "Sunset" } });
    fireEvent.blur(screen.getByPlaceholderText(/caption/i));
    expect(localStorage.getItem("homepage_photo_caption")).toBe("Sunset");
  });

  it("removes the homepage photo and caption", () => {
    localStorage.setItem("homepage_photo_src", "data:abc");
    localStorage.setItem("homepage_photo_caption", "S");
    render(<PhotoWidget editMode />);
    fireEvent.click(screen.getByText("Remove"));
    expect(localStorage.getItem("homepage_photo_src")).toBeNull();
    expect(localStorage.getItem("homepage_photo_caption")).toBeNull();
  });

  it("calculates weekly progress and saves an edited goal", () => {
    vi.setSystemTime(new Date("2026-03-25T12:00:00.000Z"));
    localStorage.setItem("weeklyStudyGoalHours", "8");
    localStorage.setItem("pomodoroSessions", JSON.stringify([
      { endedAt: "2026-03-24T10:00:00.000Z", durationMins: 120 },
      { endedAt: "2026-03-10T10:00:00.000Z", durationMins: 180 },
    ]));

    render(<WeeklyGoalWidget />);
    expect(screen.getByText("8h")).toBeInTheDocument();
    expect(screen.getByText("2.0h done · 6.0h left")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Click to edit goal"));
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "12" } });
    fireEvent.click(screen.getByText("Save"));
    expect(localStorage.getItem("weeklyStudyGoalHours")).toBe("12");
    expect(screen.getByText("12h")).toBeInTheDocument();
  });

  it("renders semester overview with weeks and reading week", () => {
    useSemesterRange.mockReturnValue({ now: new Date("2026-03-20T12:00:00.000Z"), semStart: new Date("2026-03-02T00:00:00.000Z"), semEnd: new Date("2026-05-25T00:00:00.000Z") });
    useSemesterData.mockReturnValue({ deadlines: [], events: [], loading: false });

    render(<SemesterOverviewWidget semesterStart="2026-03-02" numWeeks={3} readingWeekIndices={[1]} semesterLabel="Term A" />);
    
    expect(screen.getByText("Term A")).toBeInTheDocument();
    expect(screen.getByText("RW")).toBeInTheDocument();
  });

  it("surfaces deadline cluster warnings and week details", () => {
    useSemesterRange.mockReturnValue({ now: new Date("2026-03-20T12:00:00.000Z"), semStart: new Date("2026-03-02T02:00:00.000Z"), semEnd: new Date("2026-05-25T12:00:00.000Z") });
    useSemesterData.mockReturnValue({
      loading: false,
      deadlines: [{ due_date: "2026-03-16T12:00:00.000Z" }, { due_date: "2026-03-18T12:00:00.000Z" }],
      events: [{ start_time: "2026-03-17T09:00:00.000Z", title: "L1" }, { start_time: "2026-03-19T09:00:00.000Z", title: "Assessment" }],
    });

    render(<SemesterOverviewWidget semesterStart="2026-03-02" numWeeks={3} readingWeekIndices={[1]} />);
    
    expect(screen.getByText(/Deadline cluster/i)).toBeInTheDocument();
    expect(screen.getByTitle(/W3: 1 lecture, 2 deadlines, 1 exam/)).toBeInTheDocument();
  });
});
