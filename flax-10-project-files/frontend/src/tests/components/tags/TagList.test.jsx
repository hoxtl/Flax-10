import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TagList from '../../../components/tags/tag_manager/TagList';

vi.mock('../../../components/common/primary_button/PrimaryButton', () => ({
  default: ({ children, onClick, pill, variant, className, ...rest }) => (
    <button onClick={onClick} className={className} {...rest}>{children}</button>
  ),
}));

vi.mock('lucide-react', () => ({
  Pencil: ({ size }) => <svg data-testid="pencil-icon" />,
  Trash2: ({ size }) => <svg data-testid="trash-icon" />,
}));

<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/components/tags/TagList.test.jsx
vi.mock('../../../components/tags/styles/TagManagerModal.module.css', () => ({
=======
vi.mock('../../../components/tags/TagManagerModal.module.css', () => ({
>>>>>>> main:flax-10-project-files/frontend/src/tests/components/Tags/TagList.test.jsx
  default: {
    content: 'content', list: 'list', item: 'item', preview: 'preview',
    colorDot: 'colorDot', actions: 'actions', delete: 'delete',
    deleteDisabled: 'deleteDisabled', addTagButton: 'addTagButton',
  },
}));

const makeTags = () => [
  { id: 1, label: 'Work', color: '#ff0000', icon: '💼' },
  { id: 2, label: 'other', color: '#00ff00', icon: '⭐' },
];

describe('TagList', () => {
  it('renders all tag labels', () => {
    const modal = { tags: makeTags(), onDelete: vi.fn(), setEditingId: vi.fn(), setIsAdding: vi.fn() };
    render(<TagList modal={modal} />);
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('other')).toBeInTheDocument();
  });

  it('renders Add New Tag button', () => {
    const modal = { tags: makeTags(), onDelete: vi.fn(), setEditingId: vi.fn(), setIsAdding: vi.fn() };
    render(<TagList modal={modal} />);
    expect(screen.getByText('+ Add New Tag')).toBeInTheDocument();
  });

  it('calls setIsAdding(true) when Add New Tag is clicked', () => {
    const setIsAdding = vi.fn();
    const modal = { tags: makeTags(), onDelete: vi.fn(), setEditingId: vi.fn(), setIsAdding };
    render(<TagList modal={modal} />);
    fireEvent.click(screen.getByText('+ Add New Tag'));
    expect(setIsAdding).toHaveBeenCalledWith(true);
  });

  it('calls setEditingId with tag id when edit button is clicked', () => {
    const setEditingId = vi.fn();
    const modal = { tags: makeTags(), onDelete: vi.fn(), setEditingId, setIsAdding: vi.fn() };
    render(<TagList modal={modal} />);
    const editBtns = screen.getAllByRole('button', { name: /edit tag/i });
    fireEvent.click(editBtns[0]);
    expect(setEditingId).toHaveBeenCalledWith(1);
  });

  it('calls onDelete with tag id when delete button is clicked for non-protected tag', () => {
    const onDelete = vi.fn();
    const modal = { tags: makeTags(), onDelete, setEditingId: vi.fn(), setIsAdding: vi.fn() };
    render(<TagList modal={modal} />);
    const deleteBtns = screen.getAllByRole('button', { name: /delete tag/i });
    const enabledDelete = deleteBtns.find(b => !b.disabled);
    fireEvent.click(enabledDelete);
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it('disables delete button for protected tags', () => {
    const modal = { tags: makeTags(), onDelete: vi.fn(), setEditingId: vi.fn(), setIsAdding: vi.fn() };
    render(<TagList modal={modal} />);
    const deleteBtns = screen.getAllByRole('button', { name: /delete tag/i });
    const disabledBtn = deleteBtns.find(b => b.disabled);
    expect(disabledBtn).toBeInTheDocument();
  });

  it('renders color dots with tag colors', () => {
    const modal = { tags: makeTags(), onDelete: vi.fn(), setEditingId: vi.fn(), setIsAdding: vi.fn() };
    const { container } = render(<TagList modal={modal} />);
    const dots = container.querySelectorAll('[class*="colorDot"]');
    expect(dots.length).toBe(2);
  });

  it('renders pencil and trash icons', () => {
    const modal = { tags: [{ id: 1, label: 'Work', color: '#ff0000' }], onDelete: vi.fn(), setEditingId: vi.fn(), setIsAdding: vi.fn() };
    render(<TagList modal={modal} />);
    expect(screen.getByTestId('pencil-icon')).toBeInTheDocument();
    expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
  });
});
