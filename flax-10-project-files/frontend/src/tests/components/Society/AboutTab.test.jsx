import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AboutTab from '../../../components/Society/SocietyDetail/tabs/AboutTab';

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
});
