import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProfileModals, { SocietiesModal, buildSharingTitle } from "../../../../pages/profile/components/ProfileModals";

// Mock dependencies
vi.mock("../../../../components/dashboard/components/EditProfileModal", () => ({
  default: ({ isOpen, onClose }) => isOpen ? <div data-testid="edit-profile-modal"><button onClick={onClose}>Close</button></div> : null
}));

vi.mock("../../../../components/common/generic_summary_modal/GenericSummaryModal", () => ({
  default: ({ isOpen, title, children, renderItem, items, topContent, emptyMessage, loading, onClose }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="generic-summary-modal">
        <h2>{title}</h2>
        <button onClick={onClose}>Close Generic</button>
        {loading && <p>Loading...</p>}
        {topContent}
        <div className="items">
          {items?.length ? (renderItem ? items.map(renderItem) : children) : <p>{emptyMessage}</p>}
        </div>
      </div>
    );
  }
}));

vi.mock("../../../../components/common/generic_summary_modal/SummaryItem", () => ({
  default: ({ title, subtitle, onClick, avatar }) => (
    <div data-testid="summary-item" onClick={onClick}>
      <span>{avatar}</span>
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
  )
}));

vi.mock("../../../../components/common", () => ({
  SegmentedControl: ({ value, onChange, options }) => (
    <div data-testid="segmented-control">
      {options.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)} disabled={value === opt.value}>
          {opt.label}
        </button>
      ))}
    </div>
  )
}));

vi.mock("../../../../components/social/components/UserListModal", () => ({
  default: ({ title, onClose, onUserClick, onUserCalendarClick, onUserUpdate }) => (
    <div data-testid="user-list-modal">
      <h2>{title}</h2>
      <button onClick={onClose}>Close</button>
      <button onClick={() => onUserClick({ id: 1, username: 'u1' })}>User 1</button>
      <button onClick={() => onUserCalendarClick?.({ id: 1, username: 'u1' })}>Calendar 1</button>
      <button onClick={() => onUserUpdate?.()}>Update</button>
    </div>
  )
}));

const defaultVisibility = {
  canEditProfile: true,
  canViewModules: true,
  canViewTasks: true,
  canViewEvents: true,
  canViewSharedWith: true
};

const mockTasksData = { tasks: [], loading: false };
const mockModuleNameMap = {};
const mockSocialUsers = [];

vi.mock("../../../../pages/profile/hooks/useProfileModalsData", () => ({
  useModuleNameMap: vi.fn(() => mockModuleNameMap),
  useSocialUsers: vi.fn(() => mockSocialUsers),
  useTasksModalData: vi.fn(() => mockTasksData),
  socialDataFetchers: { sharingWith: vi.fn(), sharedWithMe: vi.fn() }
}));

describe("ProfileModals Utilities", () => {
  it("SocietiesModal handles missing society IDs and navigates", () => {
    const onNavigate = vi.fn();
    const societies = [{ name: "S1" }, { id: 2, name: "S2" }];
    render(<SocietiesModal isOpen onClose={vi.fn()} societies={societies} onNavigate={onNavigate} />);
    
    const items = screen.getAllByTestId("summary-item");
    fireEvent.click(items[0]); // S1 - no ID
    expect(onNavigate).not.toHaveBeenCalled();
    
    fireEvent.click(items[1]); // S2 - has ID
    expect(onNavigate).toHaveBeenCalledWith("/societies?id=2");
  });

  it("SocietiesModal fallback to default avatar", () => {
    const societies = [{ id: 1, name: "S1" }];
    render(<SocietiesModal isOpen onClose={vi.fn()} societies={societies} />);
    expect(screen.getByText("🏛️")).toBeInTheDocument();
  });

  it("SocietiesModal renders empty state when list missing", () => {
    render(<SocietiesModal isOpen onClose={vi.fn()} onNavigate={vi.fn()} />);
    expect(screen.getByText("No societies found")).toBeInTheDocument();
  });

  it("buildSharingTitle falls back to shared_with handler", () => {
    expect(buildSharingTitle("unknown", 0)).toBe("People who can see my calendar events");
  });
});

