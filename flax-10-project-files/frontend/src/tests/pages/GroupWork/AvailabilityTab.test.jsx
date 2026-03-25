import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import AvailabilityTab from "../../../pages/GroupWork/AvailabilityTab";

const useAvailabilityMock = vi.fn();
const confirmHook = vi.fn();

vi.mock("../../../context/ConfirmContext", () => ({
  useConfirm: () => confirmHook,
}));

vi.mock("../../../pages/GroupWork/hooks/useAvailability", () => ({
  useAvailability: (...args) => useAvailabilityMock(...args),
}));

vi.mock("../../../components/common/Tooltip/Tooltip", () => ({
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
  Star: () => <span>star-icon</span>,
  Trash2: () => <span>trash-icon</span>,
}));

const baseModel = {
  loading: false,
  suggestions: [
    {
      start: "2026-04-10T10:00:00Z",
      label: "Thu 10 Apr · 10:00-11:00",
      free_count: 2,
      total_count: 2,
      members: [{ id: 1, name: "Alice", is_free: true, initials: "A" }],
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

describe("AvailabilityTab - General", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state", () => {
    useAvailabilityMock.mockReturnValue({ ...baseModel, loading: true });
    render(<AvailabilityTab projectId={1} />);
    expect(screen.getByText(/Analysing member calendars/)).toBeInTheDocument();
  });

  it("renders slot list and Propose buttons", () => {
    useAvailabilityMock.mockReturnValue(baseModel);
    render(<AvailabilityTab projectId={1} />);
    expect(screen.getByText(/Propose meeting timings/)).toBeInTheDocument();
    expect(screen.getAllByText(/Propose/).length).toBeGreaterThan(0);
  });

  it("opens suggestion confirmation when Propose is clicked", () => {
    const setSuggestingSlot = vi.fn();
    useAvailabilityMock.mockReturnValue({ ...baseModel, setSuggestingSlot });
    render(<AvailabilityTab projectId={1} />);
    const proposeBtn = screen.getAllByRole("button").find(b => b.textContent.includes("Propose"));
    fireEvent.click(proposeBtn);
    expect(setSuggestingSlot).toHaveBeenCalledWith(baseModel.suggestions[0]);
  });
});
