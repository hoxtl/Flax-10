import { describe, expect, it, vi } from "vitest";
import {
  buildAlertState,
  buildRightNowDataProps,
  buildRightNowViewProps,
  buildTimerSessionViewModel,
  buildTodayHeaderMeta,
  buildTodayViewModel,
  buildViewContext,
  buildWidgetProps,
  formatTimerLabel,
  timerProgress,
} from "@/pages/homepage/components/rightNowWidget.viewmodel.js";

vi.mock("@/pages/homepage/utils/dateFormatUtils", () => ({
  formatTime: () => "09:15",
}));

describe("rightNowWidget.viewmodel", () => {
  it("pads timer labels and clamps progress", () => {
    expect(formatTimerLabel(65)).toBe("01:05");
    expect(formatTimerLabel(-10)).toBe("00:00");
    expect(timerProgress(25, 0)).toBe(100);
    expect(timerProgress(25, 25 * 60 + 60)).toBe(0);
  });

  it("uses plural labels when several tasks remain in the meta line", () => {
    expect(buildTodayHeaderMeta(0, 2)).toMatch(/tasks left/);
  });

  it("builds timer session models for work and break modes", () => {
    const work = buildTimerSessionViewModel({
      breakTime: 5, liveClock: "10:00", onOpenTimer: vi.fn(),
      timeLeft: 60, timerMode: "work", timerTask: { title: "A" }, workTime: 25,
    });
    expect(work.isBreak).toBe(false);
    expect(work.progressPct).toBeGreaterThan(0);

    const br = buildTimerSessionViewModel({
      breakTime: 10, liveClock: "10:00", onOpenTimer: vi.fn(),
      timeLeft: 120, timerMode: "break", timerTask: null, workTime: 25,
    });
    expect(br.isBreak).toBe(true);
  });

  it("builds timer session models with zero-time fallbacks", () => {
    const brFallback = buildTimerSessionViewModel({
      breakTime: 0, liveClock: "10:00", onOpenTimer: vi.fn(),
      timeLeft: 30, timerMode: "break", timerTask: null, workTime: 25,
    });
    expect(brFallback.progressPct).toBeGreaterThan(0);

    const workFallback = buildTimerSessionViewModel({
      breakTime: 5, liveClock: "11:00", onOpenTimer: vi.fn(),
      timeLeft: 60, timerMode: "work", timerTask: { title: "B" }, workTime: 0,
    });
    expect(workFallback.progressPct).toBeGreaterThan(0);
  });

  it("composes header meta and alert bindings", () => {
    expect(buildTodayHeaderMeta(2, 1)).toContain("events");
    expect(buildTodayHeaderMeta(1, 0)).toBe("1 event");
    expect(buildTodayHeaderMeta(0, 1)).toBe("1 task left");
    expect(buildTodayHeaderMeta(0, 0)).toBe("");

    const alert = buildAlertState({
      leaveByInfo: { ok: true },
      showConflictAlert: true,
      showTfl: true,
      showTflAlert: true,
    });
    alert.onDismissTfl(vi.fn())();
    alert.onDismissConflict(vi.fn())();
    expect(alert.showTflAlert).toBe(true);
  });

  it("summarises today label as 'In session' when a current block exists", () => {
    const model = buildTodayViewModel({
      conflicts: [], commuteInfo: null, countdown: null,
      currentBlock: { id: 1 }, currentProgressPct: 40, eventCount: 2,
      leaveByInfo: null, loadingCommute: false, nextCampus: null, nextEvent: null,
      setShowConflictAlert: vi.fn(), setShowTflAlert: vi.fn(),
      showConflictAlert: false, showTfl: false, showTflAlert: false,
      taskWidgetItemsOnly: [], tasksPending: 1, timeLeftStr: "3m", timeRangeStr: "9–10",
    });
    expect(model.label).toBe("In session");
  });

  it("summarises today label as 'Up next' when no current block but next event exists", () => {
    const upcoming = buildTodayViewModel({
      conflicts: [], commuteInfo: null, countdown: null,
      currentBlock: null, currentProgressPct: 0, eventCount: 0,
      leaveByInfo: null, loadingCommute: false, nextCampus: null, nextEvent: { title: "Lab" },
      setShowConflictAlert: vi.fn(), setShowTflAlert: vi.fn(),
      showConflictAlert: false, showTfl: false, showTflAlert: false,
      taskWidgetItemsOnly: [], tasksPending: 0, timeLeftStr: null, timeRangeStr: null,
    });
    expect(upcoming.label).toBe("Up next");
  });

  it("summarises today label as 'Free now' when idle with no events or tasks", () => {
    const idle = buildTodayViewModel({
      conflicts: [], commuteInfo: null, countdown: null,
      currentBlock: null, currentProgressPct: 0, eventCount: 0,
      leaveByInfo: null, loadingCommute: false, nextCampus: null, nextEvent: null,
      setShowConflictAlert: vi.fn(), setShowTflAlert: vi.fn(),
      showConflictAlert: false, showTfl: false, showTflAlert: false,
      taskWidgetItemsOnly: [], tasksPending: 0, timeLeftStr: null, timeRangeStr: null,
    });
    expect(idle.label).toBe("Free now");
  });

  it("projects right-now view props and completed count", () => {
    const now = new Date("2026-03-24T12:00:00.000Z");
    const view = buildRightNowViewProps({
      liveClock: "12:00", now,
      sortedEvents: [{ id: 1, start_time: "2026-03-24T08:00:00.000Z" }],
      taskWidgetItemsOnly: [{ completed: true }, { completed: false }],
      tomorrowFirstEvent: { start_time: "2026-03-25T08:00:00.000Z" },
    });
    expect(view.completedCount).toBe(1);
    expect(view.tomorrowTime).toBe("09:15");
  });

  it("returns null tomorrowTime when event has no start_time, and counts valid events only", () => {
    const now = new Date("2026-03-24T12:00:00.000Z");
    expect(
      buildRightNowViewProps({
        liveClock: "12:00", now, sortedEvents: [], taskWidgetItemsOnly: [],
        tomorrowFirstEvent: { title: "No time" },
      }).tomorrowTime,
    ).toBeNull();

    expect(
      buildRightNowViewProps({
        liveClock: "12:00", now,
        sortedEvents: [{ id: "a" }, { id: "b", start_time: "2026-03-24T08:00:00.000Z" }],
        taskWidgetItemsOnly: [], tomorrowFirstEvent: null,
      }).eventsToday,
    ).toBe(1);
  });

  it("builds data props, view context, and widget bundle correctly", () => {
    const now = new Date("2026-03-24T12:00:00.000Z");

    const data = buildRightNowDataProps({
      isToday: true, navigatorContext: {}, now,
      sortedEvents: [], taskWidgetItemsOnly: [], tflDelays: [],
    });
    expect(data.isToday).toBe(true);

    const ctx = buildViewContext(
      { now, sortedEvents: [], taskWidgetItemsOnly: [], tomorrowFirstEvent: null },
      "12:01",
    );
    expect(ctx.liveClock).toBe("12:01");

    const widget = buildWidgetProps({
      model: { foo: 1 },
      props: { breakTime: 5, hasTimerSession: false, isToday: true, onOpenTimer: vi.fn(), timeLeft: 0, timerMode: "work", timerTask: null, workTime: 25 },
      viewProps: { bar: 2 },
    });
    expect(widget.foo).toBe(1);
    expect(widget.bar).toBe(2);
  });

  it("handles null event arrays in view props", () => {
    const now = new Date("2026-03-24T12:00:00.000Z");
    const view = buildRightNowViewProps({ liveClock: "12:00", now, sortedEvents: null, taskWidgetItemsOnly: [], tomorrowFirstEvent: null });
    expect(view.eventsToday).toBe(0);
  });
});
