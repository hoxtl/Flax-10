import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const useAuthMock = vi.fn();
const useProfileState = vi.fn();
const useProfileBodyData = vi.fn();
const useProfileContent = vi.fn();
const useProfileSummary = vi.fn();
const useProfileVisibility = vi.fn();
const useCurrentUserSummary = vi.fn();
const usePeakHour = vi.fn();
const useProfileAnalytics = vi.fn();
const useSuggestionState = vi.fn();
const saveWeeklyGoal = vi.fn();
const useProfileHeaderState = vi.fn();

vi.mock("../../../../pages/profile/styles/ProfilePage.module.css", () => ({
  default: {
    skel: "skel",
    container: "container",
    content: "content",
    backButtonWrapper: "backButtonWrapper",
    calendarSection: "calendarSection",
    sectionLabel: "sectionLabel",
    leftCol: "leftCol",
    leftTopMetricsRow: "leftTopMetricsRow",
    leftTopMetricsRowTeacher: "leftTopMetricsRowTeacher",
    leftTopSideCol: "leftTopSideCol",
    leftTopStreakCard: "leftTopStreakCard",
    leftTopWeekCard: "leftTopWeekCard",
    leftTopStudyDnaCard: "leftTopStudyDnaCard",
    singleCol: "singleCol",
    compatibilityCell: "compatibilityCell",
    otherInsightsRow: "otherInsightsRow",
    secondaryInsightCell: "secondaryInsightCell",
  },
}));

vi.mock("../../../../pages/profile/hooks/useProfile", () => ({
  useProfileState: (...args) => useProfileState(...args),
  useProfileBodyData: (...args) => useProfileBodyData(...args),
  useProfileContent: (...args) => useProfileContent(...args),
}));

vi.mock("../../../../pages/profile/hooks/useProfileSummary", () => ({
  useProfileSummary: (...args) => useProfileSummary(...args),
}));

vi.mock("../../../../pages/profile/hooks/useProfileVisibility", () => ({
  useProfileVisibility: (...args) => useProfileVisibility(...args),
}));

vi.mock("../../../../pages/profile/hooks/useProfileInsights", () => ({
  saveWeeklyGoal: (...args) => saveWeeklyGoal(...args),
  useCurrentUserSummary: (...args) => useCurrentUserSummary(...args),
  usePeakHour: (...args) => usePeakHour(...args),
  useProfileAnalytics: (...args) => useProfileAnalytics(...args),
  useSuggestionState: (...args) => useSuggestionState(...args),
}));

vi.mock("../../../../pages/profile/hooks/useProfileHeaderState", () => ({
  useProfileHeaderState: (...args) => useProfileHeaderState(...args),
}));

vi.mock("../../../../context/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("../../../../components/common/back_button/BackButton.jsx", () => ({
  default: ({ label, onClick }) => <button onClick={onClick}>{label}</button>,
}));

vi.mock("../../../../components/common/Breadcrumb/Breadcrumb.jsx", () => ({
  default: ({ crumbs }) => (
    <nav data-testid="breadcrumb">
      {crumbs.map((crumb) => <span key={crumb.label}>{crumb.label}</span>)}
    </nav>
  ),
}));

vi.mock("../../../../components/common/empty_state/EmptyState", () => ({
  default: ({ title, message, description, action }) => (
    <div>
      <div>{title}</div>
      <div>{message || description}</div>
      {action}
    </div>
  ),
}));

vi.mock("../../../../components/common/scroll_to_top/ScrollToTop", () => ({
  default: () => <div data-testid="scroll-to-top" />,
}));

vi.mock("../../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
}));

vi.mock("../../../../pages/profile/components/AchievementsModal", () => ({
  default: () => <div data-testid="achievements-modal" />,
}));

vi.mock("../../../../pages/profile/components/ProfileCalendar", () => ({
  ProfileCalendar: ({ allEvents }) => <div data-testid="profile-calendar">{allEvents.length}</div>,
}));

vi.mock("../../../../pages/profile/components/ProfileHeader", () => ({
  default: () => <div data-testid="profile-header" />,
}));

vi.mock("../../../../pages/profile/components/ProfileSkeleton", () => ({
  default: ({ blocks }) => <div data-testid="profile-skeleton">{blocks}</div>,
}));