describe("ProfileModals Integration", () => {
  const defaultProps = {
    user: { id: 123 },
    state: {
      showEditProfile: false, setShowEditProfile: vi.fn(),
      showModules: false, setShowModules: vi.fn(),
      showTasks: false, setShowTasks: vi.fn(),
      showEvents: false, setShowEvents: vi.fn(),
      showSharedWith: false, setShowSharedWith: vi.fn(),
      showSharedBy: false, setShowSharedBy: vi.fn(),
      eventRange: "7d", setEventRange: vi.fn(),
      profileData: { id: 123 },
      reload: vi.fn(),
      handleSaveProfile: vi.fn()
    },
    modules: ["CS101"],
    filteredEvents: [],
    visibility: defaultVisibility,
    onNavChange: vi.fn()
  };

  it("renders nothing when no modals are open", () => {
    const { container } = render(<ProfileModals {...defaultProps} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders EditProfileSection when showEditProfile is true", () => {
    const props = { ...defaultProps, state: { ...defaultProps.state, showEditProfile: true } };
    render(<ProfileModals {...props} />);
    expect(screen.getByTestId("edit-profile-modal")).toBeInTheDocument();
  });

  it("renders ModulesModal and handles navigation", () => {
    mockModuleNameMap["CS101"] = "Intro";
    const props = { ...defaultProps, state: { ...defaultProps.state, showModules: true } };
    const { rerender } = render(<ProfileModals {...props} />);
    
    expect(screen.getByText("CS101 – Intro")).toBeInTheDocument();
    fireEvent.click(screen.getByText("CS101 – Intro"));
    expect(props.onNavChange).toHaveBeenCalledWith("modules_CS101");

    // Case where module name is missing in map
    mockModuleNameMap["CS101"] = null;
    rerender(<ProfileModals {...props} />);
    expect(screen.getByText("CS101")).toBeInTheDocument();
  });

  it("renders TasksModal with loading and items", () => {
    mockTasksData.loading = true;
    mockTasksData.tasks = [];
    const props = { ...defaultProps, state: { ...defaultProps.state, showTasks: true } };
    const { rerender } = render(<ProfileModals {...props} />);
    
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    
    mockTasksData.loading = false;
    mockTasksData.tasks = [{ id: 1, title: "T1", due_date: "2026-03-28T10:00:00Z", task_list_name: "L1" }];
    rerender(<ProfileModals {...props} />);
    expect(screen.getByText("T1")).toBeInTheDocument();
    expect(screen.getByText(/28 Mar.*L1/)).toBeInTheDocument();
  });

  it("renders EventsModal and handles range change", () => {
    const events = [{ title: "E1", start_time: "2026-03-15T10:00:00Z", location: "Loc" }];
    const props = { ...defaultProps, state: { ...defaultProps.state, showEvents: true }, filteredEvents: events };
    render(<ProfileModals {...props} />);
    
    expect(screen.getByText("E1")).toBeInTheDocument();
    expect(screen.getByText(/15 Mar 2026 at 10:00.*Loc/)).toBeInTheDocument();
    
    fireEvent.click(screen.getByText("This Month"));
    expect(props.state.setEventRange).toHaveBeenCalledWith("month");
  });

  it("handles EventsModal visibility", () => {
    const props = { ...defaultProps, visibility: { ...defaultVisibility, canViewEvents: false }, state: { ...defaultProps.state, showEvents: true } };
    const { container } = render(<ProfileModals {...props} />);
    expect(container.querySelector('[data-testid="generic-summary-modal"]')).toBeNull();
  });

  it("triggers navigation and update handlers", () => {
    const onNavChange = vi.fn();
    const props = { ...defaultProps, state: { ...defaultProps.state, showSharedBy: true }, onNavChange };
    // mockSocialUsers is [] by default
    render(<ProfileModals {...props} />);
    
    fireEvent.click(screen.getByText("User 1"));
    expect(onNavChange).toHaveBeenCalledWith("profile_1");

    fireEvent.click(screen.getByText("Calendar 1"));
    expect(onNavChange).toHaveBeenCalledWith(expect.stringContaining("/calendar?user_id=1"));

    fireEvent.click(screen.getByText("Update"));
    expect(defaultProps.state.reload).toHaveBeenCalled();

    // Trigger onUserCalendarClick with no ID
    // We already have a test for navigation, this just reinforces handlers
  });

  it("covers onClose for edit profile", () => {
    const setShowEditProfile = vi.fn();
    const { container } = render(<ProfileModals {...defaultProps} state={{ ...defaultProps.state, showEditProfile: true, setShowEditProfile }} />);
    fireEvent.click(container.querySelector('[data-testid="edit-profile-modal"] button'));
    expect(setShowEditProfile).toHaveBeenCalledWith(false);
  });

  it("covers onClose for modules and events modals", () => {
    const setShowModules = vi.fn();
    const setShowEvents = vi.fn();

    const { rerender } = render(<ProfileModals {...defaultProps} state={{ ...defaultProps.state, showModules: true, setShowModules }} />);
    fireEvent.click(screen.getByText("Close Generic"));
    expect(setShowModules).toHaveBeenCalledWith(false);

    rerender(<ProfileModals {...defaultProps} state={{ ...defaultProps.state, showEvents: true, setShowEvents }} />);
    fireEvent.click(screen.getByText("Close Generic"));
    expect(setShowEvents).toHaveBeenCalledWith(false);
  });

  it("covers onClose for SharedWith modal", () => {
    const setShowSharedWith = vi.fn();
    const { container } = render(<ProfileModals {...defaultProps} state={{ ...defaultProps.state, showSharedWith: true, setShowSharedWith }} />);
    const modals = container.querySelectorAll('[data-testid="user-list-modal"]');
    fireEvent.click(modals[0].querySelector('button'));
    expect(setShowSharedWith).toHaveBeenCalledWith(false);
  });

  it("formatTaskMeta handles missing due_date and list_name", () => {
    const props = { ...defaultProps, state: { ...defaultProps.state, showTasks: true } };
    mockTasksData.tasks = [{ id: 1, title: "T1", due_date: null, task_list_name: null }];
    render(<ProfileModals {...props} />);
    expect(screen.getByText(/No due date • Task/)).toBeInTheDocument();
  });
});
