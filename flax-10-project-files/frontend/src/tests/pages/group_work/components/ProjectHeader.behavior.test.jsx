import { beforeEach, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "./__mocks__/projectHeaderHarness.jsx";
import "./__mocks__/projectHeaderMetaHarness.jsx";
import {
  getProjectDateMock,
  resetProjectHeaderHarness,
} from "./__mocks__/projectHeaderHarness.jsx";
import { getStoredViewerMock } from "./__mocks__/projectHeaderMetaHarness.jsx";
import ProjectHeader from "@/pages/group_work/components/ProjectHeader";

const makeProps = (overrides = {}) => ({
  project: { id: 1, name: "My Project", ...overrides.project },
  members: overrides.members ?? [],
  teamMembers: overrides.teamMembers ?? [],
  onMemberAdded: vi.fn(),
  onMemberRemove: vi.fn(),
  onDelete: vi.fn(),
  onUpdate: vi.fn(),
  onBack: vi.fn(),
});

const renderHeader = (overrides = {}) =>
  render(
    <MemoryRouter>
      <ProjectHeader {...makeProps(overrides)} />
    </MemoryRouter>,
  );

beforeEach(() => {
  resetProjectHeaderHarness();
});

it("renders project name as heading", () => {
  renderHeader();
  expect(screen.getByRole("heading", { name: "My Project" })).toBeTruthy();
});

it("renders back button label", () => {
  renderHeader();
  expect(screen.getByText("Back to all projects")).toBeTruthy();
});

it("renders module pill link when both course_code and module_name present", () => {
  renderHeader({ project: { id: 1, name: "P", course_code: "CS101", module_name: "SE" } });
  expect(screen.getByRole("link", { name: "Open SE module" })).toBeTruthy();
});

it("renders module pill with only course_code", () => {
  renderHeader({ project: { id: 1, name: "P", course_code: "CS101", module_name: null } });
  expect(screen.getByRole("link")).toBeTruthy();
});

it("renders module pill with only module_name", () => {
  renderHeader({ project: { id: 1, name: "P", course_code: null, module_name: "SE" } });
  expect(screen.getByRole("link", { name: /SE/ })).toBeTruthy();
});

it("omits module pill when neither course_code nor module_name", () => {
  renderHeader({ project: { id: 1, name: "P", course_code: null, module_name: null } });
  expect(screen.queryByRole("link")).toBeNull();
});

it("renders DeadlineCountdown when project date is present", () => {
  getProjectDateMock.mockReturnValue(new Date("2026-06-01"));
  renderHeader({ project: { id: 1, name: "P", deadline: "2026-06-01" } });
  expect(screen.getByTestId("deadline-countdown")).toBeTruthy();
});

it("omits DeadlineCountdown when project date is null", () => {
  getProjectDateMock.mockReturnValue(null);
  renderHeader({ project: { id: 1, name: "P", deadline: null } });
  expect(screen.queryByTestId("deadline-countdown")).toBeNull();
});

it("passes isOwner=true when viewer matches an owner in teamMembers", () => {
  getStoredViewerMock.mockReturnValue({ id: 1 });
  renderHeader({ teamMembers: [{ user: 1, role: "owner" }] });
  expect(screen.getByTestId("project-header-actions").dataset.isOwner).toBe("true");
});

it("passes isOwner=false when viewer is a non-owner member", () => {
  getStoredViewerMock.mockReturnValue({ id: 2 });
  renderHeader({ teamMembers: [{ user: 1, role: "owner" }] });
  expect(screen.getByTestId("project-header-actions").dataset.isOwner).toBe("false");
});

it("passes isOwner=false when getStoredViewer returns no id", () => {
  getStoredViewerMock.mockReturnValue({ id: null, user: null });
  renderHeader({ teamMembers: [{ user: 1, role: "owner" }] });
  expect(screen.getByTestId("project-header-actions").dataset.isOwner).toBe("false");
});
