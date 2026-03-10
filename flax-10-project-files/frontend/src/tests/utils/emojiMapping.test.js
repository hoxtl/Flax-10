import { describe, it, expect, vi } from 'vitest';
import { getTaskEmoji } from '../../utils/emojiMapping';

describe('getTaskEmoji', () => {
    it('returns study emoji for study keywords', () => {
        expect(getTaskEmoji('study session')).toBe('📖');
        expect(getTaskEmoji('exam prep')).toBe('📖');
        expect(getTaskEmoji('revision')).toBe('📖');
    });

    it('returns lecture emoji for lecture keywords', () => {
        expect(getTaskEmoji('lecture 1')).toBe('🎓');
        expect(getTaskEmoji('seminar')).toBe('🎓');
        expect(getTaskEmoji('tutorial')).toBe('🎓');
    });

    it('returns coffee emoji for breakfast keywords', () => {
        expect(getTaskEmoji('morning coffee')).toBe('☕');
        expect(getTaskEmoji('breakfast')).toBe('☕');
    });

    it('returns food emoji for meal keywords', () => {
        expect(getTaskEmoji('lunch')).toBe('🍱');
        expect(getTaskEmoji('dinner time')).toBe('🍱');
    });

    it('returns gym emoji for exercise keywords', () => {
        expect(getTaskEmoji('gym session')).toBe('🏃‍♀️');
        expect(getTaskEmoji('go for a run')).toBe('🏃‍♀️');
    });

    it('returns relax emoji for meditation keywords', () => {
        expect(getTaskEmoji('meditation')).toBe('✨');
        expect(getTaskEmoji('take a break')).toBe('✨');
    });

    it('returns laundry emoji for admin keywords', () => {
        expect(getTaskEmoji('laundry')).toBe('🧺');
        expect(getTaskEmoji('emails')).toBe('🧺');
    });

    it('returns party emoji for social keywords', () => {
        expect(getTaskEmoji('meet a friend')).toBe('🎈');
        expect(getTaskEmoji('party')).toBe('🎈');
    });

    it('returns sleep emoji for bed keywords', () => {
        expect(getTaskEmoji('sleep')).toBe('🌙');
        expect(getTaskEmoji('bedtime')).toBe('🌙');
    });

    it('returns travel emoji for transit keywords', () => {
        expect(getTaskEmoji('bus ride')).toBe('🚌');
        expect(getTaskEmoji('commute')).toBe('🚌');
    });

    it('returns time-based fallback for unknown title', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T08:00:00'));
        expect(getTaskEmoji('random stuff')).toBe('☀️'); // morning
        vi.setSystemTime(new Date('2026-01-01T13:00:00'));
        expect(getTaskEmoji('something else')).toBe('🌱'); // afternoon
        vi.setSystemTime(new Date('2026-01-01T19:00:00'));
        expect(getTaskEmoji('unknown')).toBe('🌆'); // evening
        vi.setSystemTime(new Date('2026-01-01T23:00:00'));
        expect(getTaskEmoji('zzz')).toBe('☁️'); // night
        vi.useRealTimers();
    });

    it('returns time-based fallback for empty title', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T08:00:00'));
        expect(getTaskEmoji('')).toBe('☀️');
        expect(getTaskEmoji(null)).toBe('☀️');
        vi.useRealTimers();
    });

    it('uses provided startTime for fallback when title is empty', () => {
        const morning = new Date('2026-01-01T08:00:00');
        expect(getTaskEmoji('', morning)).toBe('☀️');
    });

    it('uses provided startTime string for fallback', () => {
        expect(getTaskEmoji('', '2026-01-01T13:00:00')).toBe('🌱');
    });

    it('case-insensitive matching', () => {
        expect(getTaskEmoji('EXAM')).toBe('📖');
        expect(getTaskEmoji('Lecture')).toBe('🎓');
    });
});
