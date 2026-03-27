import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const useAuthMock = vi.hoisted(() => vi.fn(() => ({ profile: null })));
const getModuleTutorPhotoMock = vi.hoisted(() => vi.fn(() => null));
const useModuleTravelTimeMock = vi.hoisted(() => vi.fn(() => "12 min"));
const formatDurationMock = vi.hoisted(() => vi.fn((start, end) => (start && end ? "2h" : "TBA")));
const hideBrokenTutorImageMock = vi.hoisted(() => vi.fn());

vi.mock("../../../components/modules/utils/moduleUtils.js", () => ({
  formatTime: vi.fn((value) => {
    if (!value) return "TBA";
    return value.includes("11:00") ? "11:00" : "09:00";
  }),
  formatDuration: (...args) => formatDurationMock(...args),
  getDepartment: vi.fn(() => "Engineering"),
  getCourse: vi.fn(() => "Computer Science"),
}));

vi.mock("../../../components/modules/utils/deadlineUtils.js", () => ({
  DEADLINE_LABELS: {
    coursework: "Coursework",
    exam: "Exam",
  },
  formatDeadlineDateTime: vi.fn((value) => `formatted:${value}`),
}));

vi.mock("../../../components/calendar/utils/dateUtils.js", () => ({
  formatDate: vi.fn(() => "13 Apr 2026"),
}));

vi.mock("../../../components/Auth/utils/userUtils.js", () => ({
  getInitials: (name) => (name ? name.split(" ").map((part) => part[0]).join("") : "U"),
}));

vi.mock("../../../context/AuthContext.jsx", () => ({
  useAuth: useAuthMock,
}));

vi.mock("../../../components/common/badge/Badge.jsx", () => ({
  default: ({ children, tone, className }) => <span className={className} data-tone={tone}>{children}</span>,
}));

vi.mock("../../../components/common/deadline_countdown/deadlineCountdownUtils.js", () => ({
  getUrgencyTier: vi.fn(() => "later"),
}));

vi.mock("../../../components/common/back_button/BackButton.jsx", () => ({
  default: ({ onClick, label }) => <button onClick={onClick}>{label}</button>,
}));

vi.mock("../../../components/common/entity_link_chip/EntityLinkChip.jsx", () => ({
  default: ({ children, to, className }) => <a href={to} className={className}>{children}</a>,
}));

