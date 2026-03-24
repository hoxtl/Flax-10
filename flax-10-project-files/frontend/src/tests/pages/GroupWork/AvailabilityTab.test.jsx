<<<<<<< HEAD
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const confirmHook = vi.fn();
const useAvailabilityMock = vi.fn();

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: new Proxy(
    {},
    {
      get: (_, tag) => {
        const Tag = typeof tag === "string" ? tag : "div";
        return ({ children, ...props }) => {
          const { animate: _animate, exit: _exit, initial: _initial, layoutId: _layoutId, transition: _transition, ...rest } = props;
          return <Tag {...rest}>{children}</Tag>;
        };
      },
    },
  ),
}));

vi.mock("../../../context/ConfirmContext", () => ({
  useConfirm: () => confirmHook,
}));

vi.mock("../../../pages/GroupWork/hooks/useAvailability", () => ({
  useAvailability: (...args) => useAvailabilityMock(...args),
}));

vi.mock("../../../components/common/ConfirmModal/ConfirmModal", () => ({
  default: ({ title, message, confirmText, onConfirm, onCancel }) => (
    <div data-testid="confirm-modal">
      <div>{title}</div>
      <div>{message}</div>
      <button type="button" onClick={onConfirm}>
        {confirmText || "Confirm"}
      </button>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
=======
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import AvailabilityTab from "../../../pages/GroupWork/AvailabilityTab";

const useAvailabilityMock = vi.fn();
const useConfirmMock = vi.fn();

vi.mock("../../../pages/GroupWork/hooks/useAvailability", () => ({
  useAvailability: (...args) => useAvailabilityMock(...args),
}));

vi.mock("../../../context/ConfirmContext", () => ({
  useConfirm: () => useConfirmMock,
}));

vi.mock("../../../pages/GroupWork/utils/availabilityUtils", () => ({
  formatSuggestionDateLabel: vi.fn((start) => `Formatted(${start})`),
  getMemberStatuses: vi.fn(() => []),
  getTeamSize: vi.fn(() => 3),
  getSuggestionCount: vi.fn(() => 2),
  getCurrentUserStatus: vi.fn(() => "pending"),
}));

vi.mock("../../../pages/GroupWork/utils/memberAvatarUtils", () => ({
  getPhotoUrl: vi.fn(() => null),
}));

vi.mock("../../../components/common/ConfirmModal/ConfirmModal", () => ({
  default: ({ title, onConfirm, onCancel }) => (
    <div>
      <div>{title}</div>
      <button onClick={onConfirm}>confirm-modal</button>
      <button onClick={onCancel}>cancel-modal</button>
>>>>>>> cebe87483 (Write more groupwork tests)
    </div>
  ),
}));

vi.mock("../../../components/common/SearchEmptyState/SearchEmptyState", () => ({
<<<<<<< HEAD
  default: ({ title, hint }) => <div>{`${title} :: ${hint}`}</div>,
}));

vi.mock("../../../components/common/Tooltip/Tooltip", () => ({
  default: ({ children, content }) => <div title={content}>{children}</div>,
}));

vi.mock("../../../pages/GroupWork/utils/memberAvatarUtils", () => ({
  getPhotoUrl: vi.fn((member) => member.profile_photo_url || ""),
}));

import AvailabilityTab from "../../../pages/GroupWork/AvailabilityTab";

function buildModel(overrides = {}) {
  return {
    active_suggestions: [],
    current_user_id: 1,
    handleDelete: vi.fn(),
    handleSuggestTime: vi.fn(),
    handleVote: vi.fn(),
    loading: false,
    project_members: [],
    setSuggestingSlot: vi.fn(),
    suggestions: [],
    suggestingSlot: null,
    team_size: 2,
    ...overrides,
  };
}

const proposedSuggestion = {
  accepted_count: 1,
  id: 10,
  is_confirmed: false,
  member_statuses: [
    {
      id: 1,
      initials: "AL",
      is_suggester: true,
      name: "Alex",
      profile_photo_url: "https://example.com/alex.jpg",
      status: "accepted",
      username: "alex",
    },
    {
      id: 2,
      initials: "BE",
      name: "Bea",
      status: "pending",
      username: "bea",
    },
  ],
  pending_count: 1,
  rejected_count: 0,
  start: "2026-04-10T09:00:00.000Z",
  suggested_by: { id: 1, username: "alex" },
  team_size: 2,
};

const confirmedSuggestion = {
  ...proposedSuggestion,
  accepted_count: 2,
  id: 11,
  is_confirmed: true,
  pending_count: 0,
  suggested_by: { id: 2, username: "bea" },
};

const freeSlot = {
  free_count: 2,
  label: "Thu 09:00",
  members: [
    { id: 1, initials: "AL", is_free: true, name: "Alex", profile_photo_url: "https://example.com/alex.jpg" },
    { id: 2, initials: "BE", is_free: false, name: "Bea" },
  ],
  start: "2026-04-12T09:00:00.000Z",
  total_count: 2,
=======
  default: ({ title, hint }) => <div>{title} {hint}</div>,
}));

vi.mock("../../../components/common/Tooltip/Tooltip", () => ({
  default: ({ children, content }) => <div data-tooltip={content}>{children}</div>,
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => {
      const { initial, animate, exit, transition, layoutId, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
}));

vi.mock("lucide-react", () => ({
  Check: () => <span>check-icon</span>,
  X: () => <span>x-icon</span>,
  Clock3: () => <span>clock-icon</span>,
  Plus: () => <span>plus-icon</span>,
  Star: () => <span>star-icon</span>,
  Trash2: () => <span>trash-icon</span>,
}));

const baseAvailability = {
  loading: false,
  suggestions: [
    {
      start: "2026-04-10T10:00:00Z",
      label: "Thu 10 Apr · 10:00-11:00",
      free_count: 3,
      total_count: 3,
      members: [{ id: 1, name: "Alice", is_free: true }],
    },
  ],
  active_suggestions: [],
  current_user_id: 1,
  suggestingSlot: null,
  setSuggestingSlot: vi.fn(),
  handleSuggestTime: vi.fn(),
  handleDelete: vi.fn(),
  handleVote: vi.fn(),
>>>>>>> cebe87483 (Write more groupwork tests)
};

describe("AvailabilityTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

<<<<<<< HEAD
  it("renders the loading state while availability data is being analysed", () => {
    useAvailabilityMock.mockReturnValue(buildModel({ loading: true }));

    render(<AvailabilityTab projectId={77} />);

    expect(screen.getByText("Analysing member calendars...")).toBeInTheDocument();
    expect(useAvailabilityMock).toHaveBeenCalledWith(77, confirmHook);
  });

  it("renders proposed suggestions, votes, delete actions, profile navigation, and slot confirmation", async () => {
    let availability = buildModel({
      active_suggestions: [proposedSuggestion, confirmedSuggestion],
      setSuggestingSlot: vi.fn((slot) => {
        availability = { ...availability, suggestingSlot: slot };
      }),
      suggestions: [freeSlot],
    });

    useAvailabilityMock.mockImplementation(() => availability);

    const onNavigate = vi.fn();
    window.addEventListener("navigate", onNavigate);

    const { rerender } = render(<AvailabilityTab projectId={77} />);

    expect(screen.getByText("Proposed by alex")).toBeInTheDocument();
    expect(screen.getByTitle("@alex · accepted · proposed this slot")).toBeInTheDocument();
    expect(screen.getByTitle("@Alex · free")).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Alex"));
    expect(onNavigate.mock.calls[0][0].detail).toBe("profile_1");

    fireEvent.click(screen.getByLabelText("Accept meeting suggestion"));
    fireEvent.click(screen.getByLabelText("Reject meeting suggestion"));
    fireEvent.click(screen.getByLabelText("Delete meeting suggestion"));
    expect(availability.handleVote).toHaveBeenCalledWith(10, "accepted");
    expect(availability.handleVote).toHaveBeenCalledWith(10, "rejected");
    expect(availability.handleDelete).toHaveBeenCalledWith(10);

    fireEvent.click(screen.getByText("Propose"));
    rerender(<AvailabilityTab projectId={77} />);

    expect(screen.getByTestId("confirm-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Suggest Time"));
    await waitFor(() => expect(availability.handleSuggestTime).toHaveBeenCalledWith(freeSlot));

    fireEvent.click(screen.getByText("Confirmed meeting slots"));
    expect(screen.getByText("Meeting 1")).toBeInTheDocument();
    expect(screen.getByText("All users attending")).toBeInTheDocument();
    expect(screen.queryByText("Propose")).not.toBeInTheDocument();

    window.removeEventListener("navigate", onNavigate);
  });

  it("defaults to the confirmed view when there are no proposed suggestions and shows the confirmed empty state after toggling", async () => {
    useAvailabilityMock.mockReturnValue(
      buildModel({
        active_suggestions: [confirmedSuggestion],
        suggestions: [freeSlot],
      }),
    );

    render(<AvailabilityTab projectId={91} />);

    await waitFor(() => expect(screen.getByText("Meeting 1")).toBeInTheDocument());
    expect(screen.queryByText("Propose")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Proposed slots"));
    expect(
      screen.getByText(
        "No proposed meeting slots yet :: Choose a suggested time below or propose one to get things started.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Propose")).toBeInTheDocument();
=======
  it("shows loading state", () => {
    useAvailabilityMock.mockReturnValue({ ...baseAvailability, loading: true });
    render(<AvailabilityTab projectId={1} />);
    expect(screen.getByText(/Analysing member calendars/)).toBeInTheDocument();
  });

  it("renders slot list and propose button when no meeting cards", () => {
    useAvailabilityMock.mockReturnValue(baseAvailability);
    render(<AvailabilityTab projectId={1} />);

    expect(screen.getByText(/Propose meeting timings/)).toBeInTheDocument();
    expect(screen.getAllByText(/Propose/).length).toBeGreaterThan(0);
    // star-icon for best slot (free_count === total_count)
    expect(screen.getByText("star-icon")).toBeInTheDocument();
    // footer
    expect(screen.getByText(/Green rings mean free/)).toBeInTheDocument();
  });

  it("opens suggestion modal on Propose click and confirms it", () => {
    const setSuggestingSlot = vi.fn();
    const handleSuggestTime = vi.fn();
    useAvailabilityMock.mockReturnValue({
      ...baseAvailability,
      setSuggestingSlot,
      handleSuggestTime,
    });
    render(<AvailabilityTab projectId={1} />);

    // The Propose button is a button containing the plus icon and text
    const proposeBtns = screen.getAllByRole("button").filter(btn => btn.textContent.includes("Propose"));
    expect(proposeBtns.length).toBeGreaterThan(0);
    fireEvent.click(proposeBtns[0]);
    expect(setSuggestingSlot).toHaveBeenCalledWith(baseAvailability.suggestions[0]);
  });

  it("renders suggestion modal and handles confirm/cancel when suggestingSlot is set", () => {
    const setSuggestingSlot = vi.fn();
    const handleSuggestTime = vi.fn();
    const slot = { start: "2026-04-10T10:00:00Z" };
    useAvailabilityMock.mockReturnValue({
      ...baseAvailability,
      suggestingSlot: slot,
      setSuggestingSlot,
      handleSuggestTime,
    });
    render(<AvailabilityTab projectId={1} />);

    expect(screen.getByText(/Suggest /)).toBeInTheDocument();
    fireEvent.click(screen.getByText("confirm-modal"));
    expect(handleSuggestTime).toHaveBeenCalledWith(slot);

    fireEvent.click(screen.getByText("cancel-modal"));
    expect(setSuggestingSlot).toHaveBeenCalledWith(null);
  });

  it("renders proposed meeting cards and toggles views", () => {
    const proposedSuggestion = {
      id: 10,
      start: "2026-04-10T14:00:00Z",
      is_confirmed: false,
      suggested_by: { id: 2, username: "bob" },
      responses: [],
    };
    useAvailabilityMock.mockReturnValue({
      ...baseAvailability,
      active_suggestions: [proposedSuggestion],
    });
    render(<AvailabilityTab projectId={1} />);

    // Meeting toggle rendered when there are proposals
    expect(screen.getByText("Proposed slots")).toBeInTheDocument();
    expect(screen.getByText("Confirmed meeting slots")).toBeInTheDocument();

    // Proposed card content
    expect(screen.getByText(/Proposed by bob/)).toBeInTheDocument();

    // Vote buttons
    const acceptBtns = screen.getAllByLabelText("Accept meeting suggestion");
    expect(acceptBtns.length).toBeGreaterThan(0);
    fireEvent.click(acceptBtns[0]);
    expect(baseAvailability.handleVote).toHaveBeenCalledWith(10, "accepted");
  });

  it("renders confirmed meeting cards when confirmed view is active", () => {
    const confirmedSuggestion = {
      id: 20,
      start: "2026-04-11T09:00:00Z",
      is_confirmed: true,
      suggested_by: { id: 3, username: "carol" },
      responses: [],
    };
    useAvailabilityMock.mockReturnValue({
      ...baseAvailability,
      active_suggestions: [confirmedSuggestion],
    });
    render(<AvailabilityTab projectId={1} />);

    // Switch to confirmed view
    fireEvent.click(screen.getByText("Confirmed meeting slots"));
    expect(screen.getByText(/Confirmed from carol/)).toBeInTheDocument();
  });

  it("shows empty state for confirmed view when no confirmed slots", () => {
    const proposedSuggestion = {
      id: 10,
      start: "2026-04-10T14:00:00Z",
      is_confirmed: false,
      suggested_by: { id: 2, username: "bob" },
      responses: [],
    };
    useAvailabilityMock.mockReturnValue({
      ...baseAvailability,
      active_suggestions: [proposedSuggestion],
    });
    render(<AvailabilityTab projectId={1} />);

    fireEvent.click(screen.getByText("Confirmed meeting slots"));
    expect(screen.getByText(/No confirmed meeting slots yet/)).toBeInTheDocument();
  });

  it("renders delete button for suggestions made by current user", () => {
    const proposedSuggestion = {
      id: 10,
      start: "2026-04-10T14:00:00Z",
      is_confirmed: false,
      suggested_by: { id: 1, username: "alice" }, // id matches current_user_id
      responses: [],
    };
    useAvailabilityMock.mockReturnValue({
      ...baseAvailability,
      current_user_id: 1,
      active_suggestions: [proposedSuggestion],
    });
    render(<AvailabilityTab projectId={1} />);

    expect(screen.getByLabelText("Delete meeting suggestion")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Delete meeting suggestion"));
    expect(baseAvailability.handleDelete).toHaveBeenCalledWith(10);
  });

  it("dispatches navigate event when avatar photo is clicked", () => {
    const slot = {
      start: "2026-04-10T10:00:00Z",
      label: "Thu 10 Apr · 10:00-11:00",
      free_count: 2,
      total_count: 3,
      members: [{ id: 7, name: "Dave", is_free: true, initials: "DA", profile_photo_url: null }],
    };
    useAvailabilityMock.mockReturnValue({
      ...baseAvailability,
      suggestions: [slot],
    });

    const dispatched = [];
    window.addEventListener("navigate", (e) => dispatched.push(e.detail));
    render(<AvailabilityTab projectId={1} />);

    const avatarDiv = screen.getByTitle("Dave");
    fireEvent.click(avatarDiv);
    expect(dispatched.some((d) => d.includes("7"))).toBe(true);
  });

  it("auto-switches to confirmed view when no proposals but confirmations exist", () => {
    const confirmedSuggestion = {
      id: 20,
      start: "2026-04-11T09:00:00Z",
      is_confirmed: true,
      suggested_by: { id: 3, username: "carol" },
      responses: [],
    };
    useAvailabilityMock.mockReturnValue({
      ...baseAvailability,
      active_suggestions: [confirmedSuggestion],
    });
    render(<AvailabilityTab projectId={1} />);

    // Should auto-switch to confirmed
    expect(screen.getByText(/Confirmed from carol/)).toBeInTheDocument();
    // When confirmed view is active, the slot suggestion section is hidden
    // (no propose buttons for individual slots)
    const proposeBtns = screen.queryAllByRole("button").filter(btn => btn.className?.includes("proposePill"));
    expect(proposeBtns.length).toBe(0);
>>>>>>> cebe87483 (Write more groupwork tests)
  });
});
