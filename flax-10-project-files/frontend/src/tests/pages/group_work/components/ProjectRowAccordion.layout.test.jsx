import { it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "./__mocks__/motionAndTooltipMocks.jsx";
import ProjectRowAccordion from "@/pages/group_work/components/ProjectRowAccordion";

it("renders progress track with correct aria-label", () => {
  render(<ProjectRowAccordion percent={75} />);
  expect(screen.getByLabelText("75% completion")).toBeTruthy();
});

it("renders progress track for zero percent", () => {
  render(<ProjectRowAccordion percent={0} />);
  expect(screen.getByLabelText("0% completion")).toBeTruthy();
});