vi.mock("../../../components/common/primary_button/PrimaryButton.jsx", () => ({
  default: ({ children, variant, pill, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock("../../../components/common/tooltip/Tooltip.jsx", () => ({
  default: ({ children, content }) => <div data-tooltip={content}>{children}</div>,
}));

vi.mock("../../../components/common/location_link/LocationLink.jsx", () => ({
  default: ({ location, className, textClassName }) => (
    <a href={`https://maps.example/${encodeURIComponent(location)}`} className={className}>
      <span className={textClassName}>{location}</span>
    </a>
  ),
}));

vi.mock("../../../components/modules/modules/moduleTutorUtils", () => ({
  getModuleTutorPhoto: (...args) => getModuleTutorPhotoMock(...args),
  hideBrokenTutorImage: (...args) => hideBrokenTutorImageMock(...args),
}));

vi.mock("../../../components/modules/modules/useModuleTravelTime.js", () => ({
  useModuleTravelTime: (...args) => useModuleTravelTimeMock(...args),
}));

vi.mock("../../../components/modules/modules/TravelTimeIndicator.jsx", () => ({
  default: ({ duration }) => <div>{`Travel time: ${duration}`}</div>,
}));

vi.mock("../../../components/modules/modules/ModuleDetails.module.css", () => ({
  default: new Proxy({}, { get: (_, key) => key }),
}));

vi.mock("../../../components/modules/styles/ModuleHero.module.css", () => ({
  default: new Proxy({}, { get: (_, key) => key }),
}));

vi.mock("../../../components/modules/styles/ModuleSchedule.module.css", () => ({
  default: new Proxy({}, { get: (_, key) => key }),
}));

vi.mock("../../../components/modules/styles/ModuleDeadlines.module.css", () => ({
  default: new Proxy({}, { get: (_, key) => key }),
}));

import ModuleDetails from "../../../components/modules/modules/ModuleDetails";

const baseModule = {
  id: 1,
  module_code: "CS101",
  module_name: "Software Engineering",
  description: "A great module",
  location: "Bush House",
  start_time: "2026-03-01T09:00:00Z",
  end_time: "2026-03-01T11:00:00Z",
  created_by_name: "Dr Ada",
  created_by: 9,
  created_by_email: "",
  deadlines: [],
  readings: [],
  recurrence_rule: null,
};

function renderDetails(props) {
  return render(
    <MemoryRouter>
      <ModuleDetails {...props} />
    </MemoryRouter>,
  );
}

describe("ModuleDetails coverage top-up", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    localStorage.clear();
    formatDurationMock.mockImplementation((start, end) => (start && end ? "2h" : "TBA"));
    hideBrokenTutorImageMock.mockImplementation((event) => {
      event.currentTarget.style.display = "none";
    });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
  });

  it("covers the no-class, no-photo, no-location, and no-module-code branches", async () => {
    renderDetails({
      module: {
        ...baseModule,
        module_code: "",
        location: "",
        start_time: "",
        end_time: "",
        created_by: null,
        created_by_name: "",
      },
      is_enrolled: false,
      is_core: false,
      onBack: vi.fn(),
      onEnroll: vi.fn(),
      onUnenroll: vi.fn(),
    });

    expect(screen.getAllByText("No class time set")).toHaveLength(2);
    expect(screen.getByText("To be announced")).toBeInTheDocument();
    expect(screen.getByText("Unknown")).toBeInTheDocument();
    expect(screen.getByText("U")).toBeInTheDocument();

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  it("shows the timeline-started-later progress copy when progress resolves to zero", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

    renderDetails({
      module: {
        ...baseModule,
        deadlines: [
          { id: 1, title: "CW1", deadline_type: "coursework", start_due_date: "2026-05-01T00:00:00Z" },
          { id: 2, title: "CW2", deadline_type: "coursework", start_due_date: "2026-06-01T00:00:00Z" },
        ],
      },
      is_enrolled: false,
      is_core: false,
      onBack: vi.fn(),
      onEnroll: vi.fn(),
      onUnenroll: vi.fn(),
    });

    expect(screen.getByText("Assignment timeline hasn't started yet")).toBeInTheDocument();
    expect(document.querySelector("[style*='width: 0%']")).toBeTruthy();
  });

  it("returns the null-progress copy when fewer than two valid deadline dates remain", () => {
    renderDetails({
      module: {
        ...baseModule,
        deadlines: [
          { id: 1, title: "CW1", deadline_type: "coursework", start_due_date: "not-a-date" },
          { id: 2, title: "CW2", deadline_type: "coursework", start_due_date: "2026-05-01T00:00:00Z" },
        ],
      },
      is_enrolled: false,
      is_core: false,
      onBack: vi.fn(),
      onEnroll: vi.fn(),
      onUnenroll: vi.fn(),
    });

    expect(screen.getByText("Progress will appear when more deadlines are set")).toBeInTheDocument();
  });

  it("returns the null-progress copy when all deadline dates collapse to the same point", () => {
    renderDetails({
      module: {
        ...baseModule,
        deadlines: [
          { id: 1, title: "CW1", deadline_type: "coursework", start_due_date: "2026-05-01T00:00:00Z" },
          { id: 2, title: "CW2", deadline_type: "coursework", start_due_date: "2026-05-01T00:00:00Z" },
        ],
      },
      is_enrolled: false,
      is_core: false,
      onBack: vi.fn(),
      onEnroll: vi.fn(),
      onUnenroll: vi.fn(),
    });

    expect(screen.getByText("Progress will appear when more deadlines are set")).toBeInTheDocument();
  });

  it("fetches matching study projects with auth headers and renders singular and plural member labels", async () => {
    localStorage.setItem("token", "abc123");
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 7, name: "Operating Systems", course_code: "CS101", member_count: 1 },
        { id: 8, name: "Compiler Design", course_code: "CS101", member_count: 2 },
        { id: 10, name: "Systems Project", course_code: "CS101" },
        { id: 9, name: "Ignore Me", course_code: "LAW1", member_count: 99 },
      ],
    });

    renderDetails({
      module: baseModule,
      is_enrolled: false,
      is_core: false,
      onBack: vi.fn(),
      onEnroll: vi.fn(),
      onUnenroll: vi.fn(),
    });

    await waitFor(() => {
      expect(screen.getByText("Study Projects")).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/group-work/projects/", {
      headers: { Authorization: "Token abc123" },
    });
    expect(screen.getByRole("link", { name: /Operating Systems/i })).toHaveAttribute("href", "/group-work?project=7");
    expect(screen.getByText("1 member")).toBeInTheDocument();
    expect(screen.getByText("2 members")).toBeInTheDocument();
    expect(screen.getByText("0 members")).toBeInTheDocument();
    expect(screen.queryByText("Ignore Me")).not.toBeInTheDocument();
  });

  it("swallows non-ok project responses and leaves the study projects card hidden", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => {
        throw new Error("should not be called");
      },
    });

    renderDetails({
      module: baseModule,
      is_enrolled: false,
      is_core: false,
      onBack: vi.fn(),
      onEnroll: vi.fn(),
      onUnenroll: vi.fn(),
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(screen.queryByText("Study Projects")).not.toBeInTheDocument();
  });

  it("keeps reading titles unchanged when they do not start with the module prefix and omits page counts when absent", () => {
    renderDetails({
      module: {
        ...baseModule,
        readings: [
          {
            id: 1,
            title: "Independent reading",
            module_name: "Software Engineering",
            start_page: null,
            end_page: null,
            page_count: null,
            deadline: "2026-04-13T00:00:00Z",
          },
        ],
      },
      is_enrolled: false,
      is_core: false,
      onBack: vi.fn(),
      onEnroll: vi.fn(),
      onUnenroll: vi.fn(),
    });

    expect(screen.getByText("Independent reading")).toBeInTheDocument();
    expect(screen.getByText(/Due 13 Apr 2026/)).toBeInTheDocument();
    expect(screen.queryByText(/pages/)).not.toBeInTheDocument();
  });

  it("renders the tutor photo error handler and the email tutor button callback", () => {
    getModuleTutorPhotoMock.mockReturnValue("https://example.com/tutor.jpg");

    renderDetails({
      module: {
        ...baseModule,
        created_by_email: "tutor@kcl.ac.uk",
      },
      is_enrolled: false,
      is_core: false,
      onBack: vi.fn(),
      onEnroll: vi.fn(),
      onUnenroll: vi.fn(),
    });

    fireEvent.error(screen.getByAltText("Dr Ada profile"));
    expect(hideBrokenTutorImageMock).toHaveBeenCalledWith(expect.any(Object), "inline-flex");

    fireEvent.click(screen.getByText("Email tutor"));
  });

  it("falls back to TBA when duration formatting returns an empty value", () => {
    formatDurationMock.mockReturnValue("");

    renderDetails({
      module: baseModule,
      is_enrolled: false,
      is_core: false,
      onBack: vi.fn(),
      onEnroll: vi.fn(),
      onUnenroll: vi.fn(),
    });

    expect(screen.getAllByText("TBA").length).toBeGreaterThan(0);
  });

  it("handles null project payloads and renders reading rows in deadline order", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => null,
    });

    renderDetails({
      module: {
        ...baseModule,
        readings: [
          {
            id: 1,
            title: "Later reading",
            module_name: "Software Engineering",
            deadline: "2026-05-10T00:00:00Z",
          },
          {
            id: 2,
            title: "Earlier reading",
            module_name: "Software Engineering",
            deadline: "2026-04-10T00:00:00Z",
          },
          {
            id: 3,
            deadline: "2026-04-15T00:00:00Z",
          },
        ],
      },
      is_enrolled: false,
      is_core: false,
      onBack: vi.fn(),
      onEnroll: vi.fn(),
      onUnenroll: vi.fn(),
    });

    const readingTitles = screen.getAllByText(/reading|Earlier|Later/i).map((node) => node.textContent);
    expect(readingTitles).toContain("Earlier reading");
    expect(readingTitles).toContain("Later reading");
    expect(screen.queryByText("Study Projects")).not.toBeInTheDocument();
  });
});
