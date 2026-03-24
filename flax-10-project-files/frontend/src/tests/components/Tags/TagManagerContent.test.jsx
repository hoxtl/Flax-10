import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TagManagerContent from '../../../components/Tags/tagManager/TagManagerContent';

vi.mock('../../../components/common/PrimaryButton/PrimaryButton', () => ({
  default: ({ children, onClick, ...props }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

vi.mock('lucide-react', () => ({
  Pencil: () => <svg data-testid="pencil-icon" />,
  Trash2: () => <svg data-testid="trash-icon" />,
}));

vi.mock('../../../components/Tags/TagManagerModal.module.css', () => ({
  default: {
    content: 'content', list: 'list', item: 'item', preview: 'preview',
    colorDot: 'colorDot', actions: 'actions', delete: 'delete',
    deleteDisabled: 'deleteDisabled', addTagButton: 'addTagButton',
    form: 'form', error: 'error', colorRow: 'colorRow',
    formActions: 'formActions', formActionBtn: 'formActionBtn',
  },
}));

const tags = [
  { id: 1, label: 'Work', color: '#ff0000' },
  { id: 2, label: 'other', color: '#00ff00' },
];

describe('TagManagerContent', () => {
  it('shows TagList when not editing and not adding', () => {
    const modal = {
      tags,
      editingId: null,
      isAdding: false,
      onDelete: vi.fn(),
      setEditingId: vi.fn(),
      setIsAdding: vi.fn(),
      resetState: vi.fn(),
      onSave: vi.fn(),
    };
    render(<TagManagerContent modal={modal} />);
    expect(screen.getByText('+ Add New Tag')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
  });

  it('shows TagForm when isAdding is true', () => {
    const modal = {
      tags,
      editingId: null,
      isAdding: true,
      onDelete: vi.fn(),
      setEditingId: vi.fn(),
      setIsAdding: vi.fn(),
      resetState: vi.fn(),
      onSave: vi.fn(),
    };
    render(<TagManagerContent modal={modal} />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('shows TagForm with existing tag data when editingId is set', () => {
    const modal = {
      tags,
      editingId: 1,
      isAdding: false,
      onDelete: vi.fn(),
      setEditingId: vi.fn(),
      setIsAdding: vi.fn(),
      resetState: vi.fn(),
      onSave: vi.fn(),
    };
    render(<TagManagerContent modal={modal} />);
    expect(screen.getByDisplayValue('Work')).toBeInTheDocument();
  });

  it('uses DEFAULT_TAG_FORM when editingId matches no tag', () => {
    const modal = {
      tags,
      editingId: 999,
      isAdding: false,
      onDelete: vi.fn(),
      setEditingId: vi.fn(),
      setIsAdding: vi.fn(),
      resetState: vi.fn(),
      onSave: vi.fn(),
    };
    render(<TagManagerContent modal={modal} />);
    // DEFAULT_TAG_FORM has empty label
    expect(screen.getByPlaceholderText('e.g. Gym')).toBeInTheDocument();
  });

  it('marks form as protected for protected tag label', () => {
    const modal = {
      tags,
      editingId: 2,
      isAdding: false,
      onDelete: vi.fn(),
      setEditingId: vi.fn(),
      setIsAdding: vi.fn(),
      resetState: vi.fn(),
      onSave: vi.fn(),
    };
    render(<TagManagerContent modal={modal} />);
    // 'other' is a protected tag — name input should be disabled
    expect(screen.getByDisplayValue('other')).toBeDisabled();
  });

  it('calls resetState when Cancel is clicked in form', () => {
    const resetState = vi.fn();
    const modal = {
      tags,
      editingId: null,
      isAdding: true,
      onDelete: vi.fn(),
      setEditingId: vi.fn(),
      setIsAdding: vi.fn(),
      resetState,
      onSave: vi.fn(),
    };
    render(<TagManagerContent modal={modal} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(resetState).toHaveBeenCalledTimes(1);
  });
});
