import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../../context/ThemeContext', () => ({
    useTheme: vi.fn(() => ({
        mode: 'light',
        setMode: vi.fn(),
    })),
}));

<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/components/dashboard/ThemeToggle.test.jsx
import ThemeToggle from '../../../components/dashboard/components/ThemeToggle';
=======
import ThemeToggle from '../../../components/dashboard/ThemeToggle';
>>>>>>> main:flax-10-project-files/frontend/src/tests/components/Dashboard/ThemeToggle.test.jsx
import { useTheme } from '../../../context/ThemeContext';

describe('ThemeToggle', () => {
    it('renders toggle button', () => {
        render(<ThemeToggle />);
        expect(screen.getByRole('button', { name: /toggle theme/i })).toBeTruthy();
    });

    it('shows sun icon in light mode', () => {
        useTheme.mockReturnValue({ mode: 'light', setMode: vi.fn() });
        render(<ThemeToggle />);
        expect(screen.getByText('☀️')).toBeTruthy();
    });

    it('shows moon icon in dark mode', () => {
        useTheme.mockReturnValue({ mode: 'dark', setMode: vi.fn() });
        render(<ThemeToggle />);
        expect(screen.getByText('🌙')).toBeTruthy();
    });

    it('calls setMode when clicked', () => {
        const setMode = vi.fn();
        useTheme.mockReturnValue({ mode: 'light', setMode });
        render(<ThemeToggle />);
        fireEvent.click(screen.getByRole('button', { name: /toggle theme/i }));
        expect(setMode).toHaveBeenCalledWith('dark');
    });

    it('has correct title in light mode', () => {
        useTheme.mockReturnValue({ mode: 'light', setMode: vi.fn() });
        render(<ThemeToggle />);
        fireEvent.mouseEnter(screen.getByRole('button', { name: /toggle theme/i }));
        expect(screen.getByRole('tooltip')).toHaveTextContent('Switch to dark mode');
    });

    it('has correct title in dark mode', () => {
        useTheme.mockReturnValue({ mode: 'dark', setMode: vi.fn() });
        render(<ThemeToggle />);
        fireEvent.mouseEnter(screen.getByRole('button', { name: /toggle theme/i }));
        expect(screen.getByRole('tooltip')).toHaveTextContent('Switch to light mode');
    });
});
