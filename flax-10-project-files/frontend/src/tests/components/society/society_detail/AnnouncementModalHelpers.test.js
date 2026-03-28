/**
 * Unit tests for AnnouncementModalHelpers (getInitialForm, validateForm, handleFileSelect).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getInitialForm,
  getImageList,
  validateForm,
  handleFileSelect,
  MAX_IMAGES,
} from '../../../../components/society/society_detail/tabs/announcement_tab/announcementModalHelpers';

const validateEventTimesMock = vi.fn();
vi.mock('../../../../components/calendar/utils/dateValidation', () => ({
  validateEventTimes: (...args) => validateEventTimesMock(...args),
}));

describe('AnnouncementModalHelpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateEventTimesMock.mockReturnValue(null);
  });

  describe('MAX_IMAGES', () => {
    it('is 5', () => {
      expect(MAX_IMAGES).toBe(5);
    });
  });

  describe('getInitialForm', () => {
    it('returns base when announcement is null/undefined', () => {
      expect(getInitialForm(null)).toEqual({
        title: '',
        content: '',
        images: [],
        tag: null,
        addAsEvent: false,
        all_day: false,
        start_time: '',
        end_time: '',
        recurrence: '',
        pinned: false,
      });
      expect(getInitialForm(undefined)).toEqual(getInitialForm(null));
    });

    it('maps announcement to form with title, content, tag, pinned', () => {
      const form = getInitialForm({
        id: 10,
        title: 'Hi',
        content: 'Body',
        tag: 5,
        pinned: true,
      });
      expect(form.title).toBe('Hi');
      expect(form.content).toBe('Body');
      expect(form.tag).toBe(5);
      expect(form.pinned).toBe(true);
      expect(form.id).toBe(10);
      expect(form.event_id).toBeNull();
      expect(form.addAsEvent).toBe(false);
    });

    it('uses tagId when tag is missing', () => {
      const form = getInitialForm({ tagId: 7 });
      expect(form.tag).toBe(7);
    });

    it('extracts image URLs from string array', () => {
      const form = getInitialForm({ images: ['a.jpg', 'b.png'] });
      expect(form.images).toEqual(['a.jpg', 'b.png']);
    });

    it('extracts image URLs from objects with url', () => {
      const form = getInitialForm({
        images: [{ url: 'x.jpg' }, { id: 1, url: 'y.png' }],
      });
      expect(form.images).toEqual(['x.jpg', 'y.png']);
    });

    it('handles mixed string and object-with-url images and filters falsy', () => {
      const form = getInitialForm({
        images: ['a', { url: 'b' }, ''],
      });
      expect(form.images).toEqual(['a', 'b']);
    });

    it('sets addAsEvent and event_id when announcement has event_id', () => {
      const form = getInitialForm({ event_id: 99 });
      expect(form.addAsEvent).toBe(true);
      expect(form.event_id).toBe(99);
    });

    it('handles empty or missing images', () => {
      expect(getInitialForm({}).images).toEqual([]);
      expect(getInitialForm({ images: null }).images).toEqual([]);
    });

    it('falls back to a single image field and filters unusable image objects', () => {
      expect(getInitialForm({ image: 'cover.jpg' }).images).toEqual(['cover.jpg']);
      expect(getInitialForm({ image: { url: 'cover-2.jpg' } }).images).toEqual(['cover-2.jpg']);
      expect(getImageList({ images: [{ id: 1 }, null, { url: 'usable.jpg' }] })).toEqual(['usable.jpg']);
    });
  });

  describe('validateForm', () => {
    it('returns error when title is missing or whitespace', () => {
      expect(validateForm({ title: '' })).toBe('Title is required');
      expect(validateForm({ title: '   ' })).toBe('Title is required');
      expect(validateForm({ title: null })).toBe('Title is required');
    });

    it('returns null when addAsEvent is false', () => {
      expect(validateForm({ title: 'Ok', addAsEvent: false })).toBeNull();
    });

    it('delegates to validateEventTimes when addAsEvent is true', () => {
      validateEventTimesMock.mockReturnValue('Start time is required');
      expect(validateForm({ title: 'Ok', addAsEvent: true })).toBe(
        'Start time is required',
      );
      validateEventTimesMock.mockReturnValue(null);
      expect(validateForm({ title: 'Ok', addAsEvent: true })).toBeNull();
    });
  });

  describe('handleFileSelect', () => {
    it('does nothing when file is null/undefined', () => {
      const onAdd = vi.fn();
      const fileRef = { current: null };
      handleFileSelect(null, onAdd, fileRef);
      handleFileSelect(undefined, onAdd, fileRef);
      expect(onAdd).not.toHaveBeenCalled();
    });

    it('reads file and calls onAdd with data URL and clears input', () => {
      vi.stubGlobal('FileReader', class {
        readAsDataURL() {
          this.onload?.({ target: { result: 'data:image/png;base64,eA==' } });
        }
      });

      const onAdd = vi.fn();
      const fileRef = { current: { value: 'x' } };
      const file = new File([new Uint8Array([120])], 'f.png', {
        type: 'image/png',
      });

      handleFileSelect(file, onAdd, fileRef);
      expect(onAdd).toHaveBeenCalledWith('data:image/png;base64,eA==');
      expect(fileRef.current.value).toBe('');
    });

    it('does not clear input when fileRef.current is null', () => {
      vi.stubGlobal('FileReader', class {
        readAsDataURL() {
          this.onload?.({ target: { result: 'data:image/png;base64,eA==' } });
        }
      });

      const onAdd = vi.fn();
      const fileRef = { current: null };
      const file = new File(['x'], 'f.png', { type: 'image/png' });
      handleFileSelect(file, onAdd, fileRef);
      expect(onAdd).toHaveBeenCalledWith('data:image/png;base64,eA==');
    });
  });
});
