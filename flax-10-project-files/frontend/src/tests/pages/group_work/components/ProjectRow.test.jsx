import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProjectRow from "@/pages/group_work/components/ProjectRow";
import { AuthContext } from "@/context/AuthContext";
import * as rowUtils from "@/pages/group_work/utils/projectRowUtils";
import styles from "@/pages/group_work/components/ProjectRow.module.css";

vi.mock("@/components/common/deadline_countdown/DeadlineCountdown", () => ({
  default: () => <div data-testid="countdown">Countdown</div>,
}));

vi.mock("@/pages/group_work/components/ProjectRowInfo", () => ({
  default: ({ isOwner }) => <div data-testid="row-info">Owner: {String(isOwner)}</div>,
  ProjectModuleBadge: () => <div data-testid="module-badge">Module</div>,
}));

vi.mock("@/pages/group_work/components/ProjectRowAccordion", () => ({
  default: ({ percent }) => <div data-testid="accordion">Progress: {percent}%</div>,
}));

vi.mock("@/pages/group_work/utils/projectRowUtils", () => ({
  getProjectDate: vi.fn(),
  getProjectMembers: vi.fn(() => []),
  getProjectMemberCount: vi.fn(() => 0),
  getDaysLeft: vi.fn(),
  getProjectPercent: vi.fn(() => 0),
}));

describe("ProjectRow", () => {
  const onClick = vi.fn();
  const project = { id: 1, name: "Test Project", members: [{ user: "u1", role: "owner" }] };
  const mockAuth = { profile: { id: "u1" } };

  beforeEach(() => {
    vi.clearAllMocks();
    rowUtils.getDaysLeft.mockReturnValue(10);
    rowUtils.getProjectPercent.mockReturnValue(50);
  });

  const renderRow = (p = project, auth = mockAuth) => {
    return render(
      <AuthContext.Provider value={auth}>
        <ProjectRow project={p} onClick={onClick} />
      </AuthContext.Provider>
    );
  };

  it("renders standard project and handles click", () => {
    renderRow();
    expect(screen.getByText("Owner: true")).toBeTruthy();
    expect(screen.getByText("Progress: 50%")).toBeTruthy();
    
    const article = screen.getByRole("button");
    fireEvent.click(article);
    expect(onClick).toHaveBeenCalled();
  });

  it("handles keyboard interaction (Enter and Space)", () => {
    renderRow();
    const article = screen.getByRole("button");
    
    fireEvent.keyDown(article, { key: "Enter" });
    expect(onClick).toHaveBeenCalledTimes(1);
    
    fireEvent.keyDown(article, { key: " " });
    expect(onClick).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(article, { key: "Tab" }); // should not trigger
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("does nothing on keyboard interaction if onClick is missing", () => {
    // Hits line 44: && onClick branch
    render(
      <AuthContext.Provider value={mockAuth}>
        <ProjectRow project={project} onClick={null} />
      </AuthContext.Provider>
    );
    const article = screen.getByRole("button");
    fireEvent.keyDown(article, { key: "Enter" });
    fireEvent.keyDown(article, { key: " " });
    // No error, just hits the branch
  });

  it("applies urgent class when days left <= 7", () => {
    rowUtils.getDaysLeft.mockReturnValue(3);
    const { container } = renderRow();
    expect(container.firstChild).toHaveClass(styles.projectRowContainerUrgent);
  });

  it("applies overdue class when days left < 0", () => {
    rowUtils.getDaysLeft.mockReturnValue(-1);
    const { container } = renderRow();
    expect(container.firstChild).toHaveClass(styles.projectRowContainerOverdue);
  });

  it("handles case where user is not owner", () => {
    renderRow(project, { profile: { id: "u2" } });
    expect(screen.getByText("Owner: false")).toBeTruthy();
  });

  it("handles empty auth or profile", () => {
    renderRow(project, null);
    expect(screen.getByText("Owner: false")).toBeTruthy();
  });

  it("handles auth.user.id fallback when profile is missing", () => {
    // Hits line 21: auth?.profile?.id ?? auth?.user?.id;
    renderRow(project, { user: { id: "u1" } });
    expect(screen.getByText("Owner: true")).toBeTruthy();
  });

  it("hits the normal class name branch when not urgent or overdue", () => {
    // Hits line 122: styles.projectRowContainer
    rowUtils.getDaysLeft.mockReturnValue(30);
    const { container } = renderRow();
    expect(container.firstChild).toHaveClass(styles.projectRowContainer);
    expect(container.firstChild).not.toHaveClass(styles.projectRowContainerUrgent);
    expect(container.firstChild).not.toHaveClass(styles.projectRowContainerOverdue);
  });

  it("handles getProjectRowData with missing deadline", () => {
    // Hits line 110: getProjectDate(project.deadline)
    renderRow({ ...project, deadline: null });
    expect(screen.getByTestId("countdown")).toBeTruthy();
  });
});
