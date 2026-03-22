import { describe, it, expect } from 'vitest';
import {
  getHistoryHorizonLabel,
  getSevenDayFocusSeries,
  getModuleLabel,
  filterVisibleBlocks,
  groupBlocksByHorizon,
} from '../../../../components/Timer/historyPanel/historyPanelUtils';

describe('historyPanelUtils', () => {
  const now = new Date('2024-01-15T12:00:00Z');

  describe('getHistoryHorizonLabel', () => {
    it('categorizes dates correctly', () => {
      expect(getHistoryHorizonLabel('2024-01-15T10:00:00Z', now)).toBe('Today');
      expect(getHistoryHorizonLabel('2024-01-14T10:00:00Z', now)).toBe('Yesterday');
      expect(getHistoryHorizonLabel('2024-01-13T10:00:00Z', now)).toBe('This Week');
      expect(getHistoryHorizonLabel('2024-01-10T10:00:00Z', now)).toBe('This Week');
      expect(getHistoryHorizonLabel('2024-01-08T10:00:00Z', now)).toBe('Earlier');
      expect(getHistoryHorizonLabel('2024-01-01T10:00:00Z', now)).toBe('Earlier');
    });

    it('handles invalid dates', () => {
      expect(getHistoryHorizonLabel('invalid', now)).toBe('Earlier');
      expect(getHistoryHorizonLabel(null, now)).toBe('Earlier');
      expect(getHistoryHorizonLabel(undefined, now)).toBe('Earlier');
    });
  });

  describe('getSevenDayFocusSeries', () => {
    it('generates 7 days with correct structure', () => {
      const series = getSevenDayFocusSeries([], now);
      expect(series).toHaveLength(7);
      expect(series[0].key).toBe('2024-01-09');
      expect(series[6].key).toBe('2024-01-15');
      expect(series[6].label).toBeTruthy();
      expect(series[6].seconds).toBe(0);
    });

    it('aggregates durations by day', () => {
      const blocks = [
        { startTime: '2024-01-15T10:00:00Z', totalDuration: 3600 },
        { startTime: '2024-01-15T14:00:00Z', totalDuration: 1800 },
        { startTime: '2024-01-14T10:00:00Z', totalDuration: 7200 },
        { endTime: '2024-01-13T10:00:00Z', totalDuration: 900 },
      ];
      const series = getSevenDayFocusSeries(blocks, now);
      expect(series[6].seconds).toBe(5400);
      expect(series[5].seconds).toBe(7200);
      expect(series[4].seconds).toBe(900);
    });

    it('handles edge cases', () => {
      const blocks = [
        { startTime: 'invalid', totalDuration: 3600 },
        { startTime: '2024-01-15T10:00:00Z', totalDuration: null },
        { startTime: '2024-01-15T11:00:00Z' },
        { totalDuration: 500 },
        { startTime: '2024-01-08T10:00:00Z', totalDuration: 1000 },
      ];
      const series = getSevenDayFocusSeries(blocks, now);
      expect(series[6].seconds).toBe(0);
      expect(series.every(day => typeof day.seconds === 'number')).toBe(true);
    });
  });

  describe('getModuleLabel', () => {
    it('extracts module from all sources', () => {
      expect(getModuleLabel({ module: 'Math' })).toBe('Math');
      expect(getModuleLabel({ sessions: [{ module: 'Physics' }] })).toBe('Physics');
      expect(getModuleLabel({ sessions: [{ module_code: 'CS101' }] })).toBe('CS101');
      expect(getModuleLabel({ sessions: [{ moduleCode: 'ENG202' }] })).toBe('ENG202');
      expect(getModuleLabel({ sessions: [{ list: 'Bio' }] })).toBe('Bio');
      expect(getModuleLabel({ sessions: [{}, { module: 'Found' }] })).toBe('Found');
    });

    it('returns null for missing module', () => {
      expect(getModuleLabel({})).toBe(null);
      expect(getModuleLabel({ sessions: [] })).toBe(null);
      expect(getModuleLabel({ sessions: [{}] })).toBe(null);
      expect(getModuleLabel({ sessions: null })).toBe(null);
      expect(getModuleLabel({ sessions: 'invalid' })).toBe(null);
    });
  });

  describe('filterVisibleBlocks', () => {
    it('shows blocks with sufficient duration or completed sessions', () => {
      const blocks = [
        { totalDuration: 300, sessions: [] },
        { totalDuration: 600, sessions: [] },
        { totalDuration: 60, sessions: [{ status: 'Completed' }] },
        { totalDuration: 0, sessions: [{ status: 'Completed' }] },
        { totalDuration: 60, sessions: [{ status: 'Incomplete' }] },
        { totalDuration: 200, sessions: [] },
        { totalDuration: 60, sessions: [{ status: 'Completed' }, { status: 'Incomplete' }] },
      ];
      const visible = filterVisibleBlocks(blocks);
      expect(visible).toHaveLength(5);
    });

    it('handles edge cases', () => {
      const blocks = [
        { totalDuration: null, sessions: [] },
        { sessions: [] },
        {},
        { totalDuration: 60, sessions: [{}] },
        { totalDuration: 60, sessions: null },
      ];
      const visible = filterVisibleBlocks(blocks);
      expect(visible).toHaveLength(1);
    });
  });

  describe('groupBlocksByHorizon', () => {
    it('groups blocks into horizons', () => {
      const blocks = [
        { startTime: '2024-01-15T10:00:00Z', id: 1 },
        { startTime: '2024-01-15T11:00:00Z', id: 2 },
        { startTime: '2024-01-14T10:00:00Z', id: 3 },
        { startTime: '2024-01-13T10:00:00Z', id: 4 },
        { startTime: '2024-01-01T10:00:00Z', id: 5 },
      ];
      const grouped = groupBlocksByHorizon(blocks);
      
      expect(grouped.length).toBeGreaterThan(0);
      expect(grouped[0].label).toBe('Today');
      expect(grouped[0].entries).toHaveLength(2);
      expect(grouped.every(g => g.entries.length > 0)).toBe(true);
      expect(grouped[0].entries[0].id).toBe(1);
    });

    it('limits to 24 blocks', () => {
      const blocks = Array(50).fill(null).map((_, i) => ({
        startTime: '2024-01-15T10:00:00Z',
        id: i,
      }));
      const grouped = groupBlocksByHorizon(blocks);
      const total = grouped.reduce((sum, g) => sum + g.entries.length, 0);
      expect(total).toBe(24);
    });

    it('handles empty array', () => {
      expect(groupBlocksByHorizon([])).toEqual([]);
    });
  });
});