import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as api from '../../api/socialService';
import { fetchApi } from '../../api/client';

vi.mock('../../api/client', () => ({
    fetchApi: vi.fn(),
}));

describe('socialService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shareCalendar sends POST', async () => {
        await api.shareCalendar(42);
        expect(fetchApi).toHaveBeenCalledWith('/social/42/share/', { method: 'POST' });
    });

    it('unshareCalendar sends POST', async () => {
        await api.unshareCalendar(42);
        expect(fetchApi).toHaveBeenCalledWith('/social/42/unshare/', { method: 'POST' });
    });

    it('getSharedWithMe sends GET', async () => {
        await api.getSharedWithMe(42);
        expect(fetchApi).toHaveBeenCalledWith('/social/42/shared-with-me/');
    });

    it('getSharingWith sends GET', async () => {
        await api.getSharingWith(42);
        expect(fetchApi).toHaveBeenCalledWith('/social/42/sharing-with/');
    });
});
