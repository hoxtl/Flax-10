import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../../context/ThemeContext', () => ({
    useTheme: vi.fn(() => ({ theme: 'light', toggleTheme: vi.fn() })),
}));

import ThemeToggle from '../../../components/Dashboard/ThemeToggle';
import { useTheme } from '../../../context/ThemeContext';

describe('ThemeToggle', () => {
    it('renders toggle button', () => {
        render(<ThemeToggle />);
        expect(screen.getByRole('button', { name: /toggle theme/i })).toBeTruthy();
    });

    it('shows sun icon in light mode', () => {
        useTheme.mockReturnValue({ theme: 'light', toggleTheme: vi.fn() });
        render(<ThemeToggle />);
        expect(screen.getByText('☀️')).toBeTruthy();
    });

    it('shows moon icon in dark mode', () => {
        useTheme.mockReturnValue({ theme: 'dark', toggleTheme: vi.fn() });
        render(<ThemeToggle />);
        expect(screen.getByText('🌙')).toBeTruthy();
    });

    it('calls toggleTheme when clicked', () => {
        const toggleTheme = vi.fn();
        useTheme.mockReturnValue({ theme: 'light', toggleTheme });
        render(<ThemeToggle />);
        fireEvent.click(screen.getByRole('button'));
        expect(toggleTheme).toHaveBeenCalledOnce();
    });

    it('has correct title in light mode', () => {
        useTheme.mockReturnValue({ theme: 'light', toggleTheme: vi.fn() });
        render(<ThemeToggle />);
        expect(screen.getByTitle('Switch to dark mode')).toBeTruthy();
    });

    it('has correct title in dark mode', () => {
        useTheme.mockReturnValue({ theme: 'dark', toggleTheme: vi.fn() });
        render(<ThemeToggle />);
        expect(screen.getByTitle('Switch to light mode')).toBeTruthy();
    });
});
