import { describe, it, expect } from 'vitest';
import {
  SLOT_HEIGHT,
  SNAP_INTERVAL,
  MIN_EVENT_DURATION,
  PIXELS_PER_SNAP,
  pixelsToMinutes,
  minutesToPixels,
  getMinuteOffset,
} from '../../../components/calendar/calendarConstants';

describe('calendarConstants', () => {
  it('exports base constants', () => {
    expect(SLOT_HEIGHT).toBe(60);
    expect(SNAP_INTERVAL).toBe(15);
    expect(MIN_EVENT_DURATION).toBe(15);
    expect(PIXELS_PER_SNAP).toBe(15);
  });

  it('converts pixels/minutes with snap', () => {
    expect(pixelsToMinutes(30)).toBe(30);
    expect(pixelsToMinutes(17)).toBe(15);
    expect(minutesToPixels(90)).toBe(90);
    expect(getMinuteOffset(130, 100)).toBe(30);
  });
});
