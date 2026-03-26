/*
 * Persona, study DNA, and heatmap profile widget tests.
 */

import { describe, it, vi } from "vitest";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: { div: ({ children, ...props }) => <div {...props}>{children}</div> },
}));

vi.mock("../../../../api/moduleApi", () => ({
  getModules: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../../../pages/Profile/components/widgets/attendance/useAttendanceWidgetData", () => ({
  useAttendanceWidgetData: vi.fn(),
}));

vi.mock("@mui/x-charts/PieChart", () => ({
  PieChart: (props) => <div data-testid="pie-chart" data-hide-legend={props.hideLegend ? "true" : "false"} />,
}));

vi.mock("../../../../pages/Attendance/components/SegmentDetailPanel", () => ({
  default: () => <div data-testid="segment-detail-panel" />,
}));

import { expect, fireEvent, MiniHeatmap, PersonaCard, render, screen, StudyDNA } from "./ProfileWidgets.shared.jsx";

describe("PersonaCard", () => {
  it("returns null when persona is null", () => {
    const { container } = render(<PersonaCard persona={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders persona label and description", () => {
    render(<PersonaCard persona={{ label: "Night Owl", emoji: "🦉", description: "You study best at night." }} />);
    expect(screen.getByText("Night Owl")).toBeTruthy();
    expect(screen.getByText("You study best at night.")).toBeTruthy();
  });

  it("renders peak label with am when peakHour < 12", () => {
    render(<PersonaCard persona={{ label: "Early Bird", emoji: "🐦", description: "Morning person." }} peakHour={9} />);
    expect(screen.getByText(/Based on your 9am peak/)).toBeTruthy();
  });

  it("renders peak label with pm when peakHour >= 12", () => {
    render(<PersonaCard persona={{ label: "Night Owl", emoji: "🦉", description: "Late night." }} peakHour={14} />);
    expect(screen.getByText(/Based on your 2pm peak/)).toBeTruthy();
  });

  it("renders peak label with 12pm when peakHour is 12", () => {
    render(<PersonaCard persona={{ label: "Noon", emoji: "☀️", description: "Midday." }} peakHour={12} />);
    expect(screen.getByText(/Based on your 12pm peak/)).toBeTruthy();
  });

  it("does not render peak label when peakHour is null", () => {
    render(<PersonaCard persona={{ label: "Unknown", emoji: "❓", description: "No data." }} peakHour={null} />);
    expect(screen.queryByText(/Based on your/)).toBeNull();
  });
});

describe("StudyDNA", () => {
  it("returns null when heatmap is missing", () => {
    const { container } = render(<StudyDNA />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when heatmap.data is missing", () => {
    const { container } = render(<StudyDNA heatmap={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders segments and legend with mixed period data", () => {
    const heatmap = { data: Array.from({ length: 7 }, () => Array.from({ length: 24 }, (_, hour) => getHeatmapCellValue(hour))) };
    render(<StudyDNA heatmap={heatmap} />);
    expect(screen.getByText("STUDY DNA")).toBeTruthy();
    expect(screen.getByText("Morning")).toBeTruthy();
    expect(screen.getByText("Afternoon")).toBeTruthy();
    expect(screen.getByText("Evening")).toBeTruthy();
    expect(screen.getByText("Night")).toBeTruthy();
  });
});

function getHeatmapCellValue(hour) {
  if (hour >= 5 && hour < 12) return 60;
  if (hour >= 12 && hour < 17) return 30;
  if (hour >= 17 && hour < 21) return 45;
  return 15;
}

describe("MiniHeatmap", () => {
  it("returns null when heatmap.data is missing", () => {
    const { container } = render(<MiniHeatmap heatmap={{}} onNavigate={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders and calls onNavigate on click", () => {
    const onNavigate = vi.fn();
    render(<MiniHeatmap heatmap={buildHeatmap()} onNavigate={onNavigate} />);
    expect(screen.getByText("STUDY ACTIVITY")).toBeTruthy();
    expect(screen.getByText("View full analytics")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /View full analytics|STUDY ACTIVITY/ }));
    expect(onNavigate).toHaveBeenCalledWith("analytics");
  });

  it("calls onNavigate on Enter key", () => {
    const onNavigate = vi.fn();
    render(<MiniHeatmap heatmap={buildHeatmap()} onNavigate={onNavigate} />);
    fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });
    expect(onNavigate).toHaveBeenCalledWith("analytics");
  });

  it("calls onNavigate on Space key", () => {
    const onNavigate = vi.fn();
    render(<MiniHeatmap heatmap={buildHeatmap()} onNavigate={onNavigate} />);
    fireEvent.keyDown(screen.getByRole("button"), { key: " " });
    expect(onNavigate).toHaveBeenCalledWith("analytics");
  });

  it("renders activity cells for non-zero study data", () => {
    render(<MiniHeatmap heatmap={{ data: [Array.from({ length: 24 }, (_, hour) => (hour === 2 ? 30 : 0))] }} onNavigate={vi.fn()} />);
    expect(document.querySelectorAll('[class*="heatmapCell"]').length).toBeGreaterThan(0);
  });
});

function buildHeatmap() {
  return { data: Array.from({ length: 7 }, () => Array(24).fill(0)) };
}
