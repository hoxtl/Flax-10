/**
 * Tests for eventStyleUtils - event theming based on tags and event type.
 */

import { describe, it, expect, vi } from 'vitest';
import { getEventTheme } from '../../../../components/calendar/utils/eventStyleUtils';

vi.mock('../../../../components/calendar/utils/eventUtils', () => ({
    getEffectiveTagName: vi.fn((event) => {
        if (event._tagName !== undefined) return event._tagName;
        return 'other';
    }),
}));

describe('getEventTheme', () => {
    it('returns tag_color directly when event has tag_color', () => {
        const event = { tag_color: '#ff0000' };
        const result = getEventTheme(event, null);
        expect(result).toEqual({ color: '#ff0000', icon: '🏷️' });
    });

    it('returns tag color from tags context using getTagByName function', () => {
        const event = { _tagName: 'work' };
        const tags = {
            getTagByName: vi.fn().mockReturnValue({ color: '#0000ff', icon: '💼' }),
        };
        const result = getEventTheme(event, tags);
        expect(tags.getTagByName).toHaveBeenCalledWith('work');
        expect(result).toEqual({ color: '#0000ff', icon: '💼' });
    });

    it('falls back when getTagByName returns null', () => {
        const event = { _tagName: 'unknown', society_color: '#abc123' };
        const tags = { getTagByName: vi.fn().mockReturnValue(null) };
        const result = getEventTheme(event, tags);
        expect(result.color).toBe('#abc123');
    });

    it('finds tag by label in tags array (case-insensitive)', () => {
        const event = { _tagName: 'work' };
        const tags = {
            tags: [{ label: 'Work', color: '#7B6751', icon: '🏢' }],
        };
        const result = getEventTheme(event, tags);
        expect(result).toEqual({ color: '#7B6751', icon: '🏢' });
    });

    it('finds tag by name property in tags array', () => {
        const event = { _tagName: 'study' };
        const tags = {
            tags: [{ name: 'Study', color: '#123456', icon: '📚' }],
        };
        const result = getEventTheme(event, tags);
        expect(result).toEqual({ color: '#123456', icon: '📚' });
    });

    it('returns society_color when no tag is found', () => {
        const event = { _tagName: 'nonexistent', society_color: '#aabbcc' };
        const tags = { tags: [] };
        const result = getEventTheme(event, tags);
        expect(result.color).toBe('#aabbcc');
        expect(result.icon).toBe('🏷️');
    });

    it('returns default caramel color when no society_color and no tag found', () => {
        const event = { _tagName: 'unknown' };
        const tags = { tags: [] };
        const result = getEventTheme(event, tags);
        expect(result.color).toBe('var(--color-caramel)');
        expect(result.icon).toBe('🏷️');
    });

    it('returns default when tags context is null', () => {
        const event = { _tagName: 'work' };
        const result = getEventTheme(event, null);
        expect(result.color).toBe('var(--color-caramel)');
    });

    it('returns default when tagName is falsy', () => {
        const event = { _tagName: '' };
        const tags = { tags: [{ label: 'Work', color: '#7B6751', icon: '🏢' }] };
        const result = getEventTheme(event, tags);
        expect(result.color).toBe('var(--color-caramel)');
    });

    it('returns default when tags array is undefined in context', () => {
        const event = { _tagName: 'work' };
        const tags = {}; // no getTagByName, no tags array
        const result = getEventTheme(event, tags);
        expect(result.color).toBe('var(--color-caramel)');
    });

    it('falls back when array tags have no matching label or name values', () => {
        const event = { _tagName: 'work' };
        const tags = { tags: [{}] };
        const result = getEventTheme(event, tags);
        expect(result).toEqual({ color: 'var(--color-caramel)', icon: '🏷️' });
    });
});
