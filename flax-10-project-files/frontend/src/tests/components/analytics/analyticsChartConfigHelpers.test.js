import { describe, expect, it } from 'vitest';

import {
  getBreakdownAxis,
  getBreakdownColors,
  getBreakdownSeries,
  getChartMargin as getDailyBreakdownMargin,
} from '../../../components/analytics/dailyBreakdownChartConfig';
import {
  formatDate,
  getChartMargin as getStudyHoursMargin,
  getStudyHoursAxis,
  getStudyHoursSeries,
} from '../../../components/analytics/studyHoursChartConfig';
import {
  DARK_COLOR,
  LIGHT_COLOR,
  formatPercentage,
  getBadge,
  getPieSeries,
} from '../../../components/analytics/themeUsageChartData';

describe('Analytics helper coverage extras', () => {
  it('covers daily breakdown config branches and fallback values', () => {
    expect(getDailyBreakdownMargin(true)).toEqual({ left: 28, right: 10, top: 20, bottom: 44 });
    expect(getDailyBreakdownMargin(false)).toEqual({ left: 50, right: 20, top: 20, bottom: 50 });

    expect(getBreakdownColors('sage')).toEqual({
      barColor: 'var(--chart-study-sage)',
      breakColor: 'var(--chart-study-sage-alpha)',
    });
    expect(getBreakdownColors('light')).toEqual({
      barColor: 'var(--chart-study)',
      breakColor: 'var(--chart-break)',
    });

    const axis = getBreakdownAxis([{ date: '2024-03-01' }], '#111');
    expect(axis[0].tickLabelStyle.fill).toBe('#111');
    expect(axis[0].data).toHaveLength(1);

    const series = getBreakdownSeries([{ work: null, break: null }], getBreakdownColors('sage'));
    expect(series[0].data).toEqual([0]);
    expect(series[1].data).toEqual([0]);
  });

  it('covers study-hours config branches and value formatting', () => {
    expect(getStudyHoursMargin(true)).toEqual({ left: 28, right: 10, top: 20, bottom: 44 });
    expect(getStudyHoursMargin(false)).toEqual({ left: 50, right: 20, top: 20, bottom: 50 });
    expect(formatDate(new Date('2024-03-01T00:00:00.000Z'))).toContain('Mar');

    const axis = getStudyHoursAxis([{ date: '2024-03-01' }], '#444');
    expect(axis[0].scaleType).toBe('time');
    expect(axis[0].tickLabelStyle.fill).toBe('#444');

    const series = getStudyHoursSeries([{ work: 30, break: 0 }]);
    expect(series[0].data).toEqual(['0.5']);
    expect(series[1].data).toEqual(['0.0']);
  });

  it('covers theme-usage data formatting and badge thresholds', () => {
    expect(formatPercentage(Number.NaN)).toBe('0%');
    expect(formatPercentage(12)).toBe('12%');
    expect(formatPercentage(12.34)).toBe('12.3%');
    expect(getBadge(60)).toBe('🦉 Night Owl');
    expect(getBadge(30)).toBe('🌗 Mixed');
    expect(getBadge(10)).toBe('☀️ Day Worker');
  });

  it('covers theme-usage pie series generation', () => {
    const series = getPieSeries({
      light_minutes: 50,
      dark_minutes: 25,
      light_percentage: undefined,
      dark_percentage: 33.3,
    });
    expect(series[0].data[0]).toEqual({
      id: 0,
      value: 50,
      label: 'Light Mode 0%',
      color: LIGHT_COLOR,
    });
    expect(series[0].data[1]).toEqual({
      id: 1,
      value: 25,
      label: 'Dark Mode 33.3%',
      color: DARK_COLOR,
    });
    const fallback = getPieSeries({ light_minutes: 10, dark_minutes: 5, light_percentage: 50 });
    expect(fallback[0].data[1].label).toBe('Dark Mode 0%');
  });
});
