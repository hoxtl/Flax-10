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
    </div>
  ),
}));

vi.mock("../../../components/common/SearchEmptyState/SearchEmptyState", () => ({
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
};

const partialFreeSlot = {
  free_count: 1,
  label: "Thu 11:00",
  members: [
    { id: 3, initials: "CY", is_free: false, name: "Cy" },
    { id: 4, initials: "DE", is_free: true, name: "Dee", profile_photo_url: "https://example.com/dee.jpg" },
  ],
  start: "2026-04-12T11:00:00.000Z",
  total_count: 2,
};

describe("AvailabilityTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
  });

  it("renders the empty state and footer guidance when no meeting cards exist yet", () => {
    useAvailabilityMock.mockReturnValue(
      buildModel({
        suggestions: [freeSlot],
      }),
    );

    render(<AvailabilityTab projectId={12} />);

    expect(screen.getByText("Green rings mean free, muted rings mean busy, and starred slots are fully open for the whole team.")).toBeInTheDocument();
    expect(screen.getByText("2/2 free")).toBeInTheDocument();
    expect(screen.getByTitle("Alex")).toBeInTheDocument();
    expect(screen.getByTitle("Bea")).toBeInTheDocument();
    expect(screen.queryByText(/No proposed meeting slots yet/)).not.toBeInTheDocument();
  });

  it("hides the delete action for non-suggesters and falls back counts and status from member data", () => {
    useAvailabilityMock.mockReturnValue(
      buildModel({
        active_suggestions: [
          {
            ...proposedSuggestion,
            accepted_count: undefined,
            pending_count: undefined,
            rejected_count: undefined,
            suggested_by: { id: 9, username: "charlie" },
          },
        ],
        current_user_id: 2,
        suggestions: [],
      }),
    );

    render(<AvailabilityTab projectId={88} />);

    expect(screen.queryByLabelText("Delete meeting suggestion")).not.toBeInTheDocument();
    expect(screen.getAllByText("1")).not.toHaveLength(0);
    expect(screen.getByTitle("@bea · pending")).toBeInTheDocument();
  });

  it("cancels a slot suggestion modal without submitting and shows fallback initials for members without photos", () => {
    let availability = buildModel({
      active_suggestions: [],
      setSuggestingSlot: vi.fn((slot) => {
        availability = { ...availability, suggestingSlot: slot };
      }),
      suggestions: [partialFreeSlot],
    });

    useAvailabilityMock.mockImplementation(() => availability);

    const { rerender } = render(<AvailabilityTab projectId={77} />);

    expect(screen.getByText("1/2 free")).toBeInTheDocument();
    expect(screen.getByText("CY")).toBeInTheDocument();
    expect(screen.getByTitle("@Cy · busy")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Propose"));
    rerender(<AvailabilityTab projectId={77} />);

    expect(screen.getByTestId("confirm-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cancel"));

    expect(availability.setSuggestingSlot).toHaveBeenCalledWith(partialFreeSlot);
    expect(availability.setSuggestingSlot).toHaveBeenCalledWith(null);
    expect(availability.handleSuggestTime).not.toHaveBeenCalled();
  });
});
