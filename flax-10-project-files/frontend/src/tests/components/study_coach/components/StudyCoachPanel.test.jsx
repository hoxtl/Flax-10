import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "../../../../utils/testUtils";

vi.mock("../../../../components/study_coach/components/StudyCoachPanelView", () => ({
  default: (props) => <div>panel-view:{props.title}:{props.initialMessage}</div>,
}));

import StudyCoachPanel from "../../../../components/study_coach/components/StudyCoachPanel";

describe("StudyCoachPanel", () => {
  it("forwards props to the panel view", () => {
    render(<StudyCoachPanel title="Coach" initialMessage="Hello" />);
    expect(screen.getByText("panel-view:Coach:Hello")).toBeInTheDocument();
  });
});
