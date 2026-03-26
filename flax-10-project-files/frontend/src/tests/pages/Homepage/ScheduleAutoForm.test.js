import { describe, it, expect, vi } from 'vitest';
import { buildScheduleAutoForm, getUrgencyTier } from '../../../pages/Homepage/utils/ScheduleAutoForm';

describe('ScheduleAutoForm', () => {
  it('builds payload with deadline preferences for valid upcoming deadlines', () => {
    const deadlines = [
      { id: 3, start_due_date: new Date(Date.now() + 12 * 86400000).toISOString() },
      { id: 1, start_due_date: new Date(Date.now() + 24 * 3600000).toISOString() },
    ];

    const payload = buildScheduleAutoForm({ deadlines });

    expect(payload).toEqual(expect.objectContaining({
      clear_existing: true,
      deadline_preferences: [
        expect.objectContaining({ deadline_id: 1, ideal_minutes_per_day: 75 }),
        expect.objectContaining({ deadline_id: 3, ideal_minutes_per_day: 45 }),
      ],
    }));
  });

  it('returns null when no eligible deadlines are provided', () => {
    expect(buildScheduleAutoForm()).toBeNull();
    expect(buildScheduleAutoForm({ deadlines: null })).toBeNull();
    expect(buildScheduleAutoForm({ deadlines: 'invalid' })).toBeNull();

    const payload = buildScheduleAutoForm({
      deadlines: [{ id: 1, start_due_date: new Date(Date.now() - 86400000).toISOString() }],
    });

    expect(payload).toBeNull();
  });

  it('classifies urgency tiers based on due date proximity', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    expect(getUrgencyTier('2025-12-30T00:00:00.000Z')).toBe('overdue');
    expect(getUrgencyTier('2026-01-02T00:00:00.000Z')).toBe('critical');
    expect(getUrgencyTier('2026-01-05T00:00:00.000Z')).toBe('urgent');
    expect(getUrgencyTier('2026-01-10T00:00:00.000Z')).toBe('upcoming');
    expect(getUrgencyTier('2026-02-10T00:00:00.000Z')).toBe('distant');
    expect(getUrgencyTier('not-a-date')).toBeNull();

    vi.useRealTimers();
  });
});
