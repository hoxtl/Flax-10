import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AboutTab from '../../../components/Society/society_detail/tabs/AboutTab';

describe('AboutTab display', () => {
    it('shows "No about information yet" when empty', () => {
        render(<AboutTab about={null} adminEmails={null} editMode={false} />);
        expect(screen.getByText('No about information yet.')).toBeTruthy();
    });

    it('renders about text', () => {
        render(<AboutTab about="We love chess" adminEmails={null} editMode={false} />);
        expect(screen.getByText('We love chess')).toBeTruthy();
    });

    it('renders admin email as a link', () => {
        render(<AboutTab about={null} adminEmails="admin@kcl.ac.uk" editMode={false} />);
        const link = screen.getByText('admin@kcl.ac.uk');
        expect(link.href).toContain('mailto:admin@kcl.ac.uk');
    });

    it('renders multiple admin emails', () => {
        render(<AboutTab about={null} adminEmails="a@kcl.ac.uk, b@kcl.ac.uk" editMode={false} />);
        expect(screen.getByText(/a@kcl.ac.uk/)).toBeTruthy();
        expect(screen.getByText(/b@kcl.ac.uk/)).toBeTruthy();
    });
});

describe('AboutTab edit mode', () => {
    it('renders editor in editMode', () => {
        render(<AboutTab about="Old text" adminEmails="admin@kcl.ac.uk" editMode={true} onUpdate={vi.fn()} />);
        expect(screen.getByText('Save Changes')).toBeTruthy();
    });

    it('calls onUpdate with new about text', async () => {
        const onUpdate = vi.fn();
        render(<AboutTab about="Old text" adminEmails="admin@kcl.ac.uk" editMode={true} onUpdate={onUpdate} />);
        const textarea = document.querySelector('textarea');
        fireEvent.change(textarea, { target: { value: 'New text' } });
        const saveBtn = screen.getByText('Save Changes');
        expect(saveBtn.disabled).toBe(false);
        fireEvent.click(saveBtn);
        await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    });

    it('shows validation errors for missing and invalid email input', () => {
        const { rerender } = render(<AboutTab about="Old text" adminEmails="" editMode={true} onUpdate={vi.fn()} />);
        expect(screen.getByText('Email is compulsory')).toBeTruthy();
        expect(screen.getByText('Save Changes')).toBeDisabled();

        rerender(<AboutTab about="Old text" adminEmails="admin@kcl.ac.uk" editMode={true} onUpdate={vi.fn()} />);
        fireEvent.change(screen.getByPlaceholderText('e.g. admin@flax.com, info@flax.com'), { target: { value: 'bad-email' } });
        expect(screen.getByText('Invalid email(s)')).toBeTruthy();
        expect(screen.getByText('Save Changes')).toBeDisabled();
    });

    it('cancels by sending an empty update object', () => {
        const onUpdate = vi.fn();
        render(<AboutTab about="Old text" adminEmails="admin@kcl.ac.uk" editMode={true} onUpdate={onUpdate} />);
        fireEvent.click(screen.getByText('Cancel'));
        expect(onUpdate).toHaveBeenCalledWith({});
    });

    it('starts from empty values when about and emails are null', async () => {
        const onUpdate = vi.fn();
        render(<AboutTab about={null} adminEmails={null} editMode={true} onUpdate={onUpdate} />);
        fireEvent.change(screen.getByPlaceholderText('e.g. admin@flax.com, info@flax.com'), { target: { value: 'admin@kcl.ac.uk' } });
        fireEvent.change(document.querySelector('textarea'), { target: { value: 'Fresh copy' } });
        fireEvent.click(screen.getByText('Save Changes'));
        await waitFor(() => expect(onUpdate).toHaveBeenCalledWith({ about: 'Fresh copy', admin_emails: 'admin@kcl.ac.uk' }));
    });
});
