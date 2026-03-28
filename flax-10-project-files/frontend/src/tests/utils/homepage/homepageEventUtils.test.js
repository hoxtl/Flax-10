import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    stripEmojiFromTitle,
    isLecture,
    isRoutineEvent,
    isNow,
    extractModuleCode,
} from '../../../pages/homepage/utils/eventUtils';

describe('stripEmojiFromTitle', () => {
    it('removes emoji from string', () => {
        expect(stripEmojiFromTitle('Study 📖 session')).toBe('Study session');
    });

    it('returns empty string for non-string input', () => {
        expect(stripEmojiFromTitle(null)).toBe('');
        expect(stripEmojiFromTitle(undefined)).toBe('');
    });

    it('trims whitespace', () => {
        expect(stripEmojiFromTitle('  Hello  ')).toBe('Hello');
    });

    it('collapses multiple spaces', () => {
        expect(stripEmojiFromTitle('A  B   C')).toBe('A B C');
    });
});

describe('isLecture', () => {
    it('returns true for lecture in title', () => {
        expect(isLecture({ title: 'CS Lecture 3' })).toBe(true);
    });

    it('returns true for tutorial in title', () => {
        expect(isLecture({ title: 'Math Tutorial 1' })).toBe(true);
    });

    it('returns true for seminar', () => {
        expect(isLecture({ title: 'Biology Seminar' })).toBe(true);
    });

    it('returns true for timetable source', () => {
        expect(isLecture({ title: 'Random event', source: 'timetable' })).toBe(true);
    });

    it('returns false for non-lecture events', () => {
        expect(isLecture({ title: 'Meeting with friends' })).toBe(false);
    });

    it('handles null item', () => {
        expect(isLecture(null)).toBe(false);
    });

    it('handles undefined title', () => {
        expect(isLecture({})).toBe(false);
    });
});

describe('isRoutineEvent', () => {
    it('returns true for routine tag', () => {
        expect(isRoutineEvent({ title: 'Custom', tag_name: 'routine' })).toBe(true);
    });

    it('returns true for wellness tag', () => {
        expect(isRoutineEvent({ title: 'Custom', tag_name: 'wellness' })).toBe(true);
    });

    it('returns true for breakfast in title', () => {
        expect(isRoutineEvent({ title: 'Morning Breakfast' })).toBe(true);
    });

    it('returns true for lunch in title', () => {
        expect(isRoutineEvent({ title: 'Lunch break' })).toBe(true);
    });

    it('returns true for dinner, commute, snack in title', () => {
        expect(isRoutineEvent({ title: 'Evening dinner' })).toBe(true);
        expect(isRoutineEvent({ title: 'Morning commute' })).toBe(true);
        expect(isRoutineEvent({ title: 'Afternoon snack' })).toBe(true);
    });

    it('returns false for regular events', () => {
        expect(isRoutineEvent({ title: 'Team meeting' })).toBe(false);
    });

    it('handles tag as object with name', () => {
        expect(isRoutineEvent({ title: 'Custom', tag: { name: 'routine' } })).toBe(true);
    });

    it('handles tag_name fallback when tag is object', () => {
        expect(isRoutineEvent({ title: 'Custom', tag: { name: 'wellness' } })).toBe(true);
    });
});

describe('isNow', () => {
    it('returns false when startStr is null', () => {
        expect(isNow(null, '2099-01-01T10:00:00')).toBe(false);
    });

    it('returns false when endStr is null', () => {
        expect(isNow('2020-01-01T10:00:00', null)).toBe(false);
    });

    it('returns true when current time is within range', () => {
        const past = new Date(Date.now() - 60000).toISOString();
        const future = new Date(Date.now() + 60000).toISOString();
        expect(isNow(past, future)).toBe(true);
    });

    it('returns false when current time is before range', () => {
        const future1 = new Date(Date.now() + 60000).toISOString();
        const future2 = new Date(Date.now() + 120000).toISOString();
        expect(isNow(future1, future2)).toBe(false);
    });

    it('returns false when current time is after range', () => {
        const past1 = new Date(Date.now() - 120000).toISOString();
        const past2 = new Date(Date.now() - 60000).toISOString();
        expect(isNow(past1, past2)).toBe(false);
    });
});

describe('extractModuleCode', () => {
    it('extracts module code from string', () => {
        expect(extractModuleCode('CS1234 Lecture')).toBe('CS1234');
    });

    it('extracts 3-letter code', () => {
        expect(extractModuleCode('BIO1234 Lab')).toBe('BIO1234');
    });

    it('returns null when no module code found', () => {
        expect(extractModuleCode('No code here')).toBeNull();
    });

    it('handles null/empty input', () => {
        expect(extractModuleCode(null)).toBeNull();
        expect(extractModuleCode('')).toBeNull();
    });
});
