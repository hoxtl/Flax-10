import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockUseCountUp = vi.fn();
const mockGetProgressStats = vi.fn();
const mockGetNextDeadline = vi.fn();
const mockOpenMemberProfile = vi.fn();

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => {
      const { initial, animate, transition, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
}));

vi.mock("../../../../hooks/useCountUp", () => ({
  useCountUp: (...args) => mockUseCountUp(...args),
}));

vi.mock("../../../../components/common/stat_strip/StatStrip", () => ({
  default: ({ items }) => (
    <div data-testid="stat-strip">
      {items.map((item) => `${item.label}:${item.value}${item.suffix || ""}`).join("|")}
    </div>
  ),
}));

vi.mock("../../../../components/common/tooltip/Tooltip", () => ({
  default: ({ children, content }) => <div data-tooltip={content}>{children}</div>,
}));

vi.mock("../../../../pages/group_work/utils/projectStatsUtils", () => ({
  getProgressStats: (...args) => mockGetProgressStats(...args),
  getNextDeadline: (...args) => mockGetNextDeadline(...args),
}));

vi.mock("../../../../pages/group_work/components/MemberAvatar", () => ({
  default: ({ member, size }) => <div data-testid="member-avatar">{member.name}|{size}</div>,
}));

vi.mock("../../../../pages/group_work/utils/memberAvatarUtils", () => ({
  getDisplayName: (member) => member.name,
  openMemberProfile: (...args) => mockOpenMemberProfile(...args),
}));

import GroupWorkStats from "../../../../pages/group_work/components/GroupWorkStats";
import ProjectProgress from "../../../../pages/group_work/components/ProjectProgress";
import TaskAvatarStack from "../../../../pages/group_work/components/TaskAvatarStack";

describe("GroupWork presentation low-coverage components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCountUp.mockImplementation(() => ({ current: null }));
    mockGetProgressStats.mockReturnValue({ percent: 42 });
    mockGetNextDeadline.mockReturnValue({ project: { name: "Alpha" }, days: 3 });
  });

  it("renders overview stats with deadline and progress values", () => {
    render(<GroupWorkStats projects={[{ id: 1 }, { id: 2 }]} />);
    expect(screen.getByTestId("stat-strip")).toHaveTextContent(
      "Active projects:2|Upcoming deadlines:3|Overall progress:42%",
    );
  });

  it("renders project progress stats from task stats", () => {
    render(<ProjectProgress taskStats={{ percent: 60, completed: 6, total: 10, segments: [{ id: "d", name: "D", percentage: 60 }] }} />);
    expect(screen.getByTestId("stat-strip")).toHaveTextContent("Overall:60%|Tasks complete:6|Remaining:4");
  });

  it("handles progress segment hover interactions", () => {
    render(<ProjectProgress taskStats={{ segments: [{ id: "d", name: "D", percentage: 50, color: "red" }, { id: "t", name: "T", percentage: 50 }] }} />);
    const segs = screen.getAllByLabelText(/segment/);
    expect(segs[0]).toHaveStyle({ background: "red", opacity: "1" });
    fireEvent.mouseEnter(segs[0]);
    expect(segs[1]).toHaveStyle({ opacity: "0.65" });
    fireEvent.mouseLeave(segs[0]);
    expect(segs[1]).toHaveStyle({ opacity: "1" });
  });

  it("renders avatar stacks with overflow and opens member profiles", () => {
    const assignees = [
      { id: 1, name: "Ava" },
      { id: 2, name: "Ben" },
      { id: 3, name: "Cleo" },
      { id: 4, name: "Dee" },
    ];
    const { rerender, container } = render(<TaskAvatarStack assignees={[]} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<TaskAvatarStack assignees={assignees} max={3} size={24} />);
    expect(screen.getAllByTestId("member-avatar")).toHaveLength(3);
    expect(screen.getByText("+1")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Open Ava profile" }));
    expect(mockOpenMemberProfile).toHaveBeenCalledWith(expect.any(Object), assignees[0]);
  });
});
