import { it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/pages/group_work/components/ProjectRowInfo", () => ({
  default: ({ project, isOwner }) => (
    <div data-testid="row-info" data-is-owner={String(isOwner)}>{project.name}</div>
  ),
  ProjectModuleBadge: ({ project }) => <div data-testid="module-badge">{project.code}</div>,
}));

vi.mock("@/pages/group_work/components/ProjectRowAccordion", () => ({
  default: ({ percent }) => <div data-testid="row-accordion">{percent}</div>,
}));

vi.mock("@/components/common/deadline_countdown/DeadlineCountdown", () => ({
  default: () => <div data-testid="deadline-countdown" />,
}));

const getProjectDateMock = vi.fn(() => null);
const getDaysLeftMock = vi.fn(() => null);

vi.mock("@/pages/group_work/utils/projectRowUtils", () => ({
  getProjectDate: (...args) => getProjectDateMock(...args),
  getProjectMembers: vi.fn(() => []),
  getProjectMemberCount: vi.fn(() => 0),
  getDaysLeft: (...args) => getDaysLeftMock(...args),
  getProjectPercent: vi.fn(() => 50),
}));

vi.mock("@/context/AuthContext", async () => {
  const { createContext } = await import("react");
  return { AuthContext: createContext({ profile: { id: 1 } }) };
});

import ProjectRow from "@/pages/group_work/components/ProjectRow";
import { AuthContext } from "@/context/AuthContext";

const renderRow = (project = {}, onClick = vi.fn(), userId = 1) =>
  render(
    <AuthContext.Provider value={{ profile: { id: userId } }}>
      <ProjectRow project={{ id: 1, name: "P", members: [], ...project }} onClick={onClick} />
    </AuthContext.Provider>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  getProjectDateMock.mockReturnValue(null);
  getDaysLeftMock.mockReturnValue(null);
});

it("renders project row info", () => {
  renderRow();
  expect(screen.getByTestId("row-info")).toBeTruthy();
});

it("renders accordion", () => {
  renderRow();
  expect(screen.getByTestId("row-accordion")).toBeTruthy();
});

it("calls onClick when row is clicked", () => {
  const onClick = vi.fn();
  renderRow({}, onClick);
  fireEvent.click(screen.getByRole("button"));
  expect(onClick).toHaveBeenCalled();
});

it("calls onClick on Enter keydown", () => {
  const onClick = vi.fn();
  renderRow({}, onClick);
  fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });
  expect(onClick).toHaveBeenCalled();
});

it("calls onClick on Space keydown", () => {
  const onClick = vi.fn();
  renderRow({}, onClick);
  fireEvent.keyDown(screen.getByRole("button"), { key: " " });
  expect(onClick).toHaveBeenCalled();
});

it("does not call onClick on irrelevant keydown", () => {
  const onClick = vi.fn();
  renderRow({}, onClick);
  fireEvent.keyDown(screen.getByRole("button"), { key: "Tab" });
  expect(onClick).not.toHaveBeenCalled();
});

it("applies urgent styling when daysLeft is within 7", () => {
  getDaysLeftMock.mockReturnValue(3);
  const { container } = renderRow();
  expect(container.querySelector("article").className).toContain("Urgent");
});

it("applies overdue styling when daysLeft is negative", () => {
  getDaysLeftMock.mockReturnValue(-2);
  const { container } = renderRow();
  expect(container.querySelector("article").className).toContain("Overdue");
});

it("passes isOwner=true when current user is an owner member", () => {
  renderRow({ members: [{ user: 1, role: "owner" }] });
  expect(screen.getByTestId("row-info").dataset.isOwner).toBe("true");
});

it("passes isOwner=false when current user is not an owner", () => {
  renderRow({ members: [{ user: 2, role: "owner" }] });
  expect(screen.getByTestId("row-info").dataset.isOwner).toBe("false");
});
