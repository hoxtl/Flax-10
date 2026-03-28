import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import AvailabilityTab from "@/pages/group_work/components/AvailabilityTab";
import { useAvailability } from "@/pages/group_work/hooks/useAvailability";
import * as avatarUtils from "@/pages/group_work/utils/memberAvatarUtils";
import * as availabilityUtils from "@/pages/group_work/utils/availabilityUtils";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => {
      const { layoutId, initial, animate, exit, transition, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
}));

vi.mock("@/pages/group_work/hooks/useAvailability", () => ({
  useAvailability: vi.fn(),
}));

vi.mock("@/pages/group_work/utils/memberAvatarUtils", () => ({
  getPhotoUrl: vi.fn(() => null),
}));

vi.mock("@/pages/group_work/utils/availabilityUtils", () => ({
  formatSuggestionDateLabel: vi.fn((d) => d),
  getMemberStatuses: vi.fn(() => []),
  getTeamSize: vi.fn(() => 5),
  getSuggestionCount: vi.fn(() => 1),
  getCurrentUserStatus: vi.fn(() => "accepted"),
}));

vi.mock("@/context/ConfirmContext", () => ({
  useConfirm: vi.fn(() => vi.fn()),
}));

vi.mock("@/components/common/confirm_modal/ConfirmModal", () => ({
  default: ({ title, onConfirm, onCancel }) => (
    <div data-testid="confirm-modal">
      <h3>{title}</h3>
      <button onClick={onConfirm}>Confirm Suggestion</button>
      <button onClick={onCancel}>Cancel Suggestion</button>
    </div>
  ),
}));

vi.mock("@/components/common/search_empty_state/SearchEmptyState", () => ({
  default: ({ title }) => <div data-testid="empty-state">{title}</div>,
}));

vi.mock("@/components/common/tooltip/Tooltip", () => ({
  default: ({ children, content }) => <div data-testid="tooltip" data-tooltip={content}>{children}</div>,
}));

const mockAvailability = (overrides = {}) => {
  const defaults = {
    loading: false,
    suggestions: [],
    active_suggestions: [],
    current_user_id: 1,
    suggestingSlot: null,
    setSuggestingSlot: vi.fn(),
    handleSuggestTime: vi.fn(),
    handleDelete: vi.fn(),
    handleVote: vi.fn(),
  };
  useAvailability.mockReturnValue({ ...defaults, ...overrides });
};

