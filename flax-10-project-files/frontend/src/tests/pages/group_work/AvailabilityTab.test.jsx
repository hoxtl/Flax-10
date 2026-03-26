import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import AvailabilityTab from "../../../pages/group_work/AvailabilityTab";

const useAvailabilityMock = vi.fn();
const useConfirmMock = vi.fn();

vi.mock("../../../pages/group_work/hooks/useAvailability", () => ({
  useAvailability: (...args) => useAvailabilityMock(...args),
}));

vi.mock("../../../context/ConfirmContext", () => ({
  useConfirm: () => useConfirmMock,
}));

vi.mock("../../../pages/group_work/utils/availabilityUtils", () => ({
  formatSuggestionDateLabel: vi.fn((start) => `Formatted(${start})`),
  getMemberStatuses: vi.fn(() => []),
  getTeamSize: vi.fn(() => 3),
  getSuggestionCount: vi.fn(() => 2),
  getCurrentUserStatus: vi.fn(() => "pending"),
}));

vi.mock("../../../pages/group_work/utils/memberAvatarUtils", () => ({
  getPhotoUrl: vi.fn(() => null),
}));

vi.mock("../../../components/common/confirm_modal/ConfirmModal", () => ({
  default: ({ title, onConfirm, onCancel }) => (
    <div>
      <div>{title}</div>
      <button onClick={onConfirm}>confirm-modal</button>
      <button onClick={onCancel}>cancel-modal</button>
    </div>
  ),
}));

vi.mock("../../../components/common/search_empty_state/SearchEmptyState", () => ({
  default: ({ title, hint }) => <div>{title} {hint}</div>,
}));

vi.mock("../../../components/common/tooltip/Tooltip", () => ({
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
};

describe("AvailabilityTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    expect(screen.getAllByText("star-icon").length).toBeGreaterThan(0);
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

  it("renders proposed meeting cards", () => {
    const proposedSuggestion = { id: 10, start: "2026-04-10T14:00:00Z", suggested_by: { id: 2, username: "bob" }, responses: [] };
    useAvailabilityMock.mockReturnValue({ ...baseAvailability, active_suggestions: [proposedSuggestion] });
    render(<AvailabilityTab projectId={1} />);
    expect(screen.getByText("Proposed slots")).toBeInTheDocument();
    expect(screen.getByText(/Proposed by bob/)).toBeInTheDocument();
  });

  it("handles voting on proposed meeting cards", () => {
    const proposedSuggestion = { id: 10, start: "2026-04-10T14:00:00Z", suggested_by: { id: 2, username: "bob" }, responses: [] };
    useAvailabilityMock.mockReturnValue({ ...baseAvailability, active_suggestions: [proposedSuggestion] });
    render(<AvailabilityTab projectId={1} />);
    fireEvent.click(screen.getAllByLabelText("Accept meeting suggestion")[0]);
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
  });
});
