/*
 * Preferences panel tests.
 */

import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import PreferencesPanel from '../../../../components/settings/components/PreferencesPanel';

vi.mock('../../../../context/ThemeContext', () => ({
  useTheme: vi.fn(() => ({
    mode: 'light',
    setMode: vi.fn(),
    theme: 'flax',
    setTheme: vi.fn(),
  })),
}));

vi.mock('../../../../api/userApi', () => ({
  getUserSettings: vi.fn().mockResolvedValue({
    sleep_time: '23:00:00',
    wake_time: '07:00:00',
  }),
}));

vi.mock('../../../../pages/tasks/components/DateTimePicker', () => ({
  default: ({ value, onChange, placeholder }) => <input data-testid={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />,
}));

vi.mock('../../../../components/common/animated_dropdown', () => ({
  default: ({ value, onChange, options = [], placeholder = 'dropdown' }) => (
    <select data-testid={placeholder} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  ),
}));

import { useTheme } from '../../../../context/ThemeContext';

describe('PreferencesPanel', () => {
  function mockStatefulTheme(initialMode = 'light', initialTheme = 'flax') {
    useTheme.mockImplementation(() => {
      const [mode, setMode] = useState(initialMode);
      const [theme, setTheme] = useState(initialTheme);
      return { mode, setMode, theme, setTheme };
    });
  }

  it('renders Appearance section title', async () => {
    useTheme.mockReturnValue({ mode: 'light', setMode: vi.fn(), theme: 'flax', setTheme: vi.fn() });
    render(<PreferencesPanel onSave={vi.fn()} isSaving={false} />);
    await screen.findByText('Appearance');
  });

  it('renders Interface Mode label', async () => {
    useTheme.mockReturnValue({ mode: 'light', setMode: vi.fn(), theme: 'flax', setTheme: vi.fn() });
    render(<PreferencesPanel onSave={vi.fn()} isSaving={false} />);
    await screen.findByText('Interface Mode');
  });

  it('renders Light and Dark theme buttons', async () => {
    useTheme.mockReturnValue({ mode: 'light', setMode: vi.fn(), theme: 'flax', setTheme: vi.fn() });
    render(<PreferencesPanel onSave={vi.fn()} isSaving={false} />);
    await screen.findByText('Interface Mode');
    const interfaceModeGroup = screen.getByText('Interface Mode').closest('div');
    expect(within(interfaceModeGroup).getByText('Light')).toBeTruthy();
    expect(within(interfaceModeGroup).getByText('Dark')).toBeTruthy();
  });

  it('renders Save Appearance button', async () => {
    useTheme.mockReturnValue({ mode: 'light', setMode: vi.fn(), theme: 'flax', setTheme: vi.fn() });
    render(<PreferencesPanel onSave={vi.fn()} isSaving={false} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save Appearance' })).toBeTruthy());
  });

  it('shows Saving... when isSaving', async () => {
    useTheme.mockReturnValue({ mode: 'light', setMode: vi.fn(), theme: 'flax', setTheme: vi.fn() });
    render(<PreferencesPanel onSave={vi.fn()} isSaving={true} />);
    await screen.findByText('Saving...');
  });

  it('calls setMode when Dark is clicked', async () => {
    const setMode = vi.fn();
    const setTheme = vi.fn();
    useTheme.mockReturnValue({ mode: 'light', setMode, theme: 'flax', setTheme });
    render(<PreferencesPanel onSave={vi.fn()} isSaving={false} />);
    await screen.findByText('Appearance');
    const interfaceModeGroup = screen.getByText('Interface Mode').closest('div');
    const darkButton = within(interfaceModeGroup).getByText('Dark').closest('button');
    fireEvent.click(darkButton);
    expect(setMode).toHaveBeenCalledWith('dark');
  });

  it('calls onSave with changed appearance data on submit', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    mockStatefulTheme();
    const { container } = render(<PreferencesPanel onSave={onSave} isSaving={false} />);
    await screen.findByText('Appearance');
    const interfaceModeGroup = screen.getByText('Interface Mode').closest('div');
    fireEvent.click(within(interfaceModeGroup).getByText('Dark').closest('button'));
    fireEvent.submit(container.querySelector('form'));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ mode: 'dark', theme: 'flax' }));
  });

  it('submits study-time preference', async () => {
    const onStudyTimeSave = vi.fn().mockResolvedValue(true);
    render(<PreferencesPanel onSave={vi.fn()} onSleepSave={vi.fn()} onStudyTimeSave={onStudyTimeSave} isSaving={false} activeSubTab="studytime" />);
    const input = await screen.findByTestId('Choose a target');
    fireEvent.change(input, { target: { value: '180' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save daily study time' }));
    await waitFor(() => expect(onStudyTimeSave).toHaveBeenCalledWith({ preferred_study_minutes_per_day: 180 }));
  });

  it('keeps the selected appearance after a successful appearance save', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    mockStatefulTheme();
    const { container } = render(<PreferencesPanel onSave={onSave} isSaving={false} />);
    await screen.findByText('Appearance');
    const interfaceModeGroup = screen.getByText('Interface Mode').closest('div');
    fireEvent.click(within(interfaceModeGroup).getByText('Dark').closest('button'));
    fireEvent.submit(container.querySelector('form'));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ mode: 'dark', theme: 'flax' }));
    expect(within(interfaceModeGroup).getByText('✓')).toBeInTheDocument();
  });

  it('shows saved tick after a successful sleep save', async () => {
    const onSleepSave = vi.fn().mockResolvedValue(true);
    useTheme.mockReturnValue({ mode: 'light', setMode: vi.fn(), theme: 'flax', setTheme: vi.fn() });
    render(<PreferencesPanel onSave={vi.fn()} onSleepSave={onSleepSave} isSaving={false} activeSubTab="sleep" />);
    const bedtimeInput = await screen.findByTestId('Pick bedtime');
    fireEvent.change(bedtimeInput, { target: { value: '22:30' } });
    fireEvent.submit(bedtimeInput.closest('form'));
    await waitFor(() => expect(screen.getByRole('button', { name: /saved!/i })).toBeTruthy());
  });

  it('skips appearance saves when nothing changed and renders scheduling subtabs', async () => {
    const onSave = vi.fn();
    useTheme.mockReturnValue({ mode: 'light', setMode: vi.fn(), theme: 'flax', setTheme: vi.fn() });

    const { rerender, container } = render(<PreferencesPanel onSave={onSave} isSaving={false} />);
    await screen.findByText('Appearance');
    fireEvent.submit(container.querySelector('form'));
    expect(onSave).not.toHaveBeenCalled();

    rerender(<PreferencesPanel onSave={vi.fn()} isSaving={false} activeSubTab="scheduling" />);
    expect(screen.getByText(/Daily Study Time/i)).toBeInTheDocument();

    rerender(<PreferencesPanel onSave={vi.fn()} isSaving={false} activeSubTab="week" />);
    expect(screen.getByRole('button', { name: /Save scheduling days/i })).toBeInTheDocument();

    rerender(<PreferencesPanel onSave={vi.fn()} isSaving={false} activeSubTab="daynight" />);
    expect(screen.getByRole('button', { name: /Save study time preference/i })).toBeInTheDocument();
  });

  it('does not fire the saved appearance signal when appearance saving fails', async () => {
    const onSave = vi.fn().mockResolvedValue(false);
    useTheme.mockReturnValue({ mode: '', setMode: vi.fn(), theme: 'flax', setTheme: vi.fn() });
    const bootstrap = render(<PreferencesPanel onSave={vi.fn()} isSaving={false} />);
    await screen.findByText('Appearance');
    bootstrap.unmount();

    mockStatefulTheme();
    const { container } = render(<PreferencesPanel onSave={onSave} isSaving={false} />);

    await screen.findByText('Appearance');
    const interfaceModeGroup = screen.getByText('Interface Mode').closest('div');
    fireEvent.click(within(interfaceModeGroup).getByText('Dark').closest('button'));
    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ mode: 'dark', theme: 'flax' }));
    expect(screen.getByRole('button', { name: 'Save Appearance' })).toBeInTheDocument();
  });

  it('does not mark sleep settings as saved when the sleep save fails', async () => {
    const onSleepSave = vi.fn().mockResolvedValue(false);
    useTheme.mockReturnValue({ mode: 'light', setMode: vi.fn(), theme: 'flax', setTheme: vi.fn() });

    render(<PreferencesPanel onSave={vi.fn()} onSleepSave={onSleepSave} isSaving={false} activeSubTab="sleep" />);

    const bedtimeInput = await screen.findByTestId('Pick bedtime');
    fireEvent.change(bedtimeInput, { target: { value: '22:45' } });
    fireEvent.submit(bedtimeInput.closest('form'));

    await waitFor(() => expect(onSleepSave).toHaveBeenCalledWith({ sleep_time: '22:45', wake_time: '07:00' }));
    expect(screen.queryByRole('button', { name: /saved!/i })).not.toBeInTheDocument();
  });
});
