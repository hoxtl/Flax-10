import { describe, it, expect } from 'vitest';
import { countByType } from '../../utils/pillUtils';

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
    expect(countByType(items)).toEqual({ all: 3, lab: 1 });
  });

  it('is case-insensitive (lowercases tag)', () => {
    const items = [{ tag_name: 'Lecture' }, { tag_name: 'lecture' }];
    expect(countByType(items)).toEqual({ all: 2, lecture: 2 });
  });
});