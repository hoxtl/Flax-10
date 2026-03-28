import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const isEnrolledInMock = vi.fn();
const formatDurationMock = vi.fn(() => "1h");
const formatTimeMock = vi.fn(() => "09:00");
const getDepartmentMock = vi.fn(() => "Engineering");
const getCourseMock = vi.fn(() => "Computer Science");
const normaliseModuleCodeMock = vi.fn((code) => String(code || "").toUpperCase());
const getModuleTutorPhotoMock = vi.fn();
const hideBrokenTutorImageMock = vi.fn();

vi.mock("../../../../components/modules/utils/moduleUtils.js", () => ({
  isEnrolledIn: (...args) => isEnrolledInMock(...args),
  formatDuration: (...args) => formatDurationMock(...args),
  formatTime: (...args) => formatTimeMock(...args),
  getDepartment: (...args) => getDepartmentMock(...args),
  getCourse: (...args) => getCourseMock(...args),
  normaliseModuleCode: (...args) => normaliseModuleCodeMock(...args),
}));

vi.mock("../../../../components/Auth/utils/userUtils.js", () => ({
  getInitials: (name) => (name ? name.split(" ").map((part) => part[0]).join("") : "T"),
}));

vi.mock("../../../../components/modules/modules/moduleTutorUtils", () => ({
  getModuleTutorPhoto: (...args) => getModuleTutorPhotoMock(...args),
  hideBrokenTutorImage: (...args) => hideBrokenTutorImageMock(...args),
}));

vi.mock("../../../../components/common/card/GridCard", () => ({
  default: ({ children, onClick, className, style }) => (
    <div data-testid="grid-card" role="button" tabIndex={0} onClick={onClick} className={className} style={style}>
      {children}
    </div>
  ),
}));

vi.mock("../../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, pill, variant, size, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock("../../../../components/common/entity_link_chip/EntityLinkChip.jsx", () => ({
  default: ({ children, to, className, title }) => <a href={to} className={className} title={title}>{children}</a>,
}));

vi.mock("../../../../components/common/tooltip/Tooltip", () => ({
  default: ({ children, content }) => <div data-tooltip={content}>{children}</div>,
}));

vi.mock("../../../../components/modules/modules/ModulesCard.module.css", () => ({
  default: new Proxy({}, { get: (_, key) => key }),
}));

import ModulesCard from "../../../../components/modules/modules/ModulesCard";

const baseProps = {
  module: {
    id: 1,
    module_code: "CS101",
    module_name: "Software Engineering",
    created_by_name: "Jane Tutor",
    description: "Intro module",
    start_time: "2026-03-01T09:00:00Z",
    end_time: "2026-03-01T10:00:00Z",
  },
  enrollments: [],
  isTeacher: false,
  onViewModule: vi.fn(),
  onEnrollmentToggle: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onManageDeadlines: vi.fn(),
  onManageReadings: vi.fn(),
};

describe("ModulesCard coverage top-up", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isEnrolledInMock.mockReturnValue(false);
    getModuleTutorPhotoMock.mockReturnValue(null);
  });

  it("shows initials fallback when there is no tutor photo and leaves the enrolled badge hidden", () => {
    render(<ModulesCard {...baseProps} />);

    expect(screen.queryByAltText(/profile/i)).not.toBeInTheDocument();
    expect(screen.getByText("JT")).toBeInTheDocument();
    expect(screen.queryByText("✓ Enrolled")).not.toBeInTheDocument();
  });

  it("renders classmates links with a blank module code fallback and pluralises member counts", () => {
    render(
      <ModulesCard
        {...baseProps}
        module={{
          ...baseProps.module,
          module_code: "",
          classmates_count: 2,
        }}
      />,
    );

    expect(screen.getByRole("link", { name: /2 classmates/i })).toHaveAttribute("href", "/users?module=");
  });

  it("keeps the classmates link singular for a single classmate", () => {
    render(
      <ModulesCard
        {...baseProps}
        module={{
          ...baseProps.module,
          classmates_count: 1,
        }}
      />,
    );

    expect(screen.getByRole("link", { name: /1 classmate/i })).toHaveAttribute("href", "/users?module=CS101");
  });

  it("shows the non-core enrolled badge and leaves through the student action", () => {
    const onEnrollmentToggle = vi.fn();
    isEnrolledInMock.mockReturnValue(true);

    render(
      <ModulesCard
        {...baseProps}
        enrollments={[{ module: 1, is_core: false }]}
        onEnrollmentToggle={onEnrollmentToggle}
      />,
    );

    expect(screen.getByText("✓ Enrolled")).toBeInTheDocument();
    fireEvent.click(screen.getByText("× Leave Module"));
    expect(onEnrollmentToggle).toHaveBeenCalled();
  });

  it("renders the disabled core leave button with its tooltip", () => {
    isEnrolledInMock.mockReturnValue(true);

    render(
      <ModulesCard
        {...baseProps}
        enrollments={[{ module: 1, is_core: true }]}
      />,
    );

    expect(screen.getByText("📌 Core")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "× Leave Module" })).toBeDisabled();
    expect(screen.getByText("× Leave Module").closest("[data-tooltip]")).toHaveAttribute(
      "data-tooltip",
      "Cannot leave a core course module",
    );
  });
});
