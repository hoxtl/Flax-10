import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PreferencesPanel from '../../../components/Settings/PreferencesPanel';

vi.mock('../../../context/ThemeContext', () => ({
    useTheme: vi.fn(() => ({ theme: 'light', setTheme: vi.fn() })),
}));

import { useTheme } from '../../../context/ThemeContext';

describe('PreferencesPanel', () => {
    const onStudyTimeSave = vi.fn().mockResolvedValue(true);

    it('renders Appearance section title', () => {
        render(<PreferencesPanel onSave={vi.fn()} isSaving={false} />);
        expect(screen.getByText('Appearance')).toBeTruthy();
    });

    it('renders Theme label', () => {
        render(<PreferencesPanel onSave={vi.fn()} isSaving={false} />);
        expect(screen.getByText('Theme')).toBeTruthy();
    });

    it('renders Light and Dark theme buttons', () => {
        render(<PreferencesPanel onSave={vi.fn()} isSaving={false} />);
        expect(screen.getByText('Light')).toBeTruthy();
        expect(screen.getByText('Dark')).toBeTruthy();
    });

    it('renders Save Preferences button', () => {
        render(<PreferencesPanel onSave={vi.fn()} isSaving={false} />);
        expect(screen.getByRole('button', { name: 'Save Preferences' })).toBeTruthy();
    });

    it('shows Saving... when isSaving', () => {
        render(<PreferencesPanel onSave={vi.fn()} isSaving={true} />);
        expect(screen.getByText('Saving...')).toBeTruthy();
    });

    it('calls setTheme when Dark is clicked', () => {
        const setTheme = vi.fn();
        useTheme.mockReturnValueOnce({ theme: 'light', setTheme });
        render(<PreferencesPanel onSave={vi.fn()} isSaving={false} />);
        fireEvent.click(screen.getByText('Dark').closest('button'));
        expect(setTheme).toHaveBeenCalledWith('dark');
    });

    it('calls onSave with form data on submit', () => {
        const onSave = vi.fn();
        useTheme.mockReturnValueOnce({ theme: 'dark', setTheme: vi.fn() });
        const { container } = render(<PreferencesPanel onSave={onSave} isSaving={false} />);
        fireEvent.submit(container.querySelector('form'));
        expect(onSave).toHaveBeenCalledWith({ theme: 'dark' });
    });

    it('submits study-time preference', async () => {
        render(<PreferencesPanel onSave={vi.fn()} onSleepSave={onSleepSave} onStudyTimeSave={onStudyTimeSave} isSaving={false} />);
        const input = await screen.findByLabelText('Preferred study time per day (minutes)');
        fireEvent.change(input, { target: { value: '180' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save Study Time' }));
        expect(onStudyTimeSave).toHaveBeenCalledWith({ preferred_study_minutes_per_day: 180 });
    });
});
