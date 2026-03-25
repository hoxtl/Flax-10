import { describe, it, expect, vi } from 'vitest';
import { 
    getImageUrls, getAvailablePhotos, scrollContentToTop,
    wrapAddEvent, wrapUpdateEvent, wrapDeleteEvent,
    wrapAddAnnouncement, wrapUpdateAnnouncement, wrapDeleteAnnouncement
} from '../../pages/Societies/SocietyDetailPageUtils';

describe('SocietyDetailPageUtils', () => {
    it('getImageUrls handles various inputs', () => {
        expect(getImageUrls([{ url: 'u1' }, 'u2'])).toEqual(['u1', 'u2']);
        expect(getImageUrls(null)).toEqual([]);
        expect(getImageUrls([{ url: '  trimmed  ' }, 42, { url: null }, ' plain '])).toEqual(['trimmed', 'plain']);
    });

    it('getAvailablePhotos filters used covers', () => {
        const society = {
            images: [{ url: 'c1' }],
            announcements: [
                { images: [{ url: 'c1' }, { url: 'a1' }] },
                { images: [{ url: 'a1' }, 'a2'] },
                { images: null }
            ]
        };
        const avail = getAvailablePhotos(society);
        expect(avail).toEqual(['a1', 'a2']);
        expect(getAvailablePhotos({ images: [], announcements: null })).toEqual([]);
    });

    it('scrollContentToTop handles missing scrollable', () => {
        // Mock document.querySelectorAll to return nothing scrollable
        const spy = vi.spyOn(document, 'querySelectorAll').mockReturnValue([]);
        const windowSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
        scrollContentToTop();
        expect(windowSpy).toHaveBeenCalledWith(0, 0);
        spy.mockRestore();
        windowSpy.mockRestore();
    });

    it('findScrollableParent finds a scrollable element', () => {
        const el = { scrollHeight: 200, clientHeight: 100, scrollTop: 0 };
        const spy = vi.spyOn(document, 'querySelectorAll').mockReturnValue([el]);
        const styleSpy = vi.spyOn(window, 'getComputedStyle').mockReturnValue({ overflow: 'hidden', overflowY: 'auto' });
        const windowSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
        
        scrollContentToTop();
        
        expect(el.scrollTop).toBe(0);
        spy.mockRestore();
        styleSpy.mockRestore();
        windowSpy.mockRestore();
    });

    it('wrappers call original functions and track changes', async () => {
        const track = vi.fn();
        const original = vi.fn().mockResolvedValue('res');
        
        const add = wrapAddEvent(original, true, track);
        await add({ title: 'T' });
        expect(original).toHaveBeenCalled();
        expect(track).toHaveBeenCalledWith('Added', 'T');

        const upd = wrapUpdateEvent(original, false, track);
        await upd(1, { title: 'T' });
        expect(track).toHaveBeenCalledTimes(1); // not called if silent is false
    });

    it('announcement wrappers track correctly', async () => {
        const track = vi.fn();
        const original = vi.fn().mockResolvedValue('res');
        
        const del = wrapDeleteAnnouncement(original, true, track);
        await del(1, 'Title');
        expect(track).toHaveBeenCalledWith('Deleted', 'Title');

        const upd = wrapUpdateAnnouncement(original, true, track);
        await upd(1, { title: 'T' });
        expect(track).toHaveBeenCalledWith('Updated', 'T');

        const addA = wrapAddAnnouncement(original, true, track);
        await addA({ title: 'A' });
        expect(track).toHaveBeenCalledWith('Added', 'A');

        const delE = wrapDeleteEvent(original, true, track);
        await delE(1, 'E');
        expect(track).toHaveBeenCalledWith('Deleted', 'E');
    });

    it('delete wrappers use their default titles when none are provided', async () => {
        const track = vi.fn();
        const original = vi.fn().mockResolvedValue('res');

        await wrapDeleteEvent(original, true, track)(2);
        await wrapDeleteAnnouncement(original, true, track)(3);

        expect(track).toHaveBeenCalledWith('Deleted', 'Event');
        expect(track).toHaveBeenCalledWith('Deleted', 'Ann');
    });

    it('wrappers handled non-silent mode', async () => {
        const track = vi.fn();
        const original = vi.fn().mockResolvedValue('res');

        await wrapAddEvent(original, false, track)({ title: 'Silent add' });
        const upd = wrapUpdateAnnouncement(original, false, track);
        await upd(1, { title: 'T' });
        await wrapDeleteEvent(original, false, track)(2, 'Event');
        await wrapAddAnnouncement(original, false, track)({ title: 'Announcement' });

        const del = wrapDeleteAnnouncement(original, false, track);
        await del(1, 'Title');
        expect(track).not.toHaveBeenCalled();
    });
});
