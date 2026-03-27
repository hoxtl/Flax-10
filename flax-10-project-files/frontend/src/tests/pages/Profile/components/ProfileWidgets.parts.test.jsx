import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mockUseCountUp = vi.fn();

vi.mock("../../../../hooks/useCountUp", () => ({
  useCountUp: (...args) => mockUseCountUp(...args),
}));

vi.mock("../../../../components/common/stat_strip/StatStrip", () => ({
  default: ({ items }) => (
    <div data-testid="stat-strip">
      {items.map((item) => `${item.label}:${item.value}${item.suffix || ""}`).join("|")}
    </div>
  ),
}));

vi.mock("../../../../components/common/Card/Card", () => ({
  default: ({ children, className }) => <div data-testid="card" className={className}>{children}</div>,
}));

import { QuickStatsRail } from "../../../../pages/profile/components/widgets/QuickStatsRail";
import { StudyDNA } from "../../../../pages/profile/components/widgets/StudyDNA";
import { PersonaCard } from "../../../../pages/profile/components/widgets/PersonaCard";

describe("Profile low-coverage widgets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCountUp.mockImplementation(() => ({ current: null }));
  });

  it("renders quick stats with rounded hours and can hide zero-value items", () => {
    const { rerender, container } = render(
      <QuickStatsRail totalHours={12.7} sessionCount={0} moduleCount={3} hideZeroItems={false} />,
    );
    expect(screen.getByTestId("stat-strip")).toHaveTextContent("Total Focus:13h|Sessions:0|Modules:3");

    rerender(<QuickStatsRail totalHours={0} sessionCount={0} moduleCount={0} hideZeroItems />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders study dna segments and filters out empty periods", () => {
    render(
      <StudyDNA
        heatmap={{
          data: [
            Array.from({ length: 24 }, (_, hour) => {
              if (hour === 6) return 60;
              if (hour === 14) return 30;
              if (hour === 19) return 30;
              return 0;
            }),
          ],
        }}
      />,
    );

    expect(screen.getByText("STUDY DNA")).toBeTruthy();
    expect(screen.getByText("Morning")).toBeTruthy();
    expect(screen.getByText("Afternoon")).toBeTruthy();
    expect(screen.getByText("Evening")).toBeTruthy();
    expect(screen.queryByText("Night")).toBeNull();
  });

  it("renders persona copy with and without a peak-hour label", () => {
    const persona = { label: "Deep Diver", emoji: "🧠", description: "You like long, focused sessions." };
    const { rerender, container } = render(<PersonaCard persona={null} peakHour={13} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<PersonaCard persona={persona} peakHour={13} />);
    expect(screen.getByText("Deep Diver")).toBeTruthy();
    expect(screen.getByText("Based on your 1pm peak")).toBeTruthy();

    rerender(<PersonaCard persona={persona} peakHour={null} />);
    expect(screen.queryByText(/Based on your/)).toBeNull();
  });
});
