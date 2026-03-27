import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitForElementToBeRemoved } from "@testing-library/react";

import GroupProjectDetail from "../../../pages/group_work/GroupWorkDetail";
import MemberAvatar from "../../../pages/group_work/components/MemberAvatar";
import MemberFilter from "../../../pages/group_work/components/MemberFilter";
import MembersSection from "../../../pages/group_work/components/MembersSection";
import GroupWorkStats from "../../../pages/group_work/components/GroupWorkStats";
import TabsSection from "../../../pages/group_work/components/TabsSection";

const useProjectDetailMock = vi.fn();
const openMemberProfileMock = vi.fn();
const getVisibleMembersMock = vi.fn((members) => members);
const useCountUpMock = vi.fn(() => ({ current: null }));

vi.mock("../../../pages/group_work/hooks/groupWorkHooks", () => ({
  useProjectDetail: (...args) => useProjectDetailMock(...args),
}));

vi.mock("../../../pages/group_work/utils/projectRowUtils", () => ({
  getVisibleMembers: (...args) => getVisibleMembersMock(...args),
}));

vi.mock("../../../pages/group_work/utils/memberAvatarUtils", () => ({
  getDisplayName: vi.fn((member) => member.name || member.username || "Unknown"),
  getInitials: vi.fn((member) => (member.name || member.username || "U").slice(0, 2).toUpperCase()),
  getPhotoUrl: vi.fn((member) => member.profile_photo_url || ""),
  openMemberProfile: (...args) => openMemberProfileMock(...args),
}));

vi.mock("../../../pages/group_work/utils/priorityUtils", () => ({
  getUserColor: vi.fn(() => "#123456"),
}));

vi.mock("../../../hooks/useCountUp", () => ({
  useCountUp: (...args) => useCountUpMock(...args),
}));

vi.mock("../../../pages/group_work/utils/projectStatsUtils", () => ({
  getNextDeadline: vi.fn(() => ({ project: { name: "Alpha" }, days: 4 })),
  getProgressStats: vi.fn(() => ({ percent: 50 })),
}));

