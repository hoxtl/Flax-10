/*
 * Tests for schedule utility and submission functions.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  getAutoScheduleError,
  buildAutoSchedulePayload,
  getMoveTomorrowWindow,
} from '../../../components/schedules/auto/autoScheduleUtils';
import {
  filterScheduleEvents,
  toggleSelectedEventId,
  getManualScheduleError,
} from '../../../components/schedules/manual/manualScheduleUtils';
import { submitAutoSchedule } from '../../../components/schedules/auto/submitAutoSchedule';
import { submitManualSchedule } from '../../../components/schedules/manual/submitManualSchedule';
import { loadScheduleTaggedEvents } from '../../../components/schedules/manual/loadScheduleTaggedEvents';

vi.mock('../../../api/scheduleApi', () => ({
  createSchedule: vi.fn(),
}));

vi.mock('../../../api/eventApi', () => ({
  getEvents: vi.fn(),
}));

import { createSchedule } from '../../../api/scheduleApi';
import { getEvents } from '../../../api/eventApi';

describe('autoScheduleUtils – getAutoScheduleError', () => {
  it('returns null when deadlines are present', () => {
    expect(getAutoScheduleError([{ id: 1 }])).toBeNull();
  });

  it('returns an error message when deadlines are empty', () => {
    expect(getAutoScheduleError([])).toBe('No upcoming deadlines to auto-schedule.');
  });
});

describe('autoScheduleUtils – buildAutoSchedulePayload', () => {
  it('trims the title and maps deadline IDs', () => {
    const deadlines = [{ id: 10 }, { id: 20 }];
    const payload = buildAutoSchedulePayload('  My Plan  ', deadlines);
    expect(payload.title).toBe('My Plan');
    expect(payload.deadline_preferences).toHaveLength(2);
    expect(payload.deadline_preferences[0]).toEqual({ deadline_id: 10, ideal_minutes_per_day: 60 });
  });

  it('uses "Auto schedule" when title is blank', () => {
    expect(buildAutoSchedulePayload('   ', []).title).toBe('Auto schedule');
  });
});

describe('autoScheduleUtils – getMoveTomorrowWindow', () => {
  it('returns a window starting the next day', () => {
    const event = { start_time: '2026-03-24T10:00:00Z', end_time: '2026-03-24T10:30:00Z' };
    const window = getMoveTomorrowWindow(event);
    expect(window.start).toBeInstanceOf(Date);
    const origDay = new Date(event.start_time).getDate();
    expect(window.start.getDate()).toBe(origDay + 1);
  });

  it('defaults to 25 minutes duration when end_time is absent', () => {
    const event = { start_time: '2026-03-24T10:00:00Z' };
    const window = getMoveTomorrowWindow(event);
    const durationMins = (window.end - window.start) / 60000;
    expect(durationMins).toBe(25);
  });
});

describe('manualScheduleUtils – filterScheduleEvents', () => {
  const events = [
    { id: 1, title: 'Lecture on React' },
    { id: 2, title: 'Chemistry lab' },
  ];

  it('returns all events when query is empty', () => {
    expect(filterScheduleEvents(events, '')).toHaveLength(2);
  });

  it('filters by title case-insensitively', () => {
    expect(filterScheduleEvents(events, 'react')).toHaveLength(1);
  });

  it('returns empty array when no event matches', () => {
    expect(filterScheduleEvents(events, 'zzz')).toHaveLength(0);
  });
});

describe('manualScheduleUtils – toggleSelectedEventId', () => {
  it('adds an ID not currently selected', () => {
    expect(toggleSelectedEventId([1, 2], 3)).toEqual([1, 2, 3]);
  });

  it('removes an ID already selected', () => {
    expect(toggleSelectedEventId([1, 2, 3], 2)).toEqual([1, 3]);
  });
});

describe('manualScheduleUtils – getManualScheduleError', () => {
  it('returns an error when title is blank', () => {
    expect(getManualScheduleError('', [1])).toBe('Please enter a schedule name.');
  });

  it('returns an error when no events are selected', () => {
    expect(getManualScheduleError('My Schedule', [])).toBe('Select at least one event tagged as schedule.');
  });

  it('returns null when both title and events are valid', () => {
    expect(getManualScheduleError('My Schedule', [1, 2])).toBeNull();
  });
});

describe('submitAutoSchedule', () => {
  it('calls showToast with an error when deadlines are empty', async () => {
    const showToast = vi.fn();
    await submitAutoSchedule({ title: 'X', deadlines: [], showToast, onDone: vi.fn() });
    expect(showToast).toHaveBeenCalledWith('No upcoming deadlines to auto-schedule.', { variant: 'error' });
    expect(createSchedule).not.toHaveBeenCalled();
  });

  it('calls createSchedule and showToast success on valid input', async () => {
    createSchedule.mockResolvedValue({ overwritten: false });
    const showToast = vi.fn();
    const onDone = vi.fn();
    await submitAutoSchedule({ title: 'Plan A', deadlines: [{ id: 1 }], showToast, onDone });
    expect(createSchedule).toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith('Your auto schedule is ready.', { variant: 'success' });
    expect(onDone).toHaveBeenCalled();
  });

  it('shows an info toast when a schedule was overwritten', async () => {
    createSchedule.mockResolvedValue({ overwritten: true });
    const showToast = vi.fn();
    await submitAutoSchedule({ title: 'Plan B', deadlines: [{ id: 1 }], showToast, onDone: vi.fn() });
    expect(showToast).toHaveBeenCalledWith(
      'A schedule with this name existed and was replaced.',
      { variant: 'info' },
    );
  });
});

describe('submitManualSchedule', () => {
  it('shows error toast when title is empty', async () => {
    const showToast = vi.fn();
    await submitManualSchedule({ title: '', selected: [1], showToast, onDone: vi.fn() });
    expect(showToast).toHaveBeenCalledWith('Please enter a schedule name.', { variant: 'error' });
  });

  it('shows error toast when no events are selected', async () => {
    const showToast = vi.fn();
    await submitManualSchedule({ title: 'My Plan', selected: [], showToast, onDone: vi.fn() });
    expect(showToast).toHaveBeenCalledWith(
      'Select at least one event tagged as schedule.',
      { variant: 'error' },
    );
  });

  it('creates a schedule and calls onDone on success', async () => {
    createSchedule.mockResolvedValue({ overwritten: false });
    const showToast = vi.fn();
    const onDone = vi.fn();
    await submitManualSchedule({ title: 'My Plan', selected: [1, 2], showToast, onDone });
    expect(createSchedule).toHaveBeenCalledWith({ mode: 'manual', title: 'My Plan', event_ids: [1, 2] });
    expect(onDone).toHaveBeenCalled();
  });

  it('shows an info toast when a schedule was overwritten', async () => {
    createSchedule.mockResolvedValue({ overwritten: true });
    const showToast = vi.fn();
    await submitManualSchedule({ title: 'Plan A', selected: [1], showToast, onDone: vi.fn() });
    expect(showToast).toHaveBeenCalledWith(
      'A schedule with this name existed and was replaced.',
      { variant: 'info' },
    );
  });
});

describe('loadScheduleTaggedEvents', () => {
  it('filters events tagged as schedule and selects their IDs', async () => {
    const events = [
      { id: 1, tag_name: 'Schedule' },
      { id: 2, tag_name: 'personal' },
      { id: 3, tag_name: 'SCHEDULE' },
    ];
    getEvents.mockResolvedValue(events);
    const setEvents = vi.fn();
    const setSelected = vi.fn();
    const showToast = vi.fn();
    await loadScheduleTaggedEvents(setEvents, setSelected, showToast);
    expect(setEvents).toHaveBeenCalledWith([events[0], events[2]]);
    expect(setSelected).toHaveBeenCalledWith([1, 3]);
    expect(showToast).not.toHaveBeenCalled();
  });

  it('shows an error toast when getEvents throws', async () => {
    getEvents.mockRejectedValue(new Error('Network error'));
    const showToast = vi.fn();
    await loadScheduleTaggedEvents(vi.fn(), vi.fn(), showToast);
    expect(showToast).toHaveBeenCalledWith(
      'Unable to load schedule-tagged events.',
      { variant: 'error' },
    );
  });
});
