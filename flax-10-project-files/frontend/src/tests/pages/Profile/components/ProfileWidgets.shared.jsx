/*
 * Shared profile widget test setup.
 * NOTE: vi.mock calls must be placed in each individual test file (not here)
 * so that vitest can hoist them before any imports execute.
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
