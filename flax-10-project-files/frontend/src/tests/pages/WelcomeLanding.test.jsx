import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import WelcomeLanding from "../../pages/welcome/WelcomeLanding";

let mockQuote = "A calm start goes a long way";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className, style }) => (
      <div className={className} style={style}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock("../../components/welcome/WelcomeBackgroundPaths", () => ({
  default: () => <div data-testid="bg-paths" />,
}));

vi.mock("../../lib/quotes", () => ({
  pickWelcomeQuoteByKey: () => mockQuote,
}));

vi.mock("../../components/calendar/utils/dateUtils", () => ({
  getGreeting: () => "Good morning",
}));

const defaultProps = (overrides = {}) => ({
  user: { first_name: "Jane" },
  onExplore: vi.fn(),
  onBackToAuth: vi.fn(),
  ...overrides,
});

describe("WelcomeLanding", () => {
  beforeEach(() => {
    mockQuote = "A calm start goes a long way";
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("renders background paths", () => {
    render(<WelcomeLanding {...defaultProps()} />);
    expect(screen.getByTestId("bg-paths")).toBeInTheDocument();
  });

  it("renders brand name and tagline", () => {
    render(<WelcomeLanding {...defaultProps()} />);
    expect(screen.getByText("STUDYFLAX")).toBeInTheDocument();
    expect(screen.getByText("Built for calm study.")).toBeInTheDocument();
  });

  it("renders greeting with first name", () => {
    render(<WelcomeLanding {...defaultProps({ user: { first_name: "Jane" } })} />);
    expect(screen.getByText("Good morning, Jane.")).toBeInTheDocument();
  });

  it("renders greeting without first name when user has none", () => {
    render(<WelcomeLanding {...defaultProps({ user: { first_name: "" } })} />);
    expect(screen.getByText("Good morning.")).toBeInTheDocument();
  });

  it("renders greeting without first name when user is null", () => {
    render(<WelcomeLanding {...defaultProps({ user: null })} />);
    expect(screen.getByText("Good morning.")).toBeInTheDocument();
  });

  it("renders the quote", () => {
    render(<WelcomeLanding {...defaultProps()} />);
    expect(screen.getByText("A calm start goes a long way.")).toBeInTheDocument();
  });

  it("renders the current time", () => {
    const now = new Date(2026, 1, 16, 14, 5, 0);
    vi.setSystemTime(now);
    render(<WelcomeLanding {...defaultProps()} />);
    expect(screen.getByText("14:05")).toBeInTheDocument();
  });

  it("calls onExplore when Explore button clicked", () => {
    const onExplore = vi.fn();
    render(<WelcomeLanding {...defaultProps({ onExplore })} />);
    fireEvent.click(screen.getByText("Explore StudyFlax"));
    expect(onExplore).toHaveBeenCalledTimes(1);
  });

  it("calls onBackToAuth when back button clicked", () => {
    const onBackToAuth = vi.fn();
    render(<WelcomeLanding {...defaultProps({ onBackToAuth })} />);
    fireEvent.click(screen.getByText("Back to sign in"));
    expect(onBackToAuth).toHaveBeenCalledTimes(1);
  });

  it("tutorial button is disabled", () => {
    render(<WelcomeLanding {...defaultProps()} />);
    expect(screen.getByText(/Watch tutorial/i)).toBeDisabled();
  });

  it("renders footer version note", () => {
    render(<WelcomeLanding {...defaultProps()} />);
    expect(screen.getByText("v1")).toBeInTheDocument();
  });

  it("updates time after 1 minute tick", () => {
    vi.setSystemTime(new Date(2026, 1, 16, 9, 0, 0));
    render(<WelcomeLanding {...defaultProps()} />);
    expect(screen.getByText("09:00")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.getByText("09:01")).toBeInTheDocument();
  });

  it("renders with night tone when hour is late", () => {
    vi.setSystemTime(new Date(2026, 1, 16, 23, 0, 0));
    render(<WelcomeLanding {...defaultProps()} />);
    expect(screen.getByText("23:00")).toBeInTheDocument();
  });

  it("uses day tone class between 12-17", () => {
    vi.setSystemTime(new Date(2026, 1, 16, 13, 0, 0));
    const { container } = render(<WelcomeLanding {...defaultProps()} />);
    expect(container.firstChild.className).toMatch(/day/i);
  });

  it("uses evening tone class between 18-21", () => {
    vi.setSystemTime(new Date(2026, 1, 16, 19, 0, 0));
    const { container } = render(<WelcomeLanding {...defaultProps()} />);
    expect(container.firstChild.className).toMatch(/evening/i);
  });

  it("handles falsy quote values (cleanQuote branch coverage)", () => {
    mockQuote = false; 
    render(<WelcomeLanding {...defaultProps()} />);
    expect(screen.getByText(".")).toBeInTheDocument();
  });
});
