import { describe, it, expect } from 'vitest';
<<<<<<< HEAD
import * as homepageUtils from '../../pages/homepage/utils';
=======
import * as homepageUtils from '../../pages/homepage/utils/index';
>>>>>>> main

describe('Homepage utils barrel export', () => {
  it('exports formatTime from dateFormatUtils', () => {
    expect(typeof homepageUtils.formatTime).toBe('function');
  });

  it('exports formatTimeHHMM from dateFormatUtils', () => {
    expect(typeof homepageUtils.formatTimeHHMM).toBe('function');
  });

  it('exports fmtDurationShort from dateFormatUtils', () => {
    expect(typeof homepageUtils.fmtDurationShort).toBe('function');
  });

  it('exports formatTime12h from dateFormatUtils', () => {
    expect(typeof homepageUtils.formatTime12h).toBe('function');
  });

  it('exports formatHour12h from dateFormatUtils', () => {
    expect(typeof homepageUtils.formatHour12h).toBe('function');
  });

  it('exports stripEmojiFromTitle from eventUtils', () => {
    expect(typeof homepageUtils.stripEmojiFromTitle).toBe('function');
  });

  it('exports isLecture from eventUtils', () => {
    expect(typeof homepageUtils.isLecture).toBe('function');
  });

  it('exports isRoutineEvent from eventUtils', () => {
    expect(typeof homepageUtils.isRoutineEvent).toBe('function');
  });

  it('exports isNow from eventUtils', () => {
    expect(typeof homepageUtils.isNow).toBe('function');
  });

  it('exports extractModuleCode from eventUtils', () => {
    expect(typeof homepageUtils.extractModuleCode).toBe('function');
  });

  it('exports at least one function from navigatorUtils', () => {
    const navigatorExports = Object.keys(homepageUtils).filter(k =>
      typeof homepageUtils[k] === 'function'
    );
    expect(navigatorExports.length).toBeGreaterThan(0);
  });

  it('re-exports are callable functions', () => {
    const allFunctions = Object.values(homepageUtils).filter(v => typeof v === 'function');
    expect(allFunctions.length).toBeGreaterThan(5);
  });

  describe('formatTime', () => {
    it('returns empty string for falsy input', () => {
      expect(homepageUtils.formatTime('')).toBe('');
      expect(homepageUtils.formatTime(null)).toBe('');
    });
  });

  describe('fmtDurationShort', () => {
    it('formats minutes under an hour', () => {
      expect(homepageUtils.fmtDurationShort(45)).toBe('45m');
    });

    it('formats whole hours', () => {
      expect(homepageUtils.fmtDurationShort(60)).toBe('1h');
    });

    it('formats hours with remaining minutes', () => {
      expect(homepageUtils.fmtDurationShort(90)).toBe('1h 30m');
    });

    it('returns empty string for null', () => {
      expect(homepageUtils.fmtDurationShort(null)).toBe('');
    });

    it('returns empty string for negative values', () => {
      expect(homepageUtils.fmtDurationShort(-5)).toBe('');
    });
  });

  describe('formatTime12h', () => {
    it('returns empty string for falsy input', () => {
      expect(homepageUtils.formatTime12h('')).toBe('');
    });

    it('formats noon as 12pm', () => {
      expect(homepageUtils.formatTime12h('2026-03-08T12:00:00')).toBe('12pm');
    });

    it('formats midnight as 12am', () => {
      expect(homepageUtils.formatTime12h('2026-03-08T00:00:00')).toBe('12am');
    });
  });

  describe('formatHour12h', () => {
    it('formats hour 0 as 12am', () => {
      expect(homepageUtils.formatHour12h(0)).toBe('12am');
    });

    it('formats hour 12 as 12pm', () => {
      expect(homepageUtils.formatHour12h(12)).toBe('12pm');
    });

    it('formats hour 6 as 6am', () => {
      expect(homepageUtils.formatHour12h(6)).toBe('6am');
    });

    it('formats hour 14 as 2pm', () => {
      expect(homepageUtils.formatHour12h(14)).toBe('2pm');
    });

    it('formats hour with minutes', () => {
      expect(homepageUtils.formatHour12h(14, 30)).toBe('2:30pm');
    });
  });

  describe('stripEmojiFromTitle', () => {
    it('returns non-string input as empty string', () => {
      expect(homepageUtils.stripEmojiFromTitle(null)).toBe('');
    });

    it('strips emojis from string', () => {
      expect(homepageUtils.stripEmojiFromTitle('Hello 😀 World')).toBe('Hello World');
    });

    it('returns plain text unchanged', () => {
      expect(homepageUtils.stripEmojiFromTitle('Hello World')).toBe('Hello World');
    });
  });

  describe('isLecture', () => {
    it('returns true for items with "lecture" in title', () => {
      expect(homepageUtils.isLecture({ title: 'Math Lecture' })).toBe(true);
    });

    it('returns true for items with timetable source', () => {
      expect(homepageUtils.isLecture({ title: 'CS Lab', source: 'timetable' })).toBe(true);
    });

    it('returns false for regular events', () => {
      expect(homepageUtils.isLecture({ title: 'Meeting' })).toBe(false);
    });
  });

  describe('isRoutineEvent', () => {
    it('returns true for breakfast', () => {
      expect(homepageUtils.isRoutineEvent({ title: 'Breakfast' })).toBe(true);
    });

    it('returns true for routine tag', () => {
      expect(homepageUtils.isRoutineEvent({ title: 'Other', tag_name: 'routine' })).toBe(true);
    });

    it('returns false for regular events', () => {
      expect(homepageUtils.isRoutineEvent({ title: 'Team Meeting' })).toBe(false);
    });
  });

  describe('extractModuleCode', () => {
    it('extracts module code from string', () => {
      expect(homepageUtils.extractModuleCode('CS4001 - Algorithms')).toBe('CS4001');
    });

    it('returns null when no module code found', () => {
      expect(homepageUtils.extractModuleCode('No code here')).toBeNull();
    });

    it('handles null input', () => {
      expect(homepageUtils.extractModuleCode(null)).toBeNull();
    });
  });
});
