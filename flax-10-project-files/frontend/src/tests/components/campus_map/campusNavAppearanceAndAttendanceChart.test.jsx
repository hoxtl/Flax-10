import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const barChartSpy = vi.fn();

vi.mock("../../../components/settings/components/SettingsContextCard", () => ({
  default: ({ emoji, title, items }) => (
    <div data-testid="context-card">
      <span>{emoji}</span>
      <span>{title}</span>
      <span>{items.join(" | ")}</span>
    </div>
  ),
}));

vi.mock("../../../components/settings/components/SettingsUI", () => ({
  SectionHeader: ({ title }) => <div>{title}</div>,
  SubmitButton: ({ label }) => <button type="button">{label}</button>,
  ThemeGridSelector: ({ value, onChange }) => (
    <button type="button" onClick={() => onChange("aurora")}>grid:{value}</button>
  ),
  ThemeSelector: ({ value, onChange }) => (
    <button type="button" onClick={() => onChange("dark")}>mode:{value}</button>
  ),
}));

vi.mock("@mui/x-charts/BarChart", () => ({
  BarChart: (props) => {
    barChartSpy(props);
    return <div data-testid="attendance-bar-chart" />;
  },
}));

vi.mock("../../../components/analytics/utils/chartColors", () => ({
  getChartSx: (...args) => ({ mockSx: args }),
}));

vi.mock("../../../components/analytics/utils/attendanceChartConfig", () => ({
  getAttendanceMargin: (isMobile) => ({ mobile: isMobile }),
  getAttendanceSeries: (types, byType) => [{ types, byType }],
}));

import { CampusQuickNav } from "../../../components/campus_map/components/CampusQuickNav";
import AttendanceBarChart from "../../../components/analytics/components/AttendanceBarChart";
import AppearanceSection from "../../../components/settings/preferences/AppearanceSection";
import RequestDecisionNotice from "../../../components/settings/ui/RequestDecisionNotice";
import { KCL_CAMPUSES } from "../../../lib/kclCampuses";

describe("small coverage extras", () => {
  it("flies to selected campuses from the quick-nav buttons", () => {
    const onFly = vi.fn();
    render(<CampusQuickNav onFly={onFly} />);

    fireEvent.click(screen.getByTitle("Strand Campus"));
    fireEvent.click(screen.getByTitle("Guy's Campus"));

    expect(onFly).toHaveBeenNthCalledWith(1, KCL_CAMPUSES[0]);
    expect(onFly).toHaveBeenNthCalledWith(2, KCL_CAMPUSES[1]);
  });

  it("renders the appearance section and merges mode/theme updates", () => {
    const onChange = vi.fn();
    render(
      <AppearanceSection
        theme={{ mode: "light", theme: "flax" }}
        onChange={onChange}
        isSaving={false}
        hasUnsaved
        saveSignal={2}
      />,
    );

    expect(screen.getByText("Appearance")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Appearance" })).toBeInTheDocument();
    expect(screen.getByTestId("context-card")).toHaveTextContent("Picking a theme");

    fireEvent.click(screen.getByText("mode:light"));
    fireEvent.click(screen.getByText("grid:flax"));

    expect(onChange).toHaveBeenNthCalledWith(1, { mode: "dark", theme: "flax" });
    expect(onChange).toHaveBeenNthCalledWith(2, { mode: "light", theme: "aurora" });
  });

  it("shows the request decision warning copy", () => {
    render(<RequestDecisionNotice />);

    expect(screen.getByText("⚠️")).toBeInTheDocument();
    expect(screen.getByText(/accepted or rejected/i)).toBeInTheDocument();
    expect(screen.getByText(/You'll be notified once a decision is made/i)).toBeInTheDocument();
  });

  it("builds the attendance bar chart with derived axis, margin, and series props", () => {
    render(
      <AttendanceBarChart
        byType={{ Lecture: { attended: 4, missed: 1 } }}
        gridColor="#ddd"
        isMobile={true}
        textColor="#111"
        types={["Lecture"]}
      />,
    );

    expect(screen.getByTestId("attendance-bar-chart")).toBeInTheDocument();
    expect(barChartSpy).toHaveBeenCalledWith(expect.objectContaining({
      height: 240,
      margin: { mobile: true },
      grid: { horizontal: true },
      series: [{ types: ["Lecture"], byType: { Lecture: { attended: 4, missed: 1 } } }],
      xAxis: [{ scaleType: "band", data: ["Lecture"], tickLabelStyle: { fill: "#111", fontSize: 11 } }],
      yAxis: [{ tickLabelStyle: { fill: "#111", fontSize: 11 } }],
      sx: { mockSx: ["#111", "#ddd"] },
    }));
  });
});
