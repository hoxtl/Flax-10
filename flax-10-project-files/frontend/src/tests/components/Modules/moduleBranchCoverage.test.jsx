import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const isEnrolledInMock = vi.fn();
const formatDurationMock = vi.fn(() => "1h");
const formatTimeMock = vi.fn(() => "09:00");
const getDepartmentMock = vi.fn(() => "Law");
const getCourseMock = vi.fn(() => "LLB");
const normaliseModuleCodeMock = vi.fn((code) => String(code || "").toUpperCase());

vi.mock("../../../components/Modules/utils/moduleUtils.js", () => ({
  isEnrolledIn: (...args) => isEnrolledInMock(...args),
  formatDuration: (...args) => formatDurationMock(...args),
  formatTime: (...args) => formatTimeMock(...args),
  getDepartment: (...args) => getDepartmentMock(...args),
  getCourse: (...args) => getCourseMock(...args),
  normaliseModuleCode: (...args) => normaliseModuleCodeMock(...args),
}));

vi.mock("../../../components/Authentication/utils/userUtils.js", () => ({
  getInitials: (name) => (name ? name.split(" ").map((part) => part[0]).join("") : "T"),
}));

vi.mock("../../../components/Modules/Modules/moduleTutorUtils", () => ({
  getModuleTutorPhoto: () => "https://example.com/tutor.jpg",
  hideBrokenTutorImage: (event) => {
    event.currentTarget.style.display = "none";
  },
}));

vi.mock("../../../components/common/Card/GridCard", () => ({
  default: ({ children, onClick, className, style }) => (
    <div role="button" tabIndex={0} onClick={onClick} className={className} style={style}>
      {children}
    </div>
  ),
}));

vi.mock("../../../components/common/PrimaryButton/PrimaryButton", () => ({
  default: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock("../../../components/common/EntityLinkChip/EntityLinkChip.jsx", () => ({
  default: ({ children, to }) => <a href={to}>{children}</a>,
}));

vi.mock("../../../components/Calendar/utils/dateUtils", () => ({
  formatDate: () => "13 Apr 2026",
}));

vi.mock("../../../components/Modules/shared/moduleCardActions", () => ({
  ModuleItemCardActions: ({ onEdit, onDelete }) => (
    <div>
      <button onClick={onEdit}>Edit reading</button>
      <button onClick={onDelete}>Delete reading</button>
    </div>
  ),
  ModuleItemDeleteDialog: ({ onConfirm, onCancel }) => (
    <div>
      <button onClick={onConfirm}>Confirm reading delete</button>
      <button onClick={onCancel}>Cancel reading delete</button>
    </div>
  ),
}));

vi.mock("../../../components/Modules/Modules/ModulesCard.module.css", () => ({ default: new Proxy({}, { get: (_, key) => key }) }));
vi.mock("../../../components/Modules/Deadlines/DeadlineCard.module.css", () => ({ default: new Proxy({}, { get: (_, key) => key }) }));

import ModulesCard from "../../../components/Modules/Modules/ModulesCard";
import ReadingCard from "../../../components/Modules/Readings/ReadingCard";

describe("module card branch coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isEnrolledInMock.mockReturnValue(false);
  });

  it("renders fallback schedule, classmates, tutor photo, and assignment counts", () => {
    render(
      <ModulesCard
        module={{
          id: 1,
          module_code: "LAW101",
          module_name: "Intro Law",
          classmates_count: 1,
          assignment_count: 2,
          created_by_name: "Jane Tutor",
        }}
        enrollments={[]}
        isTeacher={false}
        onViewModule={vi.fn()}
        onEnrollmentToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onManageDeadlines={vi.fn()}
        onManageReadings={vi.fn()}
      />
    );

    expect(screen.getByText("LLB")).toBeInTheDocument();
    expect(screen.getByText("Law")).toBeInTheDocument();
    expect(screen.getByText("📅 TBA TBA")).toBeInTheDocument();
    expect(screen.getByText("📋 2 assignments")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /1 classmate/i })).toHaveAttribute("href", "/users?module=LAW101");
    expect(screen.getByAltText("Jane Tutor")).toBeInTheDocument();
  });

  it("uses taskCountsByModule fallback and allows student detail toggles", () => {
    const onViewModule = vi.fn();
    const onEnrollmentToggle = vi.fn();
    render(
      <ModulesCard
        module={{
          id: 2,
          module_code: "CS202",
          module_name: "Systems",
          start_time: "2026-04-10T09:00:00",
          end_time: "2026-04-10T11:00:00",
        }}
        enrollments={[]}
        isTeacher={false}
        onViewModule={onViewModule}
        onEnrollmentToggle={onEnrollmentToggle}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onManageDeadlines={vi.fn()}
        onManageReadings={vi.fn()}
        taskCountsByModule={{ CS202: 1 }}
      />
    );

    fireEvent.click(screen.getByText("View details"));
    fireEvent.click(screen.getByText("+ Enrol"));

    expect(onViewModule).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }));
    expect(onEnrollmentToggle).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }));
    expect(screen.getByText("📋 1 assignment")).toBeInTheDocument();
  });

  it("reading card handles missing chapter and both delete dialog paths", () => {
    const onDelete = vi.fn();
    render(
      <ReadingCard
        reading={{
          id: 3,
          title: "Handbook",
          start_page: 1,
          end_page: 10,
          page_count: 10,
          duration_minutes: 15,
          deadline: "2026-04-13T00:00:00Z",
        }}
        isTeacher
        onEdit={vi.fn()}
        onDelete={onDelete}
      />
    );

    expect(screen.queryByText(/Chapter/)).not.toBeInTheDocument();
    expect(screen.getByText("Due 13 Apr 2026")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Delete reading"));
    fireEvent.click(screen.getByText("Cancel reading delete"));
    expect(onDelete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("Delete reading"));
    fireEvent.click(screen.getByText("Confirm reading delete"));
    expect(onDelete).toHaveBeenCalled();
  });
});
