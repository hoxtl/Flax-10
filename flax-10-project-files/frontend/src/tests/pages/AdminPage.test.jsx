import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminPage from '../../pages/AdminPage';

describe('AdminPage', () => {
    it('renders admin dashboard heading', () => {
        render(<AdminPage />);
        expect(screen.getByText('Admin', { selector: 'h1' })).toBeTruthy();
    });

    it('shows superuser visibility note', () => {
        render(<AdminPage />);
        expect(screen.getByText(/only visible to admin accounts/)).toBeTruthy();
    });
});
