/**
 * Unit tests for society announcement modal flows.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AnnouncementModal from '../../../../components/society/society_detail/tabs/announcement_tab/AnnouncementModal';
import styles from '../../../../components/society/society_detail/tabs/announcement_tab/AnnouncementModal.module.css';

const fetchSocietyEventMock = vi.fn();
const confirmMock = vi.fn();
const validateFormMock = vi.fn();
const handleFileSelectMock = vi.fn();
const existingPinnedAnnouncement = { id: 1, title: 'Pinned Existing', pinned: true };

vi.mock('../../../../api/societyApi', () => ({ fetchSocietyEvent: (...args) => fetchSocietyEventMock(...args) }));
vi.mock('../../../../context/ConfirmContext', () => ({ useConfirm: () => confirmMock }));

vi.mock('../../../../components/society/society_detail/tabs/announcement_tab/announcementModalHelpers', () => ({
  MAX_IMAGES: 1,
  getInitialForm: (a) => ({
    id: a?.id, title: a?.title || '', content: a?.content || '', tag: a?.tag || '', images: a?.images || [],
    pinned: !!a?.pinned, addAsEvent: false, start_time: '', end_time: '', recurrence: 'none', all_day: false,
  }),
  validateForm: (...args) => validateFormMock(...args),
  handleFileSelect: (...args) => handleFileSelectMock(...args),
}));

vi.mock('../../../../components/calendar/event_modal/components/TimeRow', () => ({
  TimeRow: ({ update }) => (
    <div>
      <div>time-row</div>
      <button type="button" onClick={() => update('start_time')({ target: { value: '2026-03-09T10:00' } })}>set-start-time</button>
      <button type="button" onClick={() => update('end_time')({ target: { value: '2026-03-09T11:00' } })}>set-end-time</button>
    </div>
  ),
}));
vi.mock('../../../../components/calendar/event_modal/components/RecurrenceField', () => ({
  RecurrenceField: ({ onChange }) => <button onClick={() => onChange('weekly')}>set-weekly</button>,
}));
vi.mock('../../../../components/calendar/event_modal/components/FormField', () => ({
  FormField: ({ label, value, onChange, type }) => type === 'textarea'
    ? <textarea aria-label={label} value={value} onChange={onChange} />
    : <input aria-label={label} value={value} onChange={onChange} />,
}));
vi.mock('../../../../components/calendar/event_modal/components/TagField', () => ({
  TagField: ({ value, onChange }) => <input aria-label="Tag" value={value} onChange={onChange} />,
}));
vi.mock('../../../../components/common/standard_modal/StandardModal', () => ({
  default: ({ title, children, onClose }) => <div><h2>{title}</h2><button onClick={onClose}>close-modal</button>{children}</div>,
}));
vi.mock('../../../../components/common/confirm_modal/ConfirmModal', () => ({
  default: ({ title, message, onConfirm, onCancel }) => (
    <div><h3>{title}</h3><p>{message}</p><button onClick={onConfirm}>confirm-delete</button><button onClick={() => onCancel?.()}>cancel-delete</button></div>
  ),
}));

const renderEditablePinnedModal = (props = {}) => render(
  <AnnouncementModal onClose={vi.fn()} onSubmit={vi.fn()}
    announcement={{ id: 2, title: 'Editing', content: '', pinned: true }}
    announcements={[existingPinnedAnnouncement, { id: 2, title: 'Editing', pinned: false }]} {...props} />
);

describe('AnnouncementModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateFormMock.mockReturnValue('');
    confirmMock.mockResolvedValue(true);
    handleFileSelectMock.mockImplementation((file, onAdd) => onAdd(`preview:${file.name}`));
    fetchSocietyEventMock.mockResolvedValue({ start_time: '2026-03-09T10:00:00Z', end_time: '2026-03-09T11:00:00Z', recurrence: 'none', all_day: false });
  });

  it('shows add mode and validation error', () => {
    validateFormMock.mockReturnValue('Title required');
    const onSubmit = vi.fn();
    render(<AnnouncementModal onClose={vi.fn()} onSubmit={onSubmit} tags={[]} announcements={[]} />);
    expect(screen.getByRole('heading', { name: 'Add Announcement' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Add Announcement' }));
    expect(screen.getByText('Title required')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('renders safely with default optional props', () => {
    render(<AnnouncementModal onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Add Announcement' })).toBeInTheDocument();
  });

  it('triggers file input when clicking add image button', () => {
    const { container } = render(<AnnouncementModal onClose={vi.fn()} onSubmit={vi.fn()} announcements={[]} />);
    const input = container.querySelector('input[type="file"]');
    const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {});
    fireEvent.click(container.querySelector(`.${styles.addImageBtn}`));
    expect(clickSpy).toHaveBeenCalled();
  });

  it('loads linked event and handles delete with linked-event message', async () => {
    const onDelete = vi.fn(), onClose = vi.fn();
    render(<AnnouncementModal onClose={onClose} onSubmit={vi.fn()} onDelete={onDelete}
      announcement={{ id: 9, title: 'Old', content: 'Body', event_id: 77, pinned: false }} societyId={3} announcements={[]} />);
    expect(await screen.findByText('Edit Announcement')).toBeTruthy();
    await waitFor(() => expect(fetchSocietyEventMock).toHaveBeenCalledWith(3, 77));
    fireEvent.click(screen.getByText('Delete'));
    expect(await screen.findByText('Delete Announcement')).toBeTruthy();
    expect(screen.getByText(/linked event/)).toBeTruthy();
    fireEvent.click(screen.getByText('confirm-delete'));
    expect(onDelete).toHaveBeenCalledWith(9);
  });

  it('aborts when pinned conflict is denied', async () => {
    const onSubmit = vi.fn();
    confirmMock.mockResolvedValueOnce(false);
    renderEditablePinnedModal({ onSubmit });
    fireEvent.click(screen.getByText('Save Changes'));
    await waitFor(() => expect(confirmMock).toHaveBeenCalled());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('confirms pinned save when conflict accepted', async () => {
    const onSubmit = vi.fn();
    renderEditablePinnedModal({ onSubmit });
    fireEvent.click(screen.getByText('Save Changes'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ id: 2, pinned: true }), expect.objectContaining({ id: 1 })));
  });

  it('handles image add/remove and load failure', async () => {
    fetchSocietyEventMock.mockRejectedValueOnce(new Error('load failed'));
    render(<AnnouncementModal onClose={vi.fn()} onSubmit={vi.fn()}
      announcement={{ id: 10, title: 'Edit', content: 'x', event_id: 12, images: ['a.jpg'] }} societyId={6} announcements={[]} />);
    fireEvent.change(document.querySelector('input[type="file"]'), { target: { files: [new File(['x'], 'pic.png', { type: 'image/png' })] } });
    expect(await screen.findAllByAltText('Preview')).toHaveLength(1);
    fireEvent.click(screen.getAllByRole('button', { name: '×' })[0]);
    await waitFor(() => expect(screen.queryByAltText('Preview')).toBeFalsy());
  });

  it('delete without linked event shows simple message', () => {
    const onDelete = vi.fn(), onClose = vi.fn();
    render(<AnnouncementModal onClose={onClose} onSubmit={vi.fn()} onDelete={onDelete}
      announcement={{ id: 5, title: 'No Event', content: 'Body', pinned: false }} societyId={1} announcements={[]} />);
    fireEvent.click(screen.getByText('Delete'));
    expect(screen.getByText(/Are you sure you want to delete this announcement/)).toBeTruthy();
    expect(screen.queryByText(/linked event/)).toBeFalsy();
    fireEvent.click(screen.getByText('confirm-delete'));
    expect(onDelete).toHaveBeenCalledWith(5);
  });

  it('closes the delete confirm modal without deleting when cancellation is chosen', async () => {
    const onDelete = vi.fn();
    render(<AnnouncementModal onClose={vi.fn()} onSubmit={vi.fn()} onDelete={onDelete}
      announcement={{ id: 6, title: 'Cancelable', content: 'Body', pinned: false }} societyId={1} announcements={[]} />);

    fireEvent.click(screen.getByText('Delete'));
    expect(screen.getByText('Delete Announcement')).toBeTruthy();

    fireEvent.click(screen.getByText('cancel-delete'));
    await waitFor(() => expect(screen.queryByText('Delete Announcement')).not.toBeInTheDocument());
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('submit with no pinned conflict calls onSubmit', () => {
    const onSubmit = vi.fn();
    render(<AnnouncementModal onClose={vi.fn()} onSubmit={onSubmit} announcement={{ id: 3, title: 'New Pin', content: '', pinned: true }} announcements={[]} />);
    fireEvent.click(screen.getByText('Save Changes'));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ id: 3, pinned: true }));
  });

  it('handles form field changes', () => {
    const onSubmit = vi.fn();
    render(<AnnouncementModal onClose={vi.fn()} onSubmit={onSubmit} tags={[{ label: 'A', id: 1 }]} announcements={[]} />);
    fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'New Title' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'New Desc' } });
    fireEvent.change(screen.getByLabelText('Tag'), { target: { value: 'New Tag' } });
    fireEvent.click(screen.getByLabelText('Pin this announcement'));
    fireEvent.click(screen.getByRole('button', { name: 'Add Announcement' }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: 'New Title', content: 'New Desc', pinned: true }));
  });

  it('handles event toggle and recurrence', () => {
    const onSubmit = vi.fn();
    render(<AnnouncementModal onClose={vi.fn()} onSubmit={onSubmit} tags={[]} announcements={[]} />);
    fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'T' } });
    fireEvent.click(screen.getByLabelText('Also add as event'));
    expect(screen.getByText('time-row')).toBeTruthy();
    fireEvent.click(screen.getByText('set-start-time'));
    fireEvent.click(screen.getByText('set-end-time'));
    fireEvent.click(screen.getByText('set-weekly'));
    fireEvent.click(screen.getByRole('button', { name: 'Add Announcement' }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      addAsEvent: true,
      recurrence: 'weekly',
      start_time: '2026-03-09T10:00',
      end_time: '2026-03-09T11:00',
    }));
  });
});
