import { vi } from "vitest";

export const mockUseCountUp = vi.fn();
export const mockGetProgressStats = vi.fn();
export const mockGetNextDeadline = vi.fn();

let lastStatStripItems = [];

vi.mock("@/hooks/useCountUp", () => ({
  useCountUp: (...args) => mockUseCountUp(...args),
}));

vi.mock("@/components/common/stat_strip/StatStrip", () => ({
  default: ({ items }) => {
    lastStatStripItems = items;
    return (
      <div data-testid="stat-strip">
        {items.map((item) => `${item.label}:${item.value}${item.suffix || ""}`).join("|")}
      </div>
    );
  },
}));

vi.mock("@/pages/group_work/utils/projectStatsUtils", () => ({
  getProgressStats: (...args) => mockGetProgressStats(...args),
  getNextDeadline: (...args) => mockGetNextDeadline(...args),
}));

export function resetGroupWorkStatsMocks() {
  mockUseCountUp.mockReset();
  mockUseCountUp.mockImplementation((value) => ({ current: value }));
  mockGetProgressStats.mockReset();
  mockGetNextDeadline.mockReset();
  lastStatStripItems = [];
}

export function getLastStatStripSnapshot() {
  return lastStatStripItems;
}
