import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import GroupProjectDetail from "../../../pages/GroupWork/GroupWorkDetail";
import MemberAvatar from "../../../pages/GroupWork/components/MemberAvatar";
import MemberFilter from "../../../pages/GroupWork/components/MemberFilter";
import MembersSection from "../../../pages/GroupWork/components/MembersSection";
import GroupWorkStats from "../../../pages/GroupWork/components/GroupWorkStats";
import TabsSection from "../../../pages/GroupWork/components/TabsSection";

const useProjectDetailMock = vi.fn();
const openMemberProfileMock = vi.fn();
const getVisibleMembersMock = vi.fn((members) => members);
const useCountUpMock = vi.fn(() => ({ current: null }));

vi.mock("../../../pages/GroupWork/hooks/groupWorkHooks", () => ({
  useProjectDetail: (...args) => useProjectDetailMock(...args),
}));

vi.mock("../../../pages/GroupWork/utils/projectRowUtils", () => ({
  getVisibleMembers: (...args) => getVisibleMembersMock(...args),
}));

vi.mock("../../../pages/GroupWork/utils/memberAvatarUtils", () => ({
  getDisplayName: vi.fn((member) => member.name || member.username || "Unknown"),
  getInitials: vi.fn((member) => (member.name || member.username || "U").slice(0, 2).toUpperCase()),
  getPhotoUrl: vi.fn((member) => member.profile_photo_url || ""),
  openMemberProfile: (...args) => openMemberProfileMock(...args),
}));

vi.mock("../../../pages/GroupWork/utils/priorityUtils", () => ({
  getUserColor: vi.fn(() => "#123456"),
}));

vi.mock("../../../hooks/useCountUp", () => ({
  useCountUp: (...args) => useCountUpMock(...args),
}));

vi.mock("../../../pages/GroupWork/utils/projectStatsUtils", () => ({
  getNextDeadline: vi.fn(() => ({ project: { name: "Alpha" }, days: 4 })),
  getProgressStats: vi.fn(() => ({ percent: 50 })),
}));

