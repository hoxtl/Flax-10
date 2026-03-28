import { describe, expect, it } from "vitest";

import timelineStyles from "../../../../pages/homepage/styles/timelineStyles";
import taskWidgetStyles from "../../../../pages/homepage/styles/timeline/TimelineTaskWidget.module.css";
import cardSpineStyles from "../../../../pages/homepage/styles/timeline/TimelineCardCore.spine-and-card.module.css";
import cardStateStyles from "../../../../pages/homepage/styles/timeline/TimelineCardCore.states-and-conflicts.module.css";
import eventInteractionConflictStyles from "../../../../pages/homepage/styles/timeline/TimelineEventInteraction.conflict.module.css";
import eventInteractionFreeWindowStyles from "../../../../pages/homepage/styles/timeline/TimelineEventInteraction.freeWindow.module.css";
import miniViewStyles from "../../../../pages/homepage/styles/timeline/TimelineMiniView.module.css";
import structureHeaderStyles from "../../../../pages/homepage/styles/timeline/TimelineStructure.header-and-rows.module.css";
import structureGapStyles from "../../../../pages/homepage/styles/timeline/TimelineStructure.gaps-and-quick-add.module.css";
import cardStyles from "../../../../pages/homepage/styles/timeline/TimelineCardStyles.module.css";
import pastAndMissedStyles from "../../../../pages/homepage/styles/timeline/TimelinePastAndMissed.module.css";
import gapWindowBestStyles from "../../../../pages/homepage/styles/timeline/TimelineGapWindows.best-and-short-windows.module.css";
import gapWindowCollapsedStyles from "../../../../pages/homepage/styles/timeline/TimelineGapWindows.collapsed-and-tasks.module.css";
import gapActionStyles from "../../../../pages/homepage/styles/timeline/TimelineGapActions.module.css";
import gapTransitStyles from "../../../../pages/homepage/styles/timeline/TimelineGapTransit.module.css";

describe("timelineStyles", () => {
  it("merges all timeline css modules into a single export", () => {
    const expected = {
      ...taskWidgetStyles,
      ...cardSpineStyles,
      ...cardStateStyles,
      ...eventInteractionConflictStyles,
      ...eventInteractionFreeWindowStyles,
      ...miniViewStyles,
      ...structureHeaderStyles,
      ...structureGapStyles,
      ...cardStyles,
      ...pastAndMissedStyles,
      ...gapWindowBestStyles,
      ...gapWindowCollapsedStyles,
      ...gapActionStyles,
      ...gapTransitStyles,
    };

    expect(timelineStyles).toEqual(expected);
    expect(Object.keys(timelineStyles).length).toBeGreaterThan(0);
  });
});
