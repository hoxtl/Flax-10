import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as api from '../../api/societyApi';
import { fetchApi } from '../../api/client';

vi.mock('../../api/client', () => ({
    fetchApi: vi.fn(),
}));

describe('societyApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetchSocieties', async () => {
        await api.fetchSocieties();
        expect(fetchApi).toHaveBeenCalledWith('/societies/');
    });

    it('fetchSociety', async () => {
        await api.fetchSociety(1);
        expect(fetchApi).toHaveBeenCalledWith('/societies/1/');
    });

    it('createSociety sends POST', async () => {
        const data = { name: 'Chess Club' };
        await api.createSociety(data);
        expect(fetchApi).toHaveBeenCalledWith('/societies/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    });

    it('updateSociety sends PATCH', async () => {
        const data = { name: 'Updated Club' };
        await api.updateSociety(1, data);
        expect(fetchApi).toHaveBeenCalledWith('/societies/1/', {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    });

    it('deleteSociety sends DELETE', async () => {
        await api.deleteSociety(1);
        expect(fetchApi).toHaveBeenCalledWith('/societies/1/', { method: 'DELETE' });
    });

    it('fetchMembers', async () => {
        await api.fetchMembers(1);
        expect(fetchApi).toHaveBeenCalledWith('/societies/1/members/');
    });

    it('joinSociety sends POST', async () => {
        await api.joinSociety(1);
        expect(fetchApi).toHaveBeenCalledWith('/societies/1/members/', {
            method: 'POST',
            body: JSON.stringify({}),
        });
    });

    it('leaveSociety sends DELETE', async () => {
        await api.leaveSociety(1, 99);
        expect(fetchApi).toHaveBeenCalledWith('/societies/1/members/99/', { method: 'DELETE' });
    });

    it('updateMemberRole sends PATCH with role', async () => {
        await api.updateMemberRole(1, 99, 'admin');
        expect(fetchApi).toHaveBeenCalledWith('/societies/1/members/99/', {
            method: 'PATCH',
            body: JSON.stringify({ role: 'admin' }),
        });
    });

    it('addCollaborator sends POST with username and role', async () => {
        await api.addCollaborator(1, 'jdoe', 'member');
        expect(fetchApi).toHaveBeenCalledWith('/societies/1/members/', {
            method: 'POST',
            body: JSON.stringify({ username: 'jdoe', role: 'member' }),
        });
    });

    it('fetchSocietyTags', async () => {
        await api.fetchSocietyTags(1);
        expect(fetchApi).toHaveBeenCalledWith('/societies/1/tags/');
    });

    it('createSocietyTag sends POST', async () => {
        await api.createSocietyTag(1, { name: 'Tech' });
        expect(fetchApi).toHaveBeenCalledWith('/societies/1/tags/', {
            method: 'POST',
            body: JSON.stringify({ name: 'Tech' }),
        });
    });

    it('updateSocietyTag sends PATCH', async () => {
        await api.updateSocietyTag(1, 5, { name: 'Science' });
        expect(fetchApi).toHaveBeenCalledWith('/societies/1/tags/5/', {
            method: 'PATCH',
            body: JSON.stringify({ name: 'Science' }),
        });
    });

    it('deleteSocietyTag sends DELETE', async () => {
        await api.deleteSocietyTag(1, 5);
        expect(fetchApi).toHaveBeenCalledWith('/societies/1/tags/5/', { method: 'DELETE' });
    });

    it('fetchAnnouncements', async () => {
        await api.fetchAnnouncements(1);
        expect(fetchApi).toHaveBeenCalledWith('/societies/1/announcements/');
    });

    it('createAnnouncement sends POST without silent', async () => {
        await api.createAnnouncement(1, { text: 'Hello' });
        expect(fetchApi).toHaveBeenCalledWith('/societies/1/announcements/', {
            method: 'POST',
            body: JSON.stringify({ text: 'Hello' }),
        });
    });

    it('createAnnouncement with silent=true appends query', async () => {
        await api.createAnnouncement(1, { text: 'Hello' }, true);
        expect(fetchApi).toHaveBeenCalledWith('/societies/1/announcements/?silent=true', {
            method: 'POST',
            body: JSON.stringify({ text: 'Hello' }),
        });
    });

    it('updateAnnouncement sends PATCH', async () => {
        await api.updateAnnouncement(1, 10, { text: 'Updated' });
        expect(fetchApi).toHaveBeenCalledWith('/societies/1/announcements/10/', {
            method: 'PATCH',
            body: JSON.stringify({ text: 'Updated' }),
        });
    });

    it('deleteAnnouncement sends DELETE', async () => {
        await api.deleteAnnouncement(1, 10);
        expect(fetchApi).toHaveBeenCalledWith('/societies/1/announcements/10/', { method: 'DELETE' });
    });

    it('getSyncStatus', async () => {
        await api.getSyncStatus(1);
        expect(fetchApi).toHaveBeenCalledWith('/societies/1/calendar-sync-status/');
    });

    it('syncCalendar sends POST', async () => {
        await api.syncCalendar(1);
        expect(fetchApi).toHaveBeenCalledWith('/societies/1/calendar-sync/', {
            method: 'POST',
            body: JSON.stringify({}),
        });
    });

    it('unsyncCalendar sends DELETE', async () => {
        await api.unsyncCalendar(1);
        expect(fetchApi).toHaveBeenCalledWith('/societies/1/calendar-unsync/', { method: 'DELETE' });
    });

    it('reportSociety sends POST with reason', async () => {
        await api.reportSociety(1, 'spam');
        expect(fetchApi).toHaveBeenCalledWith('/societies/1/report/', {
            method: 'POST',
            body: JSON.stringify({ reason: 'spam' }),
        });
    });

    it('unreportSociety sends DELETE', async () => {
        await api.unreportSociety(1);
        expect(fetchApi).toHaveBeenCalledWith('/societies/1/report/', { method: 'DELETE' });
    });

    it('requestRatification sends POST', async () => {
        await api.requestRatification(1);
        expect(fetchApi).toHaveBeenCalledWith('/societies/1/ratification/request/', {
            method: 'POST',
            body: JSON.stringify({}),
        });
    });

    it('toggleSubscription sends PATCH with is_subscribed', async () => {
        await api.toggleSubscription(1, true);
        expect(fetchApi).toHaveBeenCalledWith('/societies/1/subscribe/', {
            method: 'PATCH',
            body: JSON.stringify({ is_subscribed: true }),
        });
        fetchApi.mockClear();
        await api.toggleSubscription(2, false);
        expect(fetchApi).toHaveBeenCalledWith('/societies/2/subscribe/', {
            method: 'PATCH',
            body: JSON.stringify({ is_subscribed: false }),
        });
    });

    it('fetchSocietyEvent', async () => {
        await api.fetchSocietyEvent(1, 20);
        expect(fetchApi).toHaveBeenCalledWith('/societies/1/events/20/');
    });

    it('createSocietyEvent sends POST', async () => {
        await api.createSocietyEvent(1, { title: 'Event' });
        expect(fetchApi).toHaveBeenCalledWith('/societies/1/events/', {
            method: 'POST',
            body: JSON.stringify({ title: 'Event' }),
        });
    });

    it('updateSocietyEvent sends PATCH', async () => {
        await api.updateSocietyEvent(1, 20, { title: 'Updated' });
        expect(fetchApi).toHaveBeenCalledWith('/societies/1/events/20/', {
            method: 'PATCH',
            body: JSON.stringify({ title: 'Updated' }),
        });
    });

    it('deleteSocietyEvent sends DELETE', async () => {
        await api.deleteSocietyEvent(1, 20);
        expect(fetchApi).toHaveBeenCalledWith('/societies/1/events/20/', { method: 'DELETE' });
    });

    it('addExceptionDate sends POST with date', async () => {
        await api.addExceptionDate(1, 20, '2026-01-01');
        expect(fetchApi).toHaveBeenCalledWith('/societies/1/events/20/exception/', {
            method: 'POST',
            body: JSON.stringify({ date: '2026-01-01' }),
        });
    });

    it('publishChanges sends POST with changes', async () => {
        const changes = { added: [1, 2] };
        await api.publishChanges(1, changes);
        expect(fetchApi).toHaveBeenCalledWith('/societies/1/publish/', {
            method: 'POST',
            body: JSON.stringify(changes),
        });
    });

    it('publishChanges with no second argument uses default empty object', async () => {
        await api.publishChanges(1);
        expect(fetchApi).toHaveBeenCalledWith('/societies/1/publish/', {
            method: 'POST',
            body: JSON.stringify({}),
        });
    });
});
