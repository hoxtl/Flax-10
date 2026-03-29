/*
 * Tests for schedule utility and submission functions.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  getAutoScheduleError,
  buildAutoSchedulePayload,
  getMoveTomorrowWindow,
} from '../../../../components/schedules/auto/autoScheduleUtils';
import { submitAutoSchedule } from '../../../../components/schedules/auto/submitAutoSchedule';

vi.mock('../../../../api/scheduleApi', () => ({
  createSchedule: vi.fn(),
}));

import { createSchedule } from '../../../../api/scheduleApi';

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
