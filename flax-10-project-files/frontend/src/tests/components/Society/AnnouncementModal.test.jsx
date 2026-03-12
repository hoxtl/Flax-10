/**
 * Unit tests for society announcement modal flows.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AnnouncementModal from '../../../components/Society/SocietyDetail/tabs/announcementTab/AnnouncementModal';

const fetchSocietyEventMock = vi.fn();
const confirmMock = vi.fn();
const validateFormMock = vi.fn();
const handleFileSelectMock = vi.fn();
const existingPinnedAnnouncement = { id: 1, title: 'Pinned Existing', pinned: true };

vi.mock('../../../api/societyApi', () => ({
  fetchSocietyEvent: (...args) => fetchSocietyEventMock(...args),
}));

vi.mock('../../../context/ConfirmContext', () => ({
  useConfirm: () => confirmMock,
}));

vi.mock('../../../components/Society/SocietyDetail/tabs/announcementTab/AnnouncementModalHelpers', () => ({
  MAX_IMAGES: 2,
  getInitialForm: (announcement) => ({
    id: announcement?.id,
    title: announcement?.title || '',
    content: announcement?.content || '',
    tag: announcement?.tag || '',
    images: announcement?.images || [],
    pinned: !!announcement?.pinned,
    addAsEvent: false,
    start_time: '',
    end_time: '',
    recurrence: 'none',
    all_day: false,
  }),
  validateForm: (...args) => validateFormMock(...args),
  handleFileSelect: (...args) => handleFileSelectMock(...args),
}));

vi.mock('../../../components/Calendar/EventModal/components/TimeRow', () => ({
  TimeRow: () => <div>time-row</div>,
}));

vi.mock('../../../components/Calendar/EventModal/components/RecurrenceField', () => ({
  RecurrenceField: ({ onChange }) => <button onClick={() => onChange('weekly')}>set-weekly</button>,
}));

vi.mock('../../../components/Calendar/EventModal/components/FormField', () => ({
  FormField: ({ label, value, onChange, type }) =>
    type === 'textarea' ? (
      <textarea aria-label={label} value={value} onChange={onChange} />
    ) : (
      <input aria-label={label} value={value} onChange={onChange} />
    ),
}));

vi.mock('../../../components/Calendar/EventModal/components/TagField', () => ({
  TagField: ({ value, onChange }) => <input aria-label="Tag" value={value} onChange={onChange} />,
}));

vi.mock('../../../components/common/StandardModal/StandardModal', () => ({
  default: ({ title, children, onClose }) => (
    <div>
      <h2>{title}</h2>
      <button onClick={onClose}>close-modal</button>
      {children}
    </div>
  ),
}));

vi.mock('../../../components/common/ConfirmModal', () => ({
  default: ({ title, message, onConfirm, onCancel }) => (
    <div>
      <h3>{title}</h3>
      <p>{message}</p>
      <button onClick={onConfirm}>confirm-delete</button>
      <button onClick={onCancel}>cancel-delete</button>
    </div>
  ),
}));

const renderEditablePinnedModal = (props = {}) =>
  render(
    <AnnouncementModal
      onClose={vi.fn()}
      onSubmit={vi.fn()}
      announcement={{ id: 2, title: 'Editing', content: '', pinned: true }}
      announcements={[existingPinnedAnnouncement, { id: 2, title: 'Editing', pinned: false }]}
      {...props}
    />,
  );

describe('AnnouncementModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateFormMock.mockReturnValue('');
    confirmMock.mockResolvedValue(true);
    handleFileSelectMock.mockImplementation((file, onAdd) => onAdd(`preview:${file.name}`));
    fetchSocietyEventMock.mockResolvedValue({
      start_time: '2026-03-09T10:00:00Z',
      end_time: '2026-03-09T11:00:00Z',
      recurrence: 'none',
      all_day: false,
    });
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

  it('loads linked event on edit and handles delete flow with linked-event message', async () => {
    const onDelete = vi.fn();
    const onClose = vi.fn();
    render(
      <AnnouncementModal
        onClose={onClose}
        onSubmit={vi.fn()}
        onDelete={onDelete}
        announcement={{ id: 9, title: 'Old', content: 'Body', event_id: 77, pinned: false }}
        societyId={3}
        announcements={[]}
      />,
    );
    expect(await screen.findByText('Edit Announcement')).toBeTruthy();
    await waitFor(() => expect(fetchSocietyEventMock).toHaveBeenCalledWith(3, 77));
    fireEvent.click(screen.getByText('Delete'));
    expect(await screen.findByText('Delete Announcement')).toBeTruthy();
    expect(screen.getByText(/linked event/)).toBeTruthy();
    fireEvent.click(screen.getByText('confirm-delete'));
    expect(onDelete).toHaveBeenCalledWith(9);
    expect(onClose).toHaveBeenCalled();
  });

  it('asks for confirmation and aborts when pinned conflict is denied', async () => {
    const onSubmit = vi.fn();
    confirmMock.mockResolvedValueOnce(false);
    renderEditablePinnedModal({ onSubmit });
    fireEvent.click(screen.getByText('Save Changes'));
    await waitFor(() => expect(confirmMock).toHaveBeenCalled());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('confirms pinned save when conflict is accepted', async () => {
    const onSubmit = vi.fn();
    confirmMock.mockResolvedValueOnce(true);
    renderEditablePinnedModal({ onSubmit });
    fireEvent.click(screen.getByText('Save Changes'));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ id: 2, pinned: true }),
        expect.objectContaining({ id: 1 }),
      ),
    );
  });

  it('supports image add/remove and linked event load failure path', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchSocietyEventMock.mockRejectedValueOnce(new Error('load failed'));
    render(
      <AnnouncementModal
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        announcement={{ id: 10, title: 'Edit', content: 'x', event_id: 12, images: ['a.jpg'] }}
        societyId={6}
        announcements={[]}
      />,
    );
    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [new File(['x'], 'pic.png', { type: 'image/png' })] } });
    expect(handleFileSelectMock).toHaveBeenCalled();
    expect(await screen.findAllByAltText('Preview')).toHaveLength(2);
    fireEvent.click(screen.getAllByRole('button', { name: '×' })[0]);
    await waitFor(() => expect(screen.getAllByAltText('Preview')).toHaveLength(1));
    await waitFor(() => expect(errorSpy).toHaveBeenCalled());
    errorSpy.mockRestore();
  });

  it('delete without linked event shows simple message and calls onDelete and onClose', () => {
    const onDelete = vi.fn();
    const onClose = vi.fn();
    render(
      <AnnouncementModal
        onClose={onClose}
        onSubmit={vi.fn()}
        onDelete={onDelete}
        announcement={{ id: 5, title: 'No Event', content: 'Body', pinned: false }}
        societyId={1}
        announcements={[]}
      />,
    );
    fireEvent.click(screen.getByText('Delete'));
    expect(screen.getByText('Delete Announcement')).toBeTruthy();
    expect(screen.getByText(/Are you sure you want to delete this announcement/)).toBeTruthy();
    expect(screen.queryByText(/linked event/)).toBeFalsy();
    fireEvent.click(screen.getByText('confirm-delete'));
    expect(onDelete).toHaveBeenCalledWith(5);
    expect(onClose).toHaveBeenCalled();
  });

  it('submit with no pinned conflict calls onSubmit with form only', () => {
    const onSubmit = vi.fn();
    render(
      <AnnouncementModal
        onClose={vi.fn()}
        onSubmit={onSubmit}
        announcement={{ id: 3, title: 'New Pin', content: '', pinned: true }}
        announcements={[]}
      />,
    );
    fireEvent.click(screen.getByText('Save Changes'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ id: 3, pinned: true }));
  });
});
