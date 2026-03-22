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
