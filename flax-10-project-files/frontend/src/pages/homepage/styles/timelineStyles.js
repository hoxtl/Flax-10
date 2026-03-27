import taskWidgetStyles from "./timeline/TimelineTaskWidget.module.css";
import cardSpineStyles from "./timeline/TimelineCardCore.spine-and-card.module.css";
import cardStateStyles from "./timeline/TimelineCardCore.states-and-conflicts.module.css";
import eventInteractionStyles from "./timeline/TimelineEventInteraction.module.css";
import miniViewStyles from "./timeline/TimelineMiniView.module.css";
import structureHeaderStyles from "./timeline/TimelineStructure.header-and-rows.module.css";
import structureGapStyles from "./timeline/TimelineStructure.gaps-and-quick-add.module.css";
import cardStyles from "./timeline/TimelineCardStyles.module.css";
import pastAndMissedStyles from "./timeline/TimelinePastAndMissed.module.css";
import gapWindowBestStyles from "./timeline/TimelineGapWindows.best-and-short-windows.module.css";
import gapWindowCollapsedStyles from "./timeline/TimelineGapWindows.collapsed-and-tasks.module.css";
import gapActionStyles from "./timeline/TimelineGapActions.module.css";
import gapTransitStyles from "./timeline/TimelineGapTransit.module.css";

const timelineStyles = {
  ...taskWidgetStyles,
  ...cardSpineStyles,
  ...cardStateStyles,
  ...eventInteractionStyles,
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

export default timelineStyles;
