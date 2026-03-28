import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import AvailabilityTab from "@/pages/group_work/components/AvailabilityTab";

const useAvailabilityMock = vi.fn();
const confirmHook = vi.fn();

vi.mock("@/context/ConfirmContext", () => ({
  useConfirm: () => confirmHook,
}));

vi.mock("../../../../pages/group_work/hooks/useAvailability", () => ({
  useAvailability: (...args) => useAvailabilityMock(...args),
}));

vi.mock("@/components/common/tooltip/Tooltip", () => ({
  default: ({ children, content }) => <div title={content}>{children}</div>,
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
  Search: () => <span>search-icon</span>,
  Star: () => <span>star-icon</span>,
  Trash2: () => <span>trash-icon</span>,
}));

const proposedSuggestion = {
  id: 10,
  start: "2026-04-10T14:00:00Z",
  is_confirmed: false,
  suggested_by: { id: 2, username: "bob" },
  member_statuses: [{ id: 2, username: "bob", status: "accepted" }],
};

const confirmedSuggestion = {
  id: 20,
  start: "2026-04-11T09:00:00Z",
  is_confirmed: true,
  suggested_by: { id: 3, username: "carol" },
  member_statuses: [{ id: 3, username: "carol", status: "accepted" }],
};

describe("AvailabilityTab - Meeting Cards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders proposed cards and handles voting", () => {
    const handleVote = vi.fn();
    useAvailabilityMock.mockReturnValue({
      loading: false,
      active_suggestions: [proposedSuggestion],
      current_user_id: 1,
      suggestions: [],
      handleVote,
      handleDelete: vi.fn(),
    });

    render(<AvailabilityTab projectId={1} />);
    expect(screen.getByText(/Proposed by bob/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByLabelText("Accept meeting suggestion")[0]);
    expect(handleVote).toHaveBeenCalledWith(10, "accepted");
  });

  it("renders confirmed cards in the confirmed view", () => {
    useAvailabilityMock.mockReturnValue({
      loading: false,
      active_suggestions: [confirmedSuggestion],
      current_user_id: 1,
      suggestions: [],
      handleVote: vi.fn(),
      handleDelete: vi.fn(),
    });

    render(<AvailabilityTab projectId={1} />);
    fireEvent.click(screen.getByText("Confirmed meeting slots"));
    expect(screen.getByText(/Confirmed from carol/)).toBeInTheDocument();
  });

  it("renders delete button for user's own suggestions", () => {
    const handleDelete = vi.fn();
    useAvailabilityMock.mockReturnValue({
      loading: false,
      active_suggestions: [proposedSuggestion],
      current_user_id: 2, // matches bob's id
      suggestions: [],
      handleVote: vi.fn(),
      handleDelete,
    });

    render(<AvailabilityTab projectId={1} />);
    fireEvent.click(screen.getByLabelText("Delete meeting suggestion"));
    expect(handleDelete).toHaveBeenCalledWith(10);
  });
});
