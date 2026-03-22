/**
 * Unit tests for useSocietyDetail.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSocietyDetail } from '../../components/Society/hooks/useSocietyDetail';

const notifyMock = vi.fn();

vi.mock('../../components/Notifications/hooks/useNotify', () => ({
  useNotify: () => notifyMock,
}));

vi.mock('../../context/ConfirmContext', () => ({
  useConfirm: () => vi.fn().mockResolvedValue(false),
}));

vi.mock('../../api/social/societyApi', () => ({
  fetchSociety: vi.fn(),
  updateSociety: vi.fn(),
  createSocietyTag: vi.fn(),
  updateSocietyTag: vi.fn(),
  deleteSocietyTag: vi.fn(),
  createAnnouncement: vi.fn(),
  updateAnnouncement: vi.fn(),
  deleteAnnouncement: vi.fn(),
  createSocietyEvent: vi.fn(),
  updateSocietyEvent: vi.fn(),
  deleteSocietyEvent: vi.fn(),
  addExceptionDate: vi.fn(),
  publishChanges: vi.fn(),
  joinSociety: vi.fn(),
  leaveSociety: vi.fn(),
  deleteSociety: vi.fn(),
  fetchMembers: vi.fn(),
  updateMemberRole: vi.fn(),
  addCollaborator: vi.fn(),
  requestRatification: vi.fn(),
}));

import * as api from '../../api/social/societyApi';

const baseSociety = () => ({
  id: 5,
  name: 'Chess Club',
  tags: [{ id: 1, label: 'General' }],
  announcements: [{ id: 10, title: 'Welcome', content: 'Hi', event_id: 99, pinned: true }],
  events: [{ id: 99, title: 'Meeting', start_time: '2026-03-09T10:00:00.000Z', end_time: '2026-03-09T11:00:00.000Z' }],
  member_count: 2,
  is_member: true,
  ratification_status: 'draft',
});

const baseAnnouncementPayload = {
  title: 'Ann 1',
  content: 'Body',
  tag: '2',
  pinned: false,
  images: [{ url: 'img-a' }, 'img-b'],
  addAsEvent: true,
  date: '2026-03-11',
  time: '09:00',
  endTime: '10:00',
};

const withLoadedSociety = async () => {
  const { result } = renderHook(() => useSocietyDetail(5));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.society.name).toBe('Chess Club');
  return result;
};

const runTagOperations = async (result) => {
  await act(async () => {
    await result.current.updateSociety({ description: 'new desc' });
    await result.current.addTag({ label: 'Urgent' });
    await result.current.updateTag(1, { label: 'Updated' });
    await result.current.deleteTag(1);
  });
  expect(api.updateSociety).toHaveBeenCalledWith(5, { description: 'new desc' });
  expect(api.createSocietyTag).toHaveBeenCalledWith(5, { label: 'Urgent' });
  expect(api.updateSocietyTag).toHaveBeenCalledWith(5, 1, { label: 'Updated' });
  expect(api.deleteSocietyTag).toHaveBeenCalledWith(5, 1);
};

const runAnnouncementOperations = async (result) => {
  await act(async () => {
    await result.current.addAnnouncement(baseAnnouncementPayload);
  });
  expect(api.createAnnouncement).toHaveBeenCalledWith(5, baseAnnouncementPayload, false);
  expect(api.createSocietyEvent).toHaveBeenCalled();
};

const runEventOperations = async (result) => {
  api.updateAnnouncement.mockResolvedValueOnce({ id: 10, title: 'A', event_id: 99 });
  await act(async () => {
    await result.current.updateAnnouncement(
      10,
      { title: 'A', content: 'B', addAsEvent: false, event_id: 99, tag: 'x' },
      true,
    );
  });
  expect(api.deleteSocietyEvent).toHaveBeenCalledWith(5, 99, true);

  api.updateAnnouncement.mockResolvedValueOnce({ id: 10, title: 'B', event_id: 99 });
  await act(async () => {
    await result.current.updateAnnouncement(
      10,
      {
        title: 'B',
        content: 'C',
        addAsEvent: true,
        event_id: 99,
        tag: '',
        start_time: '2026-03-12T10:00',
        end_time: '2026-03-12T11:00',
      },
      false,
    );
  });
  expect(api.updateSocietyEvent).toHaveBeenCalledWith(5, 99, expect.objectContaining({ tag: null }), true);
};

const runCoreEventOperations = async (result) => {
  await act(async () => {
    await result.current.addEvent({
      title: 'Legacy Event',
      description: 'legacy',
      location: 'Room 1',
      date: '2026-03-13',
      time: '08:00',
      endTime: '09:30',
      allDay: true,
      tag: 'abc',
      recurrence: 'weekly',
    });
    await result.current.addEvent({
      title: 'ISO Event',
      description: 'iso',
      location: 'Room 2',
      start_time: '2026-03-13T10:00',
      end_time: new Date('2026-03-13T11:00:00.000Z'),
      all_day: false,
      tag: '3',
      recurrence: { frequency: 'daily', end_date: '2026-04-01' },
    });
    await result.current.updateEvent(99, { title: 'Updated', date: '2026-03-14', time: '11:00' }, true);
    await result.current.deleteEvent(99, true);
    await result.current.addException(99, '2026-03-20', true);
    await result.current.deleteAnnouncement(10, true);
  });
  expect(api.createSocietyEvent).toHaveBeenCalled();
  expect(api.updateSocietyEvent).toHaveBeenCalled();
  expect(api.deleteSocietyEvent).toHaveBeenCalled();
  expect(api.addExceptionDate).toHaveBeenCalledWith(5, 99, '2026-03-20', true);
  expect(api.deleteAnnouncement).toHaveBeenCalledWith(5, 10, true);
};

const runPublishAndMemberFlow = async (result) => {
  await act(async () => {
    await result.current.publishChanges({ reason: 'update' });
    await result.current.joinSociety();
    await result.current.leaveSociety();
    await result.current.deleteSociety();
  });
  expect(api.publishChanges).toHaveBeenCalledWith(5, { reason: 'update' });
  expect(api.joinSociety).toHaveBeenCalledWith(5);
  expect(api.leaveSociety).toHaveBeenCalledWith(5, 'me');
  expect(api.deleteSociety).toHaveBeenCalledWith(5);
};

const runMembershipFlow = async (result) => {
  await act(async () => {
    await result.current.fetchMembers();
    await result.current.updateMemberRole(1, 'editor');
    await result.current.removeMember(1);
    await result.current.addCollaborator('bob', 'editor');
    await result.current.requestRatification();
  });
  expect(api.fetchMembers).toHaveBeenCalledWith(5);
  expect(api.updateMemberRole).toHaveBeenCalledWith(5, 1, 'editor');
  expect(api.leaveSociety).toHaveBeenCalledWith(5, 1);
  expect(api.addCollaborator).toHaveBeenCalledWith(5, 'bob', 'editor');
  expect(api.requestRatification).toHaveBeenCalledWith(5);
};

describe('useSocietyDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.fetchSociety.mockResolvedValue(baseSociety());
    api.updateSociety.mockResolvedValue({ description: 'updated' });
    api.createSocietyTag.mockResolvedValue({ id: 2, label: 'Urgent' });
    api.updateSocietyTag.mockResolvedValue({ id: 1, label: 'Updated' });
    api.deleteSocietyTag.mockResolvedValue({});
    api.createAnnouncement.mockResolvedValue({ id: 12, title: 'New Announcement', event_id: null });
    api.updateAnnouncement.mockResolvedValue({ id: 10, title: 'Updated Announcement', event_id: 99 });
    api.deleteAnnouncement.mockResolvedValue({});
    api.createSocietyEvent.mockResolvedValue({ id: 200, title: 'Created Event' });
    api.updateSocietyEvent.mockResolvedValue({ id: 99, title: 'Updated Event' });
    api.deleteSocietyEvent.mockResolvedValue({});
    api.addExceptionDate.mockResolvedValue({});
    api.publishChanges.mockResolvedValue({});
    api.joinSociety.mockResolvedValue({});
    api.leaveSociety.mockResolvedValue({});
    api.deleteSociety.mockResolvedValue({});
    api.fetchMembers.mockResolvedValue([{ user: 1, username: 'alice', role: 'member' }]);
    api.updateMemberRole.mockResolvedValue({});
    api.addCollaborator.mockResolvedValue({ user: 2, username: 'bob', role: 'editor' });
    api.requestRatification.mockResolvedValue({});
  });

  it('loads society and supports tag operations', async () => {
    const result = await withLoadedSociety();
    await runTagOperations(result);
  });

  it('supports announcement operations', async () => {
    const result = await withLoadedSociety();
    await runAnnouncementOperations(result);
    await runEventOperations(result);
  });

  it('supports event operations', async () => {
    const result = await withLoadedSociety();
    await runCoreEventOperations(result);
  });

  it('supports publish and delete flows', async () => {
    const result = await withLoadedSociety();
    await runPublishAndMemberFlow(result);
  });

  it('supports member operations', async () => {
    const result = await withLoadedSociety();
    await runMembershipFlow(result);
  });

  it('handles no societyId and load failure', async () => {
    const { result: noIdResult } = renderHook(() => useSocietyDetail(null));
    expect(noIdResult.current.loading).toBe(true);
    expect(api.fetchSociety).not.toHaveBeenCalled();
    api.fetchSociety.mockRejectedValueOnce(new Error('network fail'));
    const { result } = renderHook(() => useSocietyDetail(5));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('network fail');
  });

  it('swallows linked event sync errors without throwing', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    api.createSocietyEvent.mockRejectedValueOnce(new Error('event create failed'));
    api.deleteSocietyEvent.mockRejectedValueOnce(new Error('event delete failed'));
    api.updateSocietyEvent.mockRejectedValueOnce(new Error('event update failed'));

    const { result } = renderHook(() => useSocietyDetail(5));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addAnnouncement({ title: 'A', content: 'B', addAsEvent: true, date: '2026-03-12' });
      api.updateAnnouncement.mockResolvedValueOnce({ id: 10, title: 'A', event_id: 99 });
      await result.current.updateAnnouncement(10, { title: 'A', content: 'B', addAsEvent: false, event_id: 99 });
      api.updateAnnouncement.mockResolvedValueOnce({ id: 10, title: 'A', event_id: null });
      await result.current.updateAnnouncement(10, { title: 'A', content: 'B', addAsEvent: true, event_id: 99 });
    });

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