vi.mock("../../../../pages/profile/components/ProfileWidgets", () => ({
  CommonGroundSection: () => <div>Common Ground</div>,
  CompatibilityScore: () => <div>Compatibility</div>,
  CompactAttendanceTile: () => <div>Attendance</div>,
  CompactStreakTile: () => <div>Streak</div>,
  FocusHeatmapWidget: () => <div>Heatmap</div>,
  ModulesSection: () => <div>Modules Section</div>,
  QuickStatsRail: () => <div>Quick Stats</div>,
  StudyDNA: () => <div>Study DNA</div>,
  ThisWeek: ({ onGoalSave }) => <button onClick={() => onGoalSave?.(4)}>This Week</button>,
}));

vi.mock("../../../../pages/profile/components/ProfileModals", () => ({
  default: () => <div data-testid="profile-modals" />,
  SocietiesModal: ({ isOpen, societies }) => (
    isOpen ? <div data-testid="societies-modal">{societies.map((society) => society.name || society).join(", ")}</div> : null
  ),
}));

import Profile from "../../../../pages/profile/Profile";

function buildState(overrides = {}) {
  return {
    loading: false,
    profileData: { id: 1, username: "alice", role: "student" },
    viewedUserId: 1,
    ...overrides,
  };
}

function buildSummary(overrides = {}) {
  return {
    session_count: 3,
    badges: [],
    societies: [],
    weekly: null,
    streaks: null,
    ...overrides,
  };
}

function buildHeaderState(overrides = {}) {
  return {
    badges: [],
    pinnedBadgeId: null,
    handlePinBadge: vi.fn(),
    openAchievements: vi.fn(),
    persona: null,
    peakHour: null,
    societies: [],
    openSocieties: vi.fn(),
    setBadges: vi.fn(),
    setPersonaState: vi.fn(),
    setSocieties: vi.fn(),
    closeAchievements: vi.fn(),
    closeSocieties: vi.fn(),
    showAchievements: false,
    showSocieties: false,
    ...overrides,
  };
}

function renderProfile(props = {}) {
  return render(
    <MemoryRouter>
      <Profile user={{ id: 1, username: "alice", role: "student" }} viewedUserId={1} onNavigate={vi.fn()} {...props} />
    </MemoryRouter>,
  );
}

