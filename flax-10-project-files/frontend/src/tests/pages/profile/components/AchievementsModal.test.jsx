import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AchievementsModal, { AchievementsHeader } from "../../../../pages/profile/components/AchievementsModal";

// Mock StandardModal
vi.mock("../../../../components/common/standard_modal/StandardModal", () => ({
  default: ({ children, onClose }) => (
    <div data-testid="standard-modal">
      <button data-testid="modal-close" onClick={onClose}>Modal Close</button>
      {children}
    </div>
  )
}));

// Mock styles
vi.mock("../../../../pages/profile/styles/AchievementsModal.module.css", () => ({
  default: {
    tile: "tile",
    tileEarned: "tileEarned",
    tileLocked: "tileLocked",
    progressBar: "progressBar",
    closeBtn: "closeBtn",
    tileEmoji: "tileEmoji",
    tileLabel: "tileLabel",
    tileTier: "tileTier",
    tileLockHint: "tileLockHint",
    header: "header",
    title: "title",
    subtitle: "subtitle",
    progressWrap: "progressWrap",
    category: "category",
    catHeader: "catHeader",
    catName: "catName",
    catCount: "catCount",
    grid: "grid",
    body: "body"
  }
}));

describe("AchievementsModal", () => {
  const defaultProps = {
    badges: [{ id: "1hr" }, { id: "streak_3" }],
    onClose: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly with earned and locked badges", () => {
    render(<AchievementsModal {...defaultProps} />);
    
    // Check header
    expect(screen.getByText(/2 \/ 26 unlocked/i)).toBeInTheDocument();
    
    // Check progress bar width (2/26 ~ 7.69%)
    const progressBar = document.querySelector(".progressBar");
    expect(progressBar.style.width).toBe(`${(2 / 26) * 100}%`);
    
    // Check specific badges
    expect(screen.getByText("First Hour")).toBeInTheDocument();
    expect(screen.getByText("⏱️")).toBeInTheDocument(); 
    expect(screen.getByText("On a Roll")).toBeInTheDocument();
    expect(screen.getByText("🔥")).toBeInTheDocument(); 
    
    // Check locked badge
    expect(screen.getByText("Getting Started")).toBeInTheDocument();
    expect(screen.getAllByText("🔒")).toHaveLength(24);
  });

  it("calls onClose when close button or Escape is pressed", () => {
    render(<AchievementsModal {...defaultProps} />);
    
    fireEvent.click(screen.getByLabelText("Close"));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    
    fireEvent.keyDown(window, { key: "Escape" });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(2);
    
    // Test non-escape key
    fireEvent.keyDown(window, { key: "Enter" });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(2);
  });

  it("renders all categories correctly", () => {
    render(<AchievementsModal {...defaultProps} />);
    const categories = ['Hours', 'Sessions', 'Streaks', 'Consistency', 'Style', 'Modules', 'Goals'];
    categories.forEach(cat => {
      expect(screen.getByText(cat)).toBeInTheDocument();
    });
  });

  it("BadgeTile displays correct tier label for earned badges", () => {
    render(<AchievementsModal badges={[{ id: "1hr" }]} onClose={vi.fn()} />);
    expect(screen.getByText("🥉 Bronze")).toBeInTheDocument();
  });

  it("handles zero badges correctly for progress bar and title", () => {
    render(<AchievementsModal badges={[]} onClose={vi.fn()} />);
    expect(screen.getByText(/0 \/ 26 unlocked/i)).toBeInTheDocument();
    expect(screen.getByText("Achievements")).toBeInTheDocument();
    const progressBar = document.querySelector(".progressBar");
    expect(progressBar.style.width).toBe("0%");
  });

  it("handles missing badges prop correctly", () => {
    // Should default to 0 earnings and not crash
    render(<AchievementsModal onClose={vi.fn()} />);
    expect(screen.getByText(/0 \/ 26 unlocked/i)).toBeInTheDocument();
  });

  it("BadgeTile handles locked state detail", () => {
    render(<AchievementsModal badges={[]} onClose={vi.fn()} />);
    expect(screen.getByText("Study for 1 hour total")).toBeInTheDocument();
  });

  it("AchievementsHeader supports zero total badges", () => {
    const onClose = vi.fn();
    render(<AchievementsHeader totalEarned={5} totalBadges={0} onClose={onClose} />);
    const progressBar = document.querySelector(".progressBar");
    expect(progressBar.style.width).toBe("0%");
    fireEvent.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalled();
  });
});
