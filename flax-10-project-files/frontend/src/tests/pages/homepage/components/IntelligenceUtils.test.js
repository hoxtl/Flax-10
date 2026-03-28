import { describe, expect, it, vi, beforeEach } from 'vitest';

const overlapSleepMock = vi.fn(() => false);

vi.mock('@/components/settings/hooks/useSleepWarning', () => ({
  doesEventOverlapSleepWindow: (...args) => overlapSleepMock(...args),
}));

import {
  getGreeting,
  getTodayLabel,
  formatWindowDuration,
  getNextWindowMeta,
  getNextStep,
  getCurrentEvent,
  getUpcomingEvent,
  formatEventTime,
  getLiveContext,
  getTravelContext,
} from '@/pages/homepage/components/IntelligenceUtils';

describe('IntelligenceUtils', () => {
  beforeEach(() => {
    overlapSleepMock.mockReset();
    overlapSleepMock.mockReturnValue(false);
  });

  it('getGreeting generates correct greeting based on time of day and teacher flag', () => {
    vi.setSystemTime(new Date('2026-03-24T09:00:00.000Z'));
    expect(getGreeting('Alice')).toBe('Good Morning, Alice.');
    vi.setSystemTime(new Date('2026-03-24T14:00:00.000Z'));
    expect(getGreeting('Bob', true)).toBe('Good Afternoon, Dr. Bob.');
    vi.setSystemTime(new Date('2026-03-24T20:00:00.000Z'));
    expect(getGreeting(null)).toBe('Good Evening.');
    vi.setSystemTime(new Date('2026-03-24T09:00:00.000Z'));
    expect(getGreeting('', true)).toBe('Good Morning.');
  });

  it('getTodayLabel formats the current date string', () => {
    vi.setSystemTime(new Date('2026-03-24T12:00:00.000Z'));
    expect(getTodayLabel()).toBe('TUESDAY · 24 MAR');
  });

  it('formatWindowDuration formats minutes into hours and minutes', () => {
    expect(formatWindowDuration(45)).toBe('45m');
    expect(formatWindowDuration(120)).toBe('2h');
    expect(formatWindowDuration(135)).toBe('2h 15m');
    expect(formatWindowDuration(-10)).toBeNull();
    expect(formatWindowDuration(Number.NaN)).toBeNull();
  });

  it('getNextWindowMeta finds and formats the next focus window', () => {
    const now = new Date('2026-03-24T10:00:00.000Z');
    const windows = [
      { start: new Date('2026-03-24T09:00:00.000Z'), end: new Date('2026-03-24T09:30:00.000Z') },
      { start: new Date('2026-03-24T11:00:00.000Z'), end: new Date('2026-03-24T12:30:00.000Z') },
      { start: new Date('2026-03-24T13:00:00.000Z'), end: new Date('2026-03-24T14:00:00.000Z') },
      { start: new Date('2026-03-24T08:00:00.000Z') },
    ];
    expect(getNextWindowMeta(windows, now)).toEqual({ label: 'Next focus window 11:00', duration: '1h 30m' });
    expect(getNextWindowMeta([], now)).toBeNull();
    expect(getNextWindowMeta()).toBeNull();
  });

  it('getNextStep suggests actions based on tasks and windows', () => {
    expect(getNextStep({ tasksCount: 2, nextWindowMeta: { duration: '1h' } })).toBe('Use the 1h window to move one priority task forward.');
    expect(getNextStep({ tasksCount: 2, nextWindowMeta: null })).toBe('Clear one meaningful task before the day fragments.');
    expect(getNextStep({ tasksCount: 0, nextWindowMeta: { duration: '2h' } })).toBe('Your next open block gives you 2h to focus.');
    expect(getNextStep({ tasksCount: 0, nextWindowMeta: null })).toBe('Keep the timeline as the source of truth for the rest of today.');
    expect(getNextStep({ tasksCount: 0, nextWindowMeta: {} })).toBe('Keep the timeline as the source of truth for the rest of today.');
  });

  it('getCurrentEvent finds active event overlapping with now', () => {
    const now = new Date('2026-03-24T10:00:00.000Z');
    const events = [
      { id: 72, start_time: '2026-03-24T10:00:00.000Z', end_time: '2026-03-24T10:30:00.000Z' },
      { id: 2, start_time: '2026-03-24T09:30:00.000Z', end_time: '2026-03-24T10:30:00.000Z' },
    ];
    expect(getCurrentEvent(events, now).id).toBe(72);
    expect(getCurrentEvent([], now)).toBeNull();
    expect(getCurrentEvent([{ id: 3 }], now)).toBeNull();
    expect(getCurrentEvent()).toBeNull();
  });

  it('getUpcomingEvent finds next scheduled event', () => {
    const now = new Date('2026-03-24T10:00:00.000Z');
    const events = [
      { id: 1, start_time: '2026-03-24T14:00:00.000Z' },
      { id: 2, start_time: '2026-03-24T11:00:00.000Z' },
    ];
    expect(getUpcomingEvent(events, now).id).toBe(2);
    expect(getUpcomingEvent()).toBeNull();
  });

  it('formatEventTime returns formatted time string', () => {
    expect(formatEventTime('2026-03-24T14:30:00.000Z')).toBe('14:30');
    expect(formatEventTime(null)).toBeNull();
  });

  it('getLiveContext builds context for a current event', () => {
    const now = new Date('2026-03-24T10:00:00.000Z');
    const currentEvent = { title: "Lecture", location: "Room 1", start_time: "2026-03-24T09:00:00.000Z", end_time: "2026-03-24T11:00:00.000Z" };
    expect(getLiveContext({ currentEvent, now })).toEqual({
      label: "On now", text: "Lecture · Room 1", meta: "Until 11:00", tone: "neutral", iconKey: "Clock3",
    });
  });

  it('getLiveContext builds context for overlaps and travel disruptions', () => {
    const now = new Date('2026-03-24T10:00:00.000Z');
    expect(getLiveContext({ overlaps: [{ a: { start_time: "2026-03-24T12:00:00.000Z" } }], now })).toEqual({
      label: "Attention", text: "You have an overlap in today’s plan.", meta: "Conflict at 12:00", tone: "warning", iconKey: "AlertTriangle",
    });
    const upcomingEvent = { title: "Exam", start_time: "2026-03-24T11:00:00.000Z" };
    const getRelevantDelays = vi.fn().mockReturnValue([{ lineName: "Central", severityDescription: "Severe Delays" }]);
    const isSevereDisruption = vi.fn().mockReturnValue(true);
    expect(getLiveContext({ upcomingEvent, tflDelays: [{}], now, getRelevantDelays, isSevereDisruption })).toEqual({
      label: "Travel", text: "Central line disruption — you may be late for your 11:00 Exam.", meta: "Severe Delays", tone: "warning", iconKey: "Train",
    });
  });

  it('getLiveContext builds context for upcoming and idle states', () => {
    const now = new Date('2026-03-24T10:00:00.000Z');
    expect(getLiveContext({ upcomingEvent: { title: "Meeting", start_time: "2026-03-24T18:00:00.000Z" }, now })).toEqual({
      label: "Up next", text: "Meeting", meta: "Starts 18:00", tone: "neutral", iconKey: "Clock3",
    });
    expect(getLiveContext({ now })).toEqual({
      label: "Right now", text: "You have breathing room before the next thing starts.", meta: "Use the banner to decide what to move forward next.", tone: "neutral", iconKey: "Clock3",
    });
  });

  it('getLiveContext handles overlap with missing start time and non-severe travel delays', () => {
    const now = new Date('2026-03-24T10:00:00.000Z');
    expect(getLiveContext({ overlaps: [{ a: {} }], now }).meta).toBeNull();

    expect(getLiveContext({
      currentEvent: { title: "Solo", start_time: "2026-03-24T09:00:00.000Z" },
      now,
      upcomingEvent: { title: "Exam", start_time: "2026-03-24T11:00:00.000Z" },
      getRelevantDelays: () => [{ lineName: "Central", severityDescription: "Delays" }],
      isSevereDisruption: () => false,
      tflDelays: [{}],
    }).label).toBe("On now");

    const travelMild = getLiveContext({
      upcomingEvent: { title: "Quiz", start_time: "2026-03-24T11:00:00.000Z", location: "Campus" },
      tflDelays: [{}],
      now,
      getRelevantDelays: () => [{ lineName: "District", severityDescription: "Minor delays" }],
      isSevereDisruption: () => false,
    });
    expect(travelMild.text).toMatch(/delays —/);
    expect(travelMild.meta).toBe("Minor delays · Campus");
  });

  it('getLiveContext handles severe travel with no location and no event title', () => {
    const now = new Date('2026-03-24T10:00:00.000Z');
    const travelNoLoc = getLiveContext({
      upcomingEvent: { title: "Exam", start_time: "2026-03-24T11:00:00.000Z" },
      tflDelays: [{}], now,
      getRelevantDelays: () => [{ lineName: "Central", severityDescription: "Severe Delays" }],
      isSevereDisruption: () => true,
    });
    expect(travelNoLoc.meta).toBe("Severe Delays");
    expect(travelNoLoc.text).toContain("your 11:00 Exam");

    const travelNoTitle = getLiveContext({
      upcomingEvent: { start_time: "2026-03-24T11:00:00.000Z" },
      tflDelays: [{}], now,
      getRelevantDelays: () => [{ lineName: "Central", severityDescription: "Alt" }],
      isSevereDisruption: () => false,
    });
    expect(travelNoTitle.text).toContain("your next class");
  });

  it('getLiveContext handles current event without end time', () => {
    const now = new Date('2026-03-24T10:00:00.000Z');
    expect(getLiveContext({
      currentEvent: { title: "Remote", start_time: "2026-03-24T09:00:00.000Z", end_time: "2026-03-24T11:00:00.000Z" },
      now,
    }).text).toBe("Remote");
    expect(getLiveContext({
      currentEvent: { title: "Drift", start_time: "2026-03-24T09:00:00.000Z" },
      now,
    }).meta).toBeNull();
  });

  it('getLiveContext handles upcoming event with location and missing start time', () => {
    const now = new Date('2026-03-24T10:00:00.000Z');
    expect(getLiveContext({ upcomingEvent: { title: "TBA", start_time: "2026-03-24T18:00:00.000Z" }, now }).text).toBe("TBA");
    expect(getLiveContext({ upcomingEvent: { title: "Lab", location: "Lab 3", start_time: "2026-03-24T18:00:00.000Z" }, now }).text).toBe("Lab · Lab 3");
    expect(getLiveContext({ upcomingEvent: { title: "Floating" }, now }).meta).toBeNull();
  });

  it('getLiveContext prepends sleep emoji when event overlaps sleep window', () => {
    const now = new Date('2026-03-24T10:00:00.000Z');
    overlapSleepMock.mockReturnValueOnce(true);
    expect(getLiveContext({
      currentEvent: { title: "Late", location: "Hall", start_time: "2026-03-24T09:00:00.000Z", end_time: "2026-03-24T11:00:00.000Z" },
      sleepWindow: { sleepTime: "23:00", wakeTime: "07:00" }, now,
    }).text).toBe("😴 Late · Hall");
    overlapSleepMock.mockReturnValueOnce(true);
    expect(getLiveContext({
      currentEvent: { title: "Tired", start_time: "2026-03-24T09:00:00.000Z", end_time: "2026-03-24T11:00:00.000Z" },
      sleepWindow: { sleepTime: "23:00", wakeTime: "07:00" }, now,
    }).text).toBe("😴 Tired");
  });

  it('getTravelContext edge cases', () => {
    expect(getTravelContext({})).toBeNull();

    const upcomingEvent = { title: "Far", start_time: "2026-03-24T15:00:00.000Z" };
    const getRelevantDelays = vi.fn().mockReturnValue([{ lineName: "Jubilee" }]);
    expect(getTravelContext({ upcomingEvent, tflDelays: [{}], now: new Date('2026-03-24T10:00:00.000Z'), getRelevantDelays })).toBeNull();

    const baseNow = new Date('2026-03-24T10:00:00.000Z');
    expect(getTravelContext({
      upcomingEvent: { start_time: "2026-03-24T11:00:00.000Z" },
      tflDelays: [{}],
      now: baseNow,
      getRelevantDelays: () => [],
      isSevereDisruption: () => false,
    })).toBeNull();

    expect(getTravelContext({
      upcomingEvent: { start_time: "2026-03-24T11:00:00.000Z" },
      tflDelays: [{}],
      now: baseNow,
      getRelevantDelays: () => [{ severityDescription: undefined }],
      isSevereDisruption: (s) => Boolean(s),
    })?.text).toContain("TfL line delays");
  });
});