describe("Profile coverage paths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({ profile: { modules: ["CS101"] } });
    useProfileState.mockReturnValue(buildState());
    useProfileBodyData.mockReturnValue({ modules: ["CS101"], upcomingEventCount: 1, filteredEvents: [] });
    useProfileContent.mockImplementation((state) => ({ profileData: state.profileData, handlers: { reload: vi.fn() } }));
    useProfileSummary.mockReturnValue({ summary: buildSummary(), loading: false, refetch: vi.fn() });
    useProfileVisibility.mockReturnValue({ isSelf: true, canViewAnalytics: true, canViewCalendar: false });
    useCurrentUserSummary.mockReturnValue({ societies: [] });
    usePeakHour.mockReturnValue("09:00");
    useProfileAnalytics.mockReturnValue({ heatmap: { data: [] } });
    useSuggestionState.mockReturnValue({ submit: vi.fn(), state: "idle" });
    useProfileHeaderState.mockReturnValue(buildHeaderState());
  });

  it("renders the loading skeleton even when per-block skeleton classes are missing", () => {
    useProfileState.mockReturnValue(buildState({ loading: true }));

    renderProfile();

    expect(screen.getByTestId("profile-skeleton")).toBeInTheDocument();
    expect(document.querySelector(".skel")).toBeTruthy();
  });

  it("shows the new-user banner and opens the timer from the CTA", () => {
    const onNavigate = vi.fn();
    useProfileSummary.mockReturnValue({ summary: buildSummary({ session_count: 0 }), loading: false, refetch: vi.fn() });

    renderProfile({ onNavigate });

    fireEvent.click(screen.getByRole("button", { name: "Open Focus Timer" }));
    expect(onNavigate).toHaveBeenCalledWith("timer");
  });

  it("saves the weekly goal from the self-profile overview", () => {
    const refetch = vi.fn();
    useProfileSummary.mockReturnValue({ summary: buildSummary({ session_count: 4 }), loading: false, refetch });

    renderProfile();
    fireEvent.click(screen.getByRole("button", { name: "This Week" }));

    expect(saveWeeklyGoal).toHaveBeenCalledWith(4, refetch);
  });

  it("renders the inner profile skeleton while summary data loads and falls back missing badges", () => {
    const header = buildHeaderState();
    useProfileHeaderState.mockReturnValue(header);
    useProfileSummary.mockReturnValue({
      summary: buildSummary({ session_count: 1, badges: undefined }),
      loading: true,
      refetch: vi.fn(),
    });

    renderProfile();

    expect(screen.getByTestId("profile-skeleton")).toBeInTheDocument();
    expect(header.setBadges).toHaveBeenCalledWith([]);
  });

  it("uses teacher insights when the viewed teacher has summary data but no modules", () => {
    useProfileState.mockReturnValue(buildState({ profileData: { id: 2, username: "lecturer", role: "teacher" }, viewedUserId: 2 }));
    useProfileBodyData.mockReturnValue({ modules: [], upcomingEventCount: 0, filteredEvents: [] });
    useProfileVisibility.mockReturnValue({ isSelf: false, canViewAnalytics: false, canViewCalendar: false });
    useProfileSummary.mockReturnValue({ summary: buildSummary({ session_count: 5 }), loading: false, refetch: vi.fn() });
    useCurrentUserSummary.mockReturnValue({ societies: [], total_hours: 12 });

    renderProfile({ user: { id: 2, username: "lecturer", role: "teacher" }, viewedUserId: 2 });

    expect(screen.getByText("Modules Section")).toBeInTheDocument();
    expect(screen.getByText("Compatibility")).toBeInTheDocument();
  });

  it("falls back to an empty current-user module list when comparing common ground", () => {
    useAuthMock.mockReturnValue({ profile: null });
    useProfileState.mockReturnValue(buildState({ profileData: { id: 2, username: "bob", role: "student" }, viewedUserId: 2 }));
    useProfileBodyData.mockReturnValue({ modules: ["CS101"], upcomingEventCount: 0, filteredEvents: [] });
    useProfileVisibility.mockReturnValue({ isSelf: false, canViewAnalytics: false, canViewCalendar: false });
    useProfileSummary.mockReturnValue({ summary: buildSummary({ societies: ["Chess"] }), loading: false, refetch: vi.fn() });
    useCurrentUserSummary.mockReturnValue({ societies: ["Debate"] });

    renderProfile({ user: { id: 2, username: "bob", role: "student" }, viewedUserId: 2 });

    expect(screen.getByText("Common Ground")).toBeInTheDocument();
  });

  it("renders the societies modal and falls back to a generic breadcrumb label", () => {
    useProfileState.mockReturnValue(buildState({ profileData: {}, viewedUserId: 2 }));
    useProfileBodyData.mockReturnValue({ modules: [], upcomingEventCount: 0, filteredEvents: [] });
    useProfileVisibility.mockReturnValue({ isSelf: false, canViewAnalytics: false, canViewCalendar: false });
    useProfileSummary.mockReturnValue({ summary: buildSummary({ session_count: 1 }), loading: false, refetch: vi.fn() });
    useCurrentUserSummary.mockReturnValue({ societies: [] });
    useProfileHeaderState.mockReturnValue(buildHeaderState({ showSocieties: true, societies: [{ name: "Chess Society" }] }));

    renderProfile({ user: {}, viewedUserId: 2, onBack: vi.fn() });

    expect(screen.getByText("Profiles")).toBeInTheDocument();
    expect(screen.getByTestId("breadcrumb")).toHaveTextContent("Profile");
    expect(screen.getByTestId("societies-modal")).toHaveTextContent("Chess Society");
  });

  it("renders the achievements modal when header state enables it", () => {
    useProfileHeaderState.mockReturnValue(buildHeaderState({ showAchievements: true, badges: [{ id: 1, label: "Starter" }] }));

    renderProfile();

    expect(screen.getByTestId("achievements-modal")).toBeInTheDocument();
  });
});
