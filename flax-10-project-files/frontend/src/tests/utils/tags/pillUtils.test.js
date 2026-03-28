import { describe, it, expect } from 'vitest';
import { countByType } from '../../../components/tags/utils/pillUtils';

describe('countByType', () => {
  it('returns all count for empty array', () => {
    expect(countByType([])).toEqual({ all: 0 });
  });

  it('counts items by tag_name', () => {
    const items = [
      { tag_name: 'lecture' },
      { tag_name: 'lecture' },
      { tag_name: 'seminar' },
    ];
    expect(countByType(items)).toEqual({ all: 3, lecture: 2, seminar: 1 });
  });

  it('skips items with no tag_name', () => {
    const items = [{ tag_name: null }, { tag_name: undefined }, { tag_name: 'lab' }];
    expect(countByType(items)).toEqual({ all: 3, other: 2, lab: 1 });
  });

  it('is case-insensitive (lowercases tag)', () => {
    const items = [{ tag_name: 'Lecture' }, { tag_name: 'lecture' }];
    expect(countByType(items)).toEqual({ all: 2, lecture: 2 });
  });

  it('counts ratified items', () => {
    const items = [
      { tag_name: 'lab', is_ratified: true },
      { tag_name: 'lab', is_ratified: true },
      { tag_name: 'lab', is_ratified: false },
    ];
    const result = countByType(items);
    expect(result.ratified).toBe(2);
    expect(result.unratified).toBe(1);
    expect(result.lab).toBe(3);
  });

  it('counts society source items', () => {
    const items = [{ source: 'society', tag_name: null }];
    expect(countByType(items)).toEqual({ all: 1, societies: 1 });
  });
});