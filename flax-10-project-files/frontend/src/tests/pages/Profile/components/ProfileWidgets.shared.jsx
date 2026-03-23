/*
 * Shared profile widget test setup.
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, expect, vi } from "vitest";
import {
  BadgesSection,
  CompactAttendanceTile,
  MiniHeatmap,
  ModulesSection,
  PersonaCard,
  SocietiesSection,
  StudyDNA,
  ThisWeek,
} from "../../../../pages/Profile/components/ProfileWidgets";
import { useAttendanceWidgetData } from "../../../../pages/Profile/components/widgets/attendance/useAttendanceWidgetData";

export { beforeEach, expect, fireEvent, render, screen, vi, waitFor };
export { BadgesSection, CompactAttendanceTile, MiniHeatmap, ModulesSection, PersonaCard, SocietiesSection, StudyDNA, ThisWeek, useAttendanceWidgetData };

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: { div: ({ children, ...props }) => <div {...props}>{children}</div> },
}));

vi.mock("../../../../api/moduleApi", () => ({
  getModules: vi.fn().mockResolvedValue([
    { module_code: "CS101", module_name: "Intro to CS" },
    { module_code: "MA102", module_name: "Calculus" },
  ]),
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
