import { describe, it, expect } from 'vitest';
import {
  getHistoryHorizonLabel,
  getSevenDayFocusSeries,
  getModuleLabel,
  filterVisibleBlocks,
  groupBlocksByHorizon,
} from '../../../../components/Timer/historyPanel/historyPanelUtils';

const localDaysAgo = (base, daysBack, hour = 10) =>
  new Date(base.getFullYear(), base.getMonth(), base.getDate() - daysBack, hour);

describe('getHistoryHorizonLabel', () => {
  const now = new Date(2024, 5, 12, 15, 0, 0);

  it('returns Today for the same calendar day', () => {
    expect(getHistoryHorizonLabel(localDaysAgo(now, 0), now)).toBe('Today');
  });

  it('returns Yesterday for exactly one day ago', () => {
    expect(getHistoryHorizonLabel(localDaysAgo(now, 1), now)).toBe('Yesterday');
  });

  it('returns This Week for a date earlier in the same week', () => {
    expect(getHistoryHorizonLabel(localDaysAgo(now, 2), now)).toBe('This Week');
  });

  it('returns Earlier for a date from a previous week', () => {
    expect(getHistoryHorizonLabel(localDaysAgo(now, 14), now)).toBe('Earlier');
  });

  it('returns Earlier for an invalid date value', () => {
    expect(getHistoryHorizonLabel('not-a-date', now)).toBe('Earlier');
  });
});

describe('getSevenDayFocusSeries', () => {
  const now = new Date(2024, 5, 12, 15, 0, 0);
  const todayKey = new Date(2024, 5, 12).toISOString().slice(0, 10);

  it('always returns exactly 7 entries', () => {
    expect(getSevenDayFocusSeries([], now)).toHaveLength(7);
  });

  it('last entry key equals today in local time', () => {
    expect(getSevenDayFocusSeries([], now)[6].key).toBe(todayKey);
  });

  it('accumulates totalDuration into the bucket matching startTime', () => {
    const block = { startTime: new Date(2024, 5, 12, 10).toISOString(), totalDuration: 3600 };
    expect(getSevenDayFocusSeries([block], now)[6].seconds).toBe(3600);
  });

  it('falls back to endTime when startTime is absent', () => {
    const block = { endTime: new Date(2024, 5, 12, 10).toISOString(), totalDuration: 1800 };
    expect(getSevenDayFocusSeries([block], now)[6].seconds).toBe(1800);
  });

  it('ignores a block whose date cannot be parsed', () => {
    const block = { startTime: 'bad-date', totalDuration: 3600 };
    expect(getSevenDayFocusSeries([block], now).every((d) => d.seconds === 0)).toBe(true);
  });

  it('ignores a block that falls outside the 7-day window', () => {
    const block = { startTime: new Date(2024, 3, 1, 10).toISOString(), totalDuration: 3600 };
    expect(getSevenDayFocusSeries([block], now).every((d) => d.seconds === 0)).toBe(true);
  });

  it('accumulates seconds from multiple blocks on the same day', () => {
    const blocks = [
      { startTime: new Date(2024, 5, 12, 8).toISOString(), totalDuration: 600 },
      { startTime: new Date(2024, 5, 12, 10).toISOString(), totalDuration: 400 },
    ];
    expect(getSevenDayFocusSeries(blocks, now)[6].seconds).toBe(1000);
  });
});

describe('getModuleLabel', () => {
  it('returns block.module when present', () => {
    expect(getModuleLabel({ module: 'Maths' })).toBe('Maths');
  });

  it('returns session.module as the first session fallback', () => {
    expect(getModuleLabel({ sessions: [{ module: 'Physics' }] })).toBe('Physics');
  });

  it('returns session.module_code as fallback', () => {
    expect(getModuleLabel({ sessions: [{ module_code: 'CS101' }] })).toBe('CS101');
  });

  it('returns session.moduleCode as fallback', () => {
    expect(getModuleLabel({ sessions: [{ moduleCode: 'PHY202' }] })).toBe('PHY202');
  });

  it('returns session.list as the last-resort fallback', () => {
    expect(getModuleLabel({ sessions: [{ list: 'Reading List' }] })).toBe('Reading List');
  });

  it('returns null when no label fields exist on the session', () => {
    expect(getModuleLabel({ sessions: [{}] })).toBeNull();
  });

  it('returns null when sessions is not an array', () => {
    expect(getModuleLabel({})).toBeNull();
  });
});

