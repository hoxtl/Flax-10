import { useEffect, useMemo, useState } from "react";
import analyticsService from "../../../api/analyticsApi";
import { fetchApi } from "../../../api/client";

const PROFILE_ANALYTICS_PERIOD = 90;

export function useProfileAnalytics(canViewAnalytics) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!canViewAnalytics) return;
    analyticsService.getSummary(PROFILE_ANALYTICS_PERIOD).then(setData).catch(() => {});
  }, [canViewAnalytics]);

  return data;
}

function computePeakHour(grid) {
  if (!grid) return null;
  const totals = Array.from({ length: 24 }, (_, hour) =>
    grid.reduce((sum, row) => sum + (row[hour] || 0), 0),
  );
  const maxTotal = Math.max(...totals);
  return maxTotal > 0 ? totals.indexOf(maxTotal) : null;
}

export function usePeakHour(heatmapData) {
  return useMemo(() => computePeakHour(heatmapData), [heatmapData]);
}

export function useCurrentUserSummary(isSelf) {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (isSelf) return;
    fetchApi("/profile/summary/").then(setSummary).catch(() => {});
  }, [isSelf]);

  return summary;
}

export function useSuggestionState(viewedUserId) {
  const [state, setState] = useState("idle");

  const submit = async () => {
    if (!viewedUserId || state === "sending") return;
    setState("sending");
    try {
      await fetchApi("/profile/study-together/", {
        method: "POST",
        body: JSON.stringify({ target_user_id: viewedUserId }),
      });
      setState("sent");
    } catch {
      setState("error");
    }
  };

  return { state, submit };
}

export function saveWeeklyGoal(goalHours, refetch) {
  return fetchApi("/profile/", {
    method: "PATCH",
    body: JSON.stringify({ weekly_goal_hours: goalHours }),
  }).then(refetch);
}
