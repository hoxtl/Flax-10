import { describe, expect, it, vi } from 'vitest';

import {
  buildMenuStyle,
  computeOpenDirection,
  filterFlat,
  filterGrouped,
  makeOutsideClickListener,
} from '../../../components/common/AnimatedDropdown/animatedDropdownUtils';

describe('animatedDropdownUtils', () => {
  it('filters grouped options case-insensitively and preserves the original list for blank queries', () => {
    const groups = [
      { label: 'Letters', options: [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }] },
      { label: 'Numbers', options: [{ value: '1', label: 'One' }] },
    ];

    expect(filterGrouped(groups, '   ')).toBe(groups);
    expect(filterGrouped(groups, 'ALP')).toEqual([
      { label: 'Letters', options: [{ value: 'a', label: 'Alpha' }] },
    ]);
  });

  it('filters flat string and object options', () => {
    const options = ['Alpha', { value: 'b', label: 'Beta' }];
    expect(filterFlat(options, 'be')).toEqual([{ value: 'b', label: 'Beta' }]);
    expect(filterFlat(options, '   ')).toBe(options);
  });

  it('builds fixed menu styles and computes upward opening when space is tighter below', () => {
    const oldInnerHeight = window.innerHeight;
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });

    expect(computeOpenDirection({ top: 500, bottom: 760, left: 20, width: 120 }, 260, true)).toEqual({
      shouldOpenUpward: true,
      coords: { top: 500, left: 20, width: 120 },
    });

    expect(buildMenuStyle(true, true, { top: 500, left: 20, width: 120 }, 180)).toMatchObject({
      position: 'fixed',
      top: 'auto',
      bottom: 304,
      left: 20,
      minWidth: 120,
      width: 'max-content',
      maxHeight: 180,
    });

    Object.defineProperty(window, 'innerHeight', { value: oldInnerHeight, configurable: true });
  });

  it('keeps a downward menu inline when flipping is not needed', () => {
    const oldInnerHeight = window.innerHeight;
    Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true });

    expect(computeOpenDirection({ top: 100, bottom: 180, left: 10, width: 90 }, 260, true)).toEqual({
      shouldOpenUpward: false,
      coords: { top: 180, left: 10, width: 90 },
    });
    expect(buildMenuStyle(false, false, null, undefined)).toEqual({});

    Object.defineProperty(window, 'innerHeight', { value: oldInnerHeight, configurable: true });
  });

  it('positions a portal menu below the trigger when opening downward', () => {
    expect(buildMenuStyle(false, true, { top: 120, left: 16, width: 140 }, 150)).toMatchObject({
      position: 'fixed',
      top: 124,
      bottom: 'auto',
      left: 16,
      minWidth: 140,
      maxHeight: 150,
    });
  });

  it('only closes the menu when a click lands outside both refs', () => {
    const container = document.createElement('div');
    const menu = document.createElement('div');
    const inside = document.createElement('button');
    const menuInside = document.createElement('button');
    container.appendChild(inside);
    menu.appendChild(menuInside);

    const setIsOpen = vi.fn();
    const listener = makeOutsideClickListener(
      { current: container },
      { current: menu },
      setIsOpen,
    );

    listener({ target: inside });
    listener({ target: menuInside });
    expect(setIsOpen).not.toHaveBeenCalled();

    listener({ target: document.body });
    expect(setIsOpen).toHaveBeenCalledWith(false);
  });
});
