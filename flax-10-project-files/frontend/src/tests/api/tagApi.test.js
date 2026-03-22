import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as api from '../../api/tags/tagApi';
import { fetchApi } from '../../api/client';

vi.mock('../../api/client', () => ({
    fetchApi: vi.fn(),
}));

describe('tagApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch tags', async () => {
        await api.getTags();
        expect(fetchApi).toHaveBeenCalledWith('/tags/');
    });

    it('should create tag', async () => {
        const payload = { title: 'Test' };
        await api.createTag(payload);
        expect(fetchApi).toHaveBeenCalledWith('/tags/', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    });

    it('should delete tag', async () => {
        await api.deleteTag(1);
        expect(fetchApi).toHaveBeenCalledWith('/tags/1/', {
            method: 'DELETE',
        });
    });

    it('should update tag', async () => {
        const payload = { title: 'Updated' };
        await api.updateTag(1, payload);
        expect(fetchApi).toHaveBeenCalledWith('/tags/1/', {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
    });
});
