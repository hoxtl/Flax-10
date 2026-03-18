import { describe, it, expect } from 'vitest';
import { DEFAULT_TERM_CONFIG } from '../../lib/termDefaults';

describe('DEFAULT_TERM_CONFIG', () => {
  it('is an object', () => {
    expect(typeof DEFAULT_TERM_CONFIG).toBe('object');
    expect(DEFAULT_TERM_CONFIG).not.toBeNull();
  });

  it('has a startDate property', () => {
    expect(DEFAULT_TERM_CONFIG).toHaveProperty('startDate');
  });

  it('startDate is a string', () => {
    expect(typeof DEFAULT_TERM_CONFIG.startDate).toBe('string');
  });

  it('startDate matches expected value "2026-01-09"', () => {
    expect(DEFAULT_TERM_CONFIG.startDate).toBe('2026-01-09');
  });

  it('startDate is a valid date string', () => {
    const date = new Date(DEFAULT_TERM_CONFIG.startDate);
    expect(isNaN(date.getTime())).toBe(false);
  });

  it('has a totalWeeks property', () => {
    expect(DEFAULT_TERM_CONFIG).toHaveProperty('totalWeeks');
  });

  it('totalWeeks is a number', () => {
    expect(typeof DEFAULT_TERM_CONFIG.totalWeeks).toBe('number');
  });

  it('totalWeeks is 11', () => {
    expect(DEFAULT_TERM_CONFIG.totalWeeks).toBe(11);
  });

  it('totalWeeks is a positive integer', () => {
    expect(DEFAULT_TERM_CONFIG.totalWeeks).toBeGreaterThan(0);
    expect(Number.isInteger(DEFAULT_TERM_CONFIG.totalWeeks)).toBe(true);
  });

  it('has a hasReadingWeek property', () => {
    expect(DEFAULT_TERM_CONFIG).toHaveProperty('hasReadingWeek');
  });

  it('hasReadingWeek is a boolean', () => {
    expect(typeof DEFAULT_TERM_CONFIG.hasReadingWeek).toBe('boolean');
  });

  it('hasReadingWeek is true', () => {
    expect(DEFAULT_TERM_CONFIG.hasReadingWeek).toBe(true);
  });

  it('has a readingWeekAfterWeek property', () => {
    expect(DEFAULT_TERM_CONFIG).toHaveProperty('readingWeekAfterWeek');
  });

  it('readingWeekAfterWeek is a number', () => {
    expect(typeof DEFAULT_TERM_CONFIG.readingWeekAfterWeek).toBe('number');
  });

  it('readingWeekAfterWeek is 5', () => {
    expect(DEFAULT_TERM_CONFIG.readingWeekAfterWeek).toBe(5);
  });

  it('readingWeekAfterWeek is less than totalWeeks', () => {
    expect(DEFAULT_TERM_CONFIG.readingWeekAfterWeek).toBeLessThan(DEFAULT_TERM_CONFIG.totalWeeks);
  });

  it('readingWeekAfterWeek is a positive integer', () => {
    expect(DEFAULT_TERM_CONFIG.readingWeekAfterWeek).toBeGreaterThan(0);
    expect(Number.isInteger(DEFAULT_TERM_CONFIG.readingWeekAfterWeek)).toBe(true);
  });

  it('has exactly 4 properties', () => {
    expect(Object.keys(DEFAULT_TERM_CONFIG).length).toBe(4);
  });

  it('has all expected property names', () => {
    const keys = Object.keys(DEFAULT_TERM_CONFIG);
    expect(keys).toContain('startDate');
    expect(keys).toContain('totalWeeks');
    expect(keys).toContain('hasReadingWeek');
    expect(keys).toContain('readingWeekAfterWeek');
  });
});
