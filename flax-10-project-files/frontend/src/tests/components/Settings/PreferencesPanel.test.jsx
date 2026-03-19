import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import PreferencesPanel from '../../../components/Settings/PreferencesPanel';

vi.mock('../../../context/ThemeContext', () => ({
    useTheme: vi.fn(() => ({
        mode: 'light',
        setMode: vi.fn(),
        theme: 'flax',
        setTheme: vi.fn(),
    })),
}));

vi.mock('../../../api/userService', () => ({
    getUserSettings: vi.fn().mockResolvedValue({
        sleep_time: '23:00:00',
        wake_time: '07:00:00',
    }),
}));

import { useTheme } from '../../../context/ThemeContext';

describe('PreferencesPanel', () => {
    it('renders Appearance section title', async () => {
        useTheme.mockReturnValue({
            mode: 'light',
            setMode: vi.fn(),
            theme: 'flax',
            setTheme: vi.fn(),
        });
        render(<PreferencesPanel onSave={vi.fn()} isSaving={false} />);
        await screen.findByText('Appearance');
    });

    it('renders Interface Mode label', async () => {
        useTheme.mockReturnValue({
            mode: 'light',
            setMode: vi.fn(),
            theme: 'flax',
            setTheme: vi.fn(),
        });
        render(<PreferencesPanel onSave={vi.fn()} isSaving={false} />);
        await screen.findByText('Interface Mode');
    });

    it('renders Light and Dark theme buttons', async () => {
        useTheme.mockReturnValue({
            mode: 'light',
            setMode: vi.fn(),
            theme: 'flax',
            setTheme: vi.fn(),
        });
        render(<PreferencesPanel onSave={vi.fn()} isSaving={false} />);
        await screen.findByText('Interface Mode');
        const interfaceModeGroup = screen.getByText('Interface Mode').closest('div');
        expect(within(interfaceModeGroup).getByText('Light')).toBeTruthy();
        expect(within(interfaceModeGroup).getByText('Dark')).toBeTruthy();
    });

    it('renders Save Appearance button', async () => {
        useTheme.mockReturnValue({
            mode: 'light',
            setMode: vi.fn(),
            theme: 'flax',
            setTheme: vi.fn(),
        });
        render(<PreferencesPanel onSave={vi.fn()} isSaving={false} />);
        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Save Appearance' })).toBeTruthy();
        });
    });

    it('shows Saving... when isSaving', async () => {
        useTheme.mockReturnValue({
            mode: 'light',
            setMode: vi.fn(),
            theme: 'flax',
            setTheme: vi.fn(),
        });
        render(<PreferencesPanel onSave={vi.fn()} isSaving={true} />);
        await screen.findByText('Saving...');
    });

    it('calls setMode when Dark is clicked', async () => {
        const setMode = vi.fn();
        const setTheme = vi.fn();
        useTheme.mockReturnValue({
            mode: 'light',
            setMode,
            theme: 'flax',
            setTheme,
        });
        render(<PreferencesPanel onSave={vi.fn()} isSaving={false} />);
        await screen.findByText('Appearance');
        const interfaceModeGroup = screen.getByText('Interface Mode').closest('div');
        const darkButton = within(interfaceModeGroup).getByText('Dark').closest('button');
        fireEvent.click(darkButton);
        expect(setMode).toHaveBeenCalledWith('dark');
    });

    it('calls onSave with form data on submit', async () => {
        const setMode = vi.fn();
        const setTheme = vi.fn();
        const onSave = vi.fn();
        useTheme.mockReturnValue({
            mode: 'dark',
            setMode,
            theme: 'flax',
            setTheme,
        });
        const { container } = render(<PreferencesPanel onSave={onSave} isSaving={false} />);
        await screen.findByText('Appearance');
        fireEvent.submit(container.querySelector('form'));
        expect(onSave).toHaveBeenCalledWith({ mode: 'dark', theme: 'flax' });
    });

    it('submits study-time preference', async () => {
      const onSleepSave = vi.fn();
      const onStudyTimeSave = vi.fn().mockResolvedValue(true);
      render(
          <PreferencesPanel
              onSave={vi.fn()}
              onSleepSave={onSleepSave}
              onStudyTimeSave={onStudyTimeSave}
              isSaving={false}
              activeSubTab="studytime"
          />
      );
      const input = await screen.findByLabelText('Preferred study time per day (minutes)');
      fireEvent.change(input, { target: { value: '180' } });
      fireEvent.click(screen.getByRole('button', { name: 'Save Study Time' }));
      await waitFor(() => {
          expect(onStudyTimeSave).toHaveBeenCalledWith({ preferred_study_minutes_per_day: 180 });
      });
    });
});
