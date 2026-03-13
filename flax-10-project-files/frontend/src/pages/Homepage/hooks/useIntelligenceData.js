import { useProfileSummary } from "../../Profile/hooks/useProfileSummary";
import {
  getNextWindowMeta,
  getLiveContext,
  getCurrentEvent,
  getUpcomingEvent,
} from "../components/IntelligenceUtils";

export function useIntelligenceData(slot5Data, studyPulseWindows, studyPulseNow) {
  const { summary, loading: profileLoading } = useProfileSummary();
  const sortedEvents = Array.isArray(slot5Data?.sortedEvents) ? slot5Data.sortedEvents : [];
  const bannerNow = slot5Data?.now ?? new Date();

  const liveContext = getLiveContext({
    currentEvent: getCurrentEvent(sortedEvents, bannerNow),
    upcomingEvent: getUpcomingEvent(sortedEvents, bannerNow),
    overlaps: slot5Data?.navigatorContext?.overlaps,
    tflDelays: [],
    now: bannerNow,
  });

  const nextWindowMeta = getNextWindowMeta(studyPulseWindows, studyPulseNow ?? new Date());
  
  return {
    sortedEvents,
    liveContext,
    nextWindowMeta,
    pendingTasks: (slot5Data?.taskWidgetItemsOnly ?? []).filter((t) => !t.completed),
    ...deriveProfileMeta(summary, profileLoading),
  };
}

function deriveProfileMeta(summary, loading) {
  if (loading || !summary) return { weeklyProgress: null, currentStreak: null };
  const { weekly, streaks } = summary;
  return {
    weeklyProgress: Number.isFinite(weekly?.percentage) ? `${Math.round(weekly.percentage)}% weekly goal` : null,
    currentStreak: Number.isFinite(streaks?.current) && streaks.current > 0 ? `${streaks.current}-day streak` : null,
  };
}
