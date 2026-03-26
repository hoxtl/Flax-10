import { describe, it, expect } from 'vitest';
import {
  isProtectedTag,
  getInitialTagForm,
  findDuplicateTag,
  validateTagForm,
} from '../../../components/tags/tag_manager/tagManagerUtils';

const tags = [
  { id: 1, label: 'Work', color: '#ff0000' },
  { id: 2, label: 'other', color: '#00ff00' },
  { id: 3, label: 'lecture', color: '#0000ff' },
];

describe('isProtectedTag', () => {
  it('returns true for "other" (case-insensitive)', () => {
    expect(isProtectedTag('other')).toBe(true);
    expect(isProtectedTag('Other')).toBe(true);
    expect(isProtectedTag('OTHER')).toBe(true);
  });

  it('returns true for all protected tag names', () => {
    const protectedNames = ['other', 'lecture', 'deadline', 'exam', 'societies', 'schedule'];
    for (const name of protectedNames) {
      expect(isProtectedTag(name)).toBe(true);
    }
  });

  it('returns false for non-protected tags', () => {
    expect(isProtectedTag('Work')).toBe(false);
    expect(isProtectedTag('Personal')).toBe(false);
    expect(isProtectedTag('Gym')).toBe(false);
  });

  it('returns false when tagLabel is undefined or null', () => {
    expect(isProtectedTag(undefined)).toBe(false);
    expect(isProtectedTag(null)).toBe(false);
  });
});

describe('getInitialTagForm', () => {
  it('returns the matching tag when editingId exists', () => {
    const result = getInitialTagForm(tags, 1);
    expect(result).toEqual({ id: 1, label: 'Work', color: '#ff0000' });
  });

  it('returns DEFAULT_TAG_FORM when no matching tag found', () => {
    const result = getInitialTagForm(tags, 999);
    expect(result).toEqual({ label: '', color: 'var(--color-tag-none)' });
  });

  it('returns DEFAULT_TAG_FORM when editingId is null', () => {
    const result = getInitialTagForm(tags, null);
    expect(result).toEqual({ label: '', color: 'var(--color-tag-none)' });
  });
});

describe('findDuplicateTag', () => {
  it('finds tag with matching label (case-insensitive)', () => {
    expect(findDuplicateTag(tags, 'work')).toEqual({ id: 1, label: 'Work', color: '#ff0000' });
    expect(findDuplicateTag(tags, 'WORK')).toEqual({ id: 1, label: 'Work', color: '#ff0000' });
  });

  it('returns undefined when no duplicate exists', () => {
    expect(findDuplicateTag(tags, 'NonExistent')).toBeUndefined();
  });

  it('matches exact label', () => {
    expect(findDuplicateTag(tags, 'lecture')).toEqual({ id: 3, label: 'lecture', color: '#0000ff' });
  });
});

describe('validateTagForm', () => {
  it('returns error message when label is empty and not protected', () => {
    expect(validateTagForm({ label: '', color: '#fff' }, false)).toBe('Name is required.');
  });

  it('returns error when label is whitespace only', () => {
    expect(validateTagForm({ label: '   ', color: '#fff' }, false)).toBe('Name is required.');
  });

  it('returns empty string when label is valid', () => {
    expect(validateTagForm({ label: 'Gym', color: '#fff' }, false)).toBe('');
  });

  it('returns empty string when isProtected is true regardless of label', () => {
    expect(validateTagForm({ label: '', color: '#fff' }, true)).toBe('');
    expect(validateTagForm({ label: '  ', color: '#fff' }, true)).toBe('');
  });
});