vi.mock("../../../components/common/app_page/AppPage", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock("../../../components/common/empty_state/EmptyState", () => ({
  default: ({ title, description }) => <div>{title} {description}</div>,
}));

vi.mock("../../../pages/group_work/components/GroupWorkDetailSkeleton", () => ({
  default: ({ onBack }) => <button onClick={onBack}>Skeleton back</button>,
}));

vi.mock("../../../pages/group_work/components/ProjectHeader", () => ({
  default: ({ project }) => <div>Header: {project.name}</div>,
}));

vi.mock("../../../pages/group_work/components/ProjectProgress", () => ({
  default: ({ taskStats }) => <div>Progress: {taskStats.percent}</div>,
}));

vi.mock("../../../components/common/back_button/BackButton.jsx", () => ({
  default: ({ onClick, label }) => <button onClick={onClick}>{label}</button>,
}));

vi.mock("../../../components/pagination/Pagination", () => ({
  BackToTop: () => <div>Back to top</div>,
}));

vi.mock("../../../pages/group_work/GroupTasksTab", () => ({
  default: ({ projectId }) => <div>Tasks tab {projectId}</div>,
}));

vi.mock("../../../pages/group_work/AvailabilityTab", () => ({
  default: ({ projectId }) => <div>Availability tab {projectId}</div>,
}));

function renderDetail(overrides) {
  useProjectDetailMock.mockReturnValue({
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
    ...overrides,
  });
  return render(<GroupProjectDetail projectId={7} onBack={vi.fn()} />);
}

describe("GroupWork extra components", () => {
  describe("GroupProjectDetail", () => {
    it("shows the loading skeleton", () => {
      useProjectDetailMock.mockReturnValue({ loading: true });
      render(<GroupProjectDetail projectId={7} onBack={vi.fn()} />);
      expect(screen.getByText("Skeleton back")).toBeInTheDocument();
    });

    it("renders the empty state when project data is missing", () => {
      useProjectDetailMock.mockReturnValue({ loading: false, project: null });
      render(<GroupProjectDetail projectId={7} onBack={vi.fn()} />);
      expect(screen.getByText(/This group project isn’t available right now./)).toBeInTheDocument();
    });

    it("renders the project header and footer when data is available", () => {
      renderDetail();
      expect(screen.getByText("Header: Alpha")).toBeInTheDocument();
      expect(screen.getByText("Back to top")).toBeInTheDocument();
    });
  });

  describe("MemberAvatar", () => {
    it("renders a photo when profile url exists and initials otherwise", () => {
      render(
        <>
          <MemberAvatar member={{ id: 1, name: "Alex", profile_photo_url: "https://example.com/a.jpg" }} />
          <MemberAvatar member={{ id: 2, user: 2, name: "Bea" }} size={30} />
        </>
      );
      expect(screen.getByAltText("Alex")).toBeInTheDocument();
      expect(screen.getByText("BE")).toBeInTheDocument();
    });
  });

  describe("MemberFilter", () => {
    it("toggles members when clicked while open", () => {
      const onToggle = vi.fn();
      render(<MemberFilter members={[{ id: 1, user: 1, name: "Alex" }]} selectedUsers={[]} onToggle={onToggle} />);
      const button = screen.getByRole("button", { name: /Filter/ });
      fireEvent.mouseEnter(button.parentElement);
      fireEvent.click(screen.getByText("Alex"));
      expect(onToggle).toHaveBeenCalledWith("1");
    });

    it("toggles members when the checkbox is clicked", () => {
      const onToggle = vi.fn();
      render(<MemberFilter members={[{ id: 1, user: 1, name: "Alex" }]} selectedUsers={[]} onToggle={onToggle} />);
      fireEvent.mouseEnter(screen.getByRole("button", { name: /Filter/ }).parentElement);
      fireEvent.click(screen.getByRole("checkbox"));
      expect(onToggle).toHaveBeenCalledWith("1");
    });

    it("renders the empty state and hides it after mouse leave", () => {
      render(<MemberFilter members={[]} selectedUsers={["1"]} onToggle={vi.fn()} />);
      const wrapper = screen.getByRole("button", { name: /Filter/ }).parentElement;
      fireEvent.mouseEnter(wrapper);
      const emptyMessage = screen.getByText("No members");
      expect(emptyMessage).toBeInTheDocument();
      fireEvent.mouseLeave(wrapper);
      expect(emptyMessage).not.toBeVisible();
    });

    it("opens from the filter button and closes on mouse leave", () => {
      render(<MemberFilter members={[]} selectedUsers={[]} onToggle={vi.fn()} />);
      const button = screen.getByRole("button", { name: /Filter/ });
      fireEvent.click(button);
      expect(screen.getByText("No members")).toBeInTheDocument();
      fireEvent.mouseLeave(button.closest("div"));
      return waitForElementToBeRemoved(() => screen.getByText("No members"));
    });
  });

  describe("MembersSection", () => {
    it("opens profiles and forwards remove actions", () => {
      const onRemove = vi.fn();
      render(
        <>
          <MembersSection
            members={[
              { id: 1, name: "Owner", role: "owner" },
              { id: 2, name: "Member", role: "member" },
            ]}
            onRemove={onRemove}
            canRemove
            allowOwnerRemove
          />
          <MembersSection members={[]} onRemove={onRemove} />
        </>
      );
      fireEvent.click(screen.getByLabelText("Open Owner profile"));
      fireEvent.click(screen.getByText("Leave project"));
      fireEvent.click(screen.getByText("Remove"));
      expect(openMemberProfileMock).toHaveBeenCalled();
      expect(onRemove).toHaveBeenCalledWith(1);
      expect(onRemove).toHaveBeenCalledWith(2);
      expect(screen.getByText(/No teammates added yet/)).toBeInTheDocument();
    });
  });

  describe("GroupWork dashboard widgets", () => {
    it("summarises stats and renders the tabs section", () => {
      render(
        <>
          <GroupWorkStats projects={[{ name: "Alpha", task_count: 2, completed_task_count: 1 }]} />
          <TabsSection activeTab="tasks" setActiveTab={vi.fn()} projectId={9} members={[]} onStatsUpdate={vi.fn()} taskStats={{ percent: 33 }} />
        </>
      );
      expect(screen.getByText("Active projects")).toBeInTheDocument();
      expect(screen.getByText("Tasks tab 9")).toBeInTheDocument();
    });
  });
});