describe("AvailabilityTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.dispatchEvent = vi.fn();
    availabilityUtils.getTeamSize.mockReturnValue(5);
    availabilityUtils.getSuggestionCount.mockReturnValue(1);
    availabilityUtils.getMemberStatuses.mockReturnValue([]);
  });

  it("renders loading state", () => {
    mockAvailability({ loading: true });
    render(<AvailabilityTab projectId={1} />);
    expect(screen.getByText("Analysing member calendars...")).toBeTruthy();
  });

  it("renders empty state with no suggestions", () => {
    mockAvailability();
    render(<AvailabilityTab projectId={1} />);
    expect(screen.getByText("Propose meeting timings with your team")).toBeTruthy();
  });

  it("renders proposed suggestions and handles view switching", async () => {
    const suggestions = [
      { id: 101, start: "2026-04-01T10:00:00Z", is_confirmed: false, suggested_by: { id: 1, username: "user1" }, responses: [] }
    ];
    mockAvailability({ active_suggestions: suggestions });
    // Make sure we have members to hit the stack
    availabilityUtils.getMemberStatuses.mockReturnValue([
      { id: 1, username: "u1", name: "Alice", status: "accepted", is_suggester: true }
    ]);

    render(<AvailabilityTab projectId={1} />);

    expect(screen.getByText("Proposed slots")).toBeTruthy();
    expect(screen.getByTestId("tooltip")).toBeTruthy();

    fireEvent.click(screen.getByText("Confirmed meeting slots"));
    await waitFor(() => {
      expect(screen.getByTestId("empty-state")).toHaveTextContent("No confirmed meeting slots yet");
    });
  });

  it("handles voting and deleting", () => {
    const handleVote = vi.fn();
    const handleDelete = vi.fn();
    const suggestions = [
      { id: 101, start: "2026-04-01T10:00:00Z", is_confirmed: false, suggested_by: { id: 1, username: "user1" }, responses: [] }
    ];
    mockAvailability({ active_suggestions: suggestions, handleVote, handleDelete, current_user_id: 1 });
    render(<AvailabilityTab projectId={1} />);

    fireEvent.click(screen.getByLabelText("Accept meeting suggestion"));
    expect(handleVote).toHaveBeenCalledWith(101, "accepted");

    fireEvent.click(screen.getByLabelText("Reject meeting suggestion"));
    expect(handleVote).toHaveBeenCalledWith(101, "rejected");

    fireEvent.click(screen.getByLabelText("Delete meeting suggestion"));
    expect(handleDelete).toHaveBeenCalledWith(101);
  });

  it("handles slot proposing and suggesting modal", () => {
    const handleSuggestTime = vi.fn();
    const suggestions = [
      { start: "2026-04-01T10:00:00Z", label: "10:00 AM", free_count: 5, total_count: 5, members: [{ id: 1, name: "Alice", initials: "A", is_free: true }] }
    ];
    mockAvailability({ suggestions, suggestingSlot: suggestions[0], handleSuggestTime });
    
    render(<AvailabilityTab projectId={1} />);
    expect(screen.getByTestId("confirm-modal")).toBeTruthy();
    fireEvent.click(screen.getByText("Confirm Suggestion"));
    expect(handleSuggestTime).toHaveBeenCalledWith(suggestions[0]);
  });
  
  it("renders member avatar photo and status correctly", () => {
    const suggestions = [
      { 
        start: "2026-04-01T10:00:00Z", label: "10:00 AM", free_count: 1, total_count: 2, 
        members: [{ id: 1, name: "Alice", initials: "A", is_free: true }] 
      }
    ];
    mockAvailability({ suggestions });
    render(<AvailabilityTab projectId={1} />);
    
    expect(screen.getByTitle("Alice")).toBeTruthy();
    fireEvent.click(screen.getByTitle("Alice"));
    expect(window.dispatchEvent).toHaveBeenCalled();
  });

  it("handles avatar fallback when photoUrl is missing", () => {
    const suggestions = [
      { 
        start: "2026-04-01T10:00:00Z", label: "10:00 AM", free_count: 1, total_count: 1, 
        members: [{ id: 1, name: "Alice", initials: "AS", is_free: true }] 
      }
    ];
    mockAvailability({ suggestions });
    avatarUtils.getPhotoUrl.mockReturnValue(null);
    
    render(<AvailabilityTab projectId={1} />);
    expect(screen.getByText("AS")).toBeTruthy();
  });

  it("renders img tag when photoUrl is present in MemberAvatarPhoto", () => {
    const suggestions = [
      { 
        start: "2026-04-01T10:00:00Z", label: "10:00 AM", free_count: 1, total_count: 1, 
        members: [{ id: 1, name: "Alice", initials: "A", is_free: true }] 
      }
    ];
    mockAvailability({ suggestions });
    avatarUtils.getPhotoUrl.mockReturnValue("http://photo.jpg");
    
    render(<AvailabilityTab projectId={1} />);
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toBe("http://photo.jpg");
  });

  it("handles cancelling a proposal", () => {
    const setSuggestingSlot = vi.fn();
    const suggestions = [{ start: "2026-04-01", label: "10:00 AM", free_count: 5, total_count: 5, members: [] }];
    mockAvailability({ suggestions, suggestingSlot: suggestions[0], setSuggestingSlot });
    
    render(<AvailabilityTab projectId={1} />);
    fireEvent.click(screen.getByText("Cancel Suggestion"));
    expect(setSuggestingSlot).toHaveBeenCalledWith(null);
  });
  
  it("renders confirmed meeting cards view", async () => {
    const suggestions = [
      { id: 102, start: "2026-04-01T12:00:00Z", is_confirmed: true, suggested_by: { id: 2, username: "user2" }, responses: [] }
    ];
    mockAvailability({ active_suggestions: suggestions });
    render(<AvailabilityTab projectId={1} />);
    
    fireEvent.click(screen.getByText("Confirmed meeting slots"));
    await waitFor(() => {
        expect(screen.getByText("Confirmed from user2's proposal")).toBeTruthy();
    });
  });
});
