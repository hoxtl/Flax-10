import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const isEnrolledInMock = vi.fn();
const formatDurationMock = vi.fn(() => "1h");
const formatTimeMock = vi.fn(() => "09:00");
const getDepartmentMock = vi.fn(() => "Law");
const getCourseMock = vi.fn(() => "LLB");
const normaliseModuleCodeMock = vi.fn((code) => String(code || "").toUpperCase());

vi.mock("../../../components/modules/utils/moduleUtils.js", () => ({
  isEnrolledIn: (...args) => isEnrolledInMock(...args),
  formatDuration: (...args) => formatDurationMock(...args),
  formatTime: (...args) => formatTimeMock(...args),
  getDepartment: (...args) => getDepartmentMock(...args),
  getCourse: (...args) => getCourseMock(...args),
  normaliseModuleCode: (...args) => normaliseModuleCodeMock(...args),
}));

vi.mock("../../../components/Auth/utils/userUtils.js", () => ({
  getInitials: (name) => (name ? name.split(" ").map((part) => part[0]).join("") : "T"),
}));

vi.mock("../../../components/modules/modules/moduleTutorUtils", () => ({
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

vi.mock("../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock("../../../components/common/entity_link_chip/EntityLinkChip.jsx", () => ({
  default: ({ children, to }) => <a href={to}>{children}</a>,
}));

vi.mock("../../../components/calendar/utils/dateUtils", () => ({
  formatDate: () => "13 Apr 2026",
}));

vi.mock("../../../components/modules/shared/moduleCardActions", () => ({
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

vi.mock("../../../components/modules/modules/ModulesCard.module.css", () => ({ default: new Proxy({}, { get: (_, key) => key }) }));
vi.mock("../../../components/modules/Deadlines/DeadlineCard.module.css", () => ({ default: new Proxy({}, { get: (_, key) => key }) }));

import ModulesCard from "../../../components/modules/modules/ModulesCard";
import ReadingCard from "../../../components/modules/Readings/ReadingCard";

describe("module card branch coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isEnrolledInMock.mockReturnValue(false);
  });

  it("renders basic module information and schedule", () => {
    render(<ModulesCard module={{ id: 1, module_code: "LAW101", module_name: "Intro Law" }} enrollments={[]} isTeacher={false} onViewModule={vi.fn()} onEnrollmentToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} onManageDeadlines={vi.fn()} onManageReadings={vi.fn()} />);
    expect(screen.getByText("LLB")).toBeInTheDocument();
    expect(screen.getByText("Law")).toBeInTheDocument();
    expect(screen.getByText("📅 TBA TBA")).toBeInTheDocument();
  });

  it("renders classmate links and tutor photos", () => {
    render(<ModulesCard module={{ id: 1, module_code: "LAW101", classmates_count: 1, created_by_name: "Jane Tutor" }} enrollments={[]} isTeacher={false} onViewModule={vi.fn()} onEnrollmentToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} onManageDeadlines={vi.fn()} onManageReadings={vi.fn()} />);
    expect(screen.getByRole("link", { name: /1 classmate/i })).toHaveAttribute("href", "/users?module=LAW101");
    expect(screen.getByAltText("Jane Tutor")).toBeInTheDocument();
  });

  it("renders assignment counts", () => {
    render(<ModulesCard module={{ id: 1, assignment_count: 2 }} enrollments={[]} isTeacher={false} onViewModule={vi.fn()} onEnrollmentToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} onManageDeadlines={vi.fn()} onManageReadings={vi.fn()} />);
    expect(screen.getByText("📋 2 assignments")).toBeInTheDocument();
  });

  it("uses taskCountsByModule fallback for assignment count", () => {
    render(<ModulesCard module={{ id: 2, module_code: "CS" }} enrollments={[]} isTeacher={false} taskCountsByModule={{ CS: 1 }} onViewModule={vi.fn()} onEnrollmentToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} onManageDeadlines={vi.fn()} onManageReadings={vi.fn()} />);
    expect(screen.getByText("📋 1 assignment")).toBeInTheDocument();
  });

  it("handles module detail view and enrollment toggle", () => {
    const onViewModule = vi.fn();
    const onEnrollmentToggle = vi.fn();
    render(<ModulesCard module={{ id: 2 }} enrollments={[]} isTeacher={false} onViewModule={onViewModule} onEnrollmentToggle={onEnrollmentToggle} onEdit={vi.fn()} onDelete={vi.fn()} onManageDeadlines={vi.fn()} onManageReadings={vi.fn()} />);
    fireEvent.click(screen.getByText("View details"));
    fireEvent.click(screen.getByText("+ Enrol"));
    expect(onViewModule).toHaveBeenCalled();
    expect(onEnrollmentToggle).toHaveBeenCalled();
  });

  it("renders reading card with missing chapter logic", () => {
    render(<ReadingCard reading={{ id: 3, title: "H", start_page: 1, end_page: 10, page_count: 10, duration_minutes: 15, deadline: "2026-04-13T00:00:00Z" }} isTeacher onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByText(/Chapter/)).not.toBeInTheDocument();
    expect(screen.getByText("Due 13 Apr 2026")).toBeInTheDocument();
  });

  it("handles reading card delete cancellation", () => {
    const onDelete = vi.fn();
    render(<ReadingCard reading={{ id: 3, title: "H" }} isTeacher onEdit={vi.fn()} onDelete={onDelete} />);
    fireEvent.click(screen.getByText("Delete reading"));
    fireEvent.click(screen.getByText("Cancel reading delete"));
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("handles reading card delete confirmation", () => {
    const onDelete = vi.fn();
    render(<ReadingCard reading={{ id: 3, title: "H" }} isTeacher onEdit={vi.fn()} onDelete={onDelete} />);
    fireEvent.click(screen.getByText("Delete reading"));
    fireEvent.click(screen.getByText("Confirm reading delete"));
    expect(onDelete).toHaveBeenCalled();
  });
});