vi.mock("../../../components/common/AppPage/AppPage", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock("../../../components/common/EmptyState/EmptyState", () => ({
  default: ({ title, description }) => <div>{title} {description}</div>,
}));

vi.mock("../../../pages/GroupWork/components/GroupWorkDetailSkeleton", () => ({
  default: ({ onBack }) => <button onClick={onBack}>Skeleton back</button>,
}));

vi.mock("../../../pages/GroupWork/components/ProjectHeader", () => ({
  default: ({ project }) => <div>Header: {project.name}</div>,
}));

vi.mock("../../../pages/GroupWork/components/ProjectProgress", () => ({
  default: ({ taskStats }) => <div>Progress: {taskStats.percent}</div>,
}));

vi.mock("../../../components/common/BackButton/BackButton.jsx", () => ({
  default: ({ onClick, label }) => <button onClick={onClick}>{label}</button>,
}));

vi.mock("../../../components/Pagination/Pagination", () => ({
  BackToTop: () => <div>Back to top</div>,
}));

vi.mock("../../../components/common/StatStrip/StatStrip", () => ({
  default: ({ items }) => <div>{items.map((item) => `${item.label}:${item.value}`).join("|")}</div>,
}));

vi.mock("../../../components/common/FilterButton/FilterButton", () => ({
  default: ({ activeCount, onClick }) => <button onClick={onClick}>Filter {activeCount}</button>,
}));

vi.mock("../../../components/common/hooks/useClickOutside", () => ({
  useClickOutside: vi.fn(),
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

vi.mock("../../../components/common/Tabs/Tabs", () => ({
  default: ({ tabs, activeTab, onTabChange }) => (
    <div>
      <div>Active: {activeTab}</div>
      {tabs.map((tab) => <button key={tab.id} onClick={() => onTabChange(tab.id)}>{tab.label}</button>)}
      <div>{tabs.find((tab) => tab.id === activeTab)?.content}</div>
    </div>
  ),
}));

vi.mock("../../../pages/GroupWork/GroupTasksTab", () => ({
  default: ({ projectId }) => <div>Tasks tab {projectId}</div>,
}));

vi.mock("../../../pages/GroupWork/AvailabilityTab", () => ({
  default: ({ projectId }) => <div>Availability tab {projectId}</div>,
}));

describe("GroupWork extra components", () => {
  it("renders detail loading, missing, and loaded states", () => {
    const onBack = vi.fn();

    useProjectDetailMock.mockReturnValueOnce({ loading: true });
    const { rerender } = render(<GroupProjectDetail projectId={7} onBack={onBack} />);
    expect(screen.getByText("Skeleton back")).toBeInTheDocument();

    useProjectDetailMock.mockReturnValueOnce({ loading: false, project: null });
    rerender(<GroupProjectDetail projectId={7} onBack={onBack} />);
    expect(screen.getByText(/This group project isn’t available right now./)).toBeInTheDocument();

    useProjectDetailMock.mockReturnValueOnce({
      loading: false,
      project: { name: "Alpha" },
      members: [{ id: 1, name: "Alex" }],
      onAdded: vi.fn(),
      handleRemoveMember: vi.fn(),
      handleDeleteProject: vi.fn(),
      activeTab: "tasks",
      setActiveTab: vi.fn(),
      setTaskStats: vi.fn(),
      taskStats: { percent: 25 },
    });
    rerender(<GroupProjectDetail projectId={7} onBack={onBack} />);
    expect(screen.getByText("Header: Alpha")).toBeInTheDocument();
    expect(screen.getByText("Back to top")).toBeInTheDocument();
  });

  it("renders member avatar states, filter interactions, members section, stats, and tabs", () => {
    render(
      <>
        <MemberAvatar member={{ id: 1, name: "Alex", profile_photo_url: "https://example.com/a.jpg" }} />
        <MemberAvatar member={{ id: 2, user: 2, name: "Bea" }} size={30} />
      </>
    );
    expect(screen.getByAltText("Alex")).toBeInTheDocument();
    expect(screen.getByText("BE")).toBeInTheDocument();

    const onToggle = vi.fn();
    render(<MemberFilter members={[{ id: 1, user: 1, name: "Alex" }]} selectedUsers={[]} onToggle={onToggle} />);
    fireEvent.mouseEnter(screen.getByText("Filter 0").parentElement);
    fireEvent.click(screen.getByText("Alex"));
    expect(onToggle).toHaveBeenCalledWith("1");

    const onRemove = vi.fn();
    render(
      <>
        <MembersSection
          members={[
            { id: 1, name: "Owner", role: "owner" },
            { id: 2, name: "Member", role: "member" },
          ]}
          onRemove={onRemove}
          canRemove={true}
          allowOwnerRemove={true}
        />
        <MembersSection members={[]} onRemove={onRemove} />
        <GroupWorkStats projects={[{ name: "Alpha", task_count: 2, completed_task_count: 1 }]} />
        <TabsSection activeTab="tasks" setActiveTab={vi.fn()} projectId={9} members={[]} onStatsUpdate={vi.fn()} taskStats={{ percent: 33 }} />
      </>
    );

    fireEvent.click(screen.getByLabelText("Open Owner profile"));
    fireEvent.click(screen.getByText("Leave project"));
    fireEvent.click(screen.getByText("Remove"));
    expect(openMemberProfileMock).toHaveBeenCalled();
    expect(onRemove).toHaveBeenCalledWith(1);
    expect(onRemove).toHaveBeenCalledWith(2);
    expect(screen.getByText(/No teammates added yet/)).toBeInTheDocument();
    expect(screen.getByText(/Active projects:1/)).toBeInTheDocument();
    expect(screen.getByText("Tasks tab 9")).toBeInTheDocument();
  });
});
