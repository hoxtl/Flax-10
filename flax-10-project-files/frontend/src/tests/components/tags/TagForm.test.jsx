import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TagForm from '../../../components/tags/tag_manager/TagForm';

vi.mock('../../../components/common/primary_button/PrimaryButton', () => ({
  default: ({ children, onClick, type, variant, ...rest }) => (
    <button type={type} onClick={onClick} data-variant={variant} {...rest}>{children}</button>
  ),
}));

<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/components/tags/TagForm.test.jsx
vi.mock('../../../components/tags/styles/TagManagerModal.module.css', () => ({
=======
vi.mock('../../../components/tags/TagManagerModal.module.css', () => ({
>>>>>>> main:flax-10-project-files/frontend/src/tests/components/Tags/TagForm.test.jsx
  default: {
    content: 'content', form: 'form', error: 'error', colorRow: 'colorRow',
    formActions: 'formActions', formActionBtn: 'formActionBtn',
  },
}));

const defaultInitialData = { label: 'Work', color: '#ff0000' };

describe('TagForm', () => {
  it('renders name and color fields with initial data', () => {
    render(<TagForm initialData={defaultInitialData} onCancel={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByDisplayValue('Work')).toBeInTheDocument();
    expect(screen.getByDisplayValue('#ff0000')).toBeInTheDocument();
  });

  it('renders Save and Cancel buttons', () => {
    render(<TagForm initialData={defaultInitialData} onCancel={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn();
    render(<TagForm initialData={defaultInitialData} onCancel={onCancel} onSave={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onSave with updated form data when valid', () => {
    const onSave = vi.fn();
    render(<TagForm initialData={defaultInitialData} onCancel={vi.fn()} onSave={onSave} />);
    fireEvent.change(screen.getByDisplayValue('Work'), { target: { value: 'Personal' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ label: 'Personal' }));
  });

  it('shows validation error when name is empty and not protected', () => {
    render(<TagForm initialData={{ label: '', color: '#000' }} onCancel={vi.fn()} onSave={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Name is required.')).toBeInTheDocument();
  });

  it('clears error when name is changed to non-empty value', () => {
    render(<TagForm initialData={{ label: '', color: '#000' }} onCancel={vi.fn()} onSave={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Name is required.')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('e.g. Gym'), { target: { value: 'New Name' } });
    expect(screen.queryByText('Name is required.')).not.toBeInTheDocument();
  });

  it('does not show error when isProtected is true and label is empty', () => {
    const onSave = vi.fn();
    render(<TagForm initialData={{ label: '', color: '#000' }} isProtected onCancel={vi.fn()} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.queryByText('Name is required.')).not.toBeInTheDocument();
    expect(onSave).toHaveBeenCalled();
  });

  it('disables name input when isProtected is true', () => {
    render(<TagForm initialData={defaultInitialData} isProtected onCancel={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByDisplayValue('Work')).toBeDisabled();
  });

  it('enables name input when isProtected is false (default)', () => {
    render(<TagForm initialData={defaultInitialData} onCancel={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByDisplayValue('Work')).not.toBeDisabled();
  });

  it('updates color field when changed', () => {
    const onSave = vi.fn();
    render(<TagForm initialData={defaultInitialData} onCancel={vi.fn()} onSave={onSave} />);
    const colorInput = screen.getByDisplayValue('#ff0000');
    fireEvent.change(colorInput, { target: { value: '#00ff00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ color: '#00ff00' }));
  });

  it('shows color value text next to color picker', () => {
    render(<TagForm initialData={defaultInitialData} onCancel={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByText('#ff0000')).toBeInTheDocument();
  });

  it('keeps the validation error when a field change does not actually change the value', () => {
    render(<TagForm initialData={{ label: '', color: '#000000' }} onCancel={vi.fn()} onSave={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Name is required.')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('e.g. Gym'), { target: { value: '' } });
    expect(screen.getByText('Name is required.')).toBeInTheDocument();
  });

  it('keeps the validation error when the new non-empty value matches the existing field value', () => {
    render(<TagForm initialData={{ label: 'Work', color: '#000000' }} onCancel={vi.fn()} onSave={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. Gym'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Name is required.')).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue('#000000'), { target: { value: '#000000' } });
    expect(screen.getByText('Name is required.')).toBeInTheDocument();
  });
});
