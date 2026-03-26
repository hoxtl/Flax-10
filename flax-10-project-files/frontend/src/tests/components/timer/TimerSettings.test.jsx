import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import * as helpers from '../../utils/timerTestHelpers';

const testUpdate = () => {
    const onUpdate = vi.fn();
    helpers.renderTimerSettings({ work: 25, breakTime: 5, sessions: 4, isActive: false, onUpdate });

    // Changing input should NOT trigger update immediately
    const input = screen.getAllByRole('spinbutton')[0];
    fireEvent.change(input, { target: { value: '30' } });
    expect(onUpdate).not.toHaveBeenCalled();

    // Blurring should trigger update
    helpers.blurInput(0);
    expect(onUpdate).toHaveBeenCalledWith('work', 30);

    // Changing to empty string and blurring should NOT update to empty, but reset to min/default
    onUpdate.mockClear();
    fireEvent.change(input, { target: { value: '' } });
    helpers.blurInput(0);
    // Should reset to 1 (min for work)
    expect(onUpdate).toHaveBeenCalledWith('work', 1);
};

const testFocus = () => {
    helpers.renderTimerSettings({ work: 25, breakTime: 5, sessions: 4, isActive: false, onUpdate: () => { } });
    const input = screen.getAllByRole('spinbutton')[0];
    const selectSpy = vi.spyOn(input, 'select');
    fireEvent.focus(input);
    expect(selectSpy).toHaveBeenCalled();
};

const testBlur = () => {
    const onUpdate = vi.fn();
    helpers.renderTimerSettings({ work: '', breakTime: 5, sessions: 4, isActive: false, onUpdate });
    helpers.blurInput(0);
    expect(onUpdate).toHaveBeenCalledWith('work', 1);

    // Also test explicitly setting 0
    helpers.updateSettings(0, '0');
    helpers.blurInput(0);
    expect(onUpdate).toHaveBeenCalledWith('work', 1);
};

const testDisclaimerInput = () => {
    helpers.renderTimerSettings({ work: 25, breakTime: 5, sessions: 4, isActive: false, onUpdate: () => { } });
    expect(screen.queryByText(/Minimum study time/)).not.toBeInTheDocument();

    // Type 0 (invalid) - Should snap back to min (1) and show error
    fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value: '0' } });
    expect(screen.getByText(/Minimum study time/)).toBeInTheDocument();
    expect(screen.getAllByRole('spinbutton')[0]).toHaveValue(1);

    helpers.blurInput(0);
    expect(screen.queryByText(/Minimum study time/)).not.toBeInTheDocument();
};

const testDisclaimerArrow = () => {
    helpers.renderTimerSettings({ work: 25, breakTime: 5, sessions: 4, isActive: false, onUpdate: () => { } });
    // Reset to min value (1)
    fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value: '1' } });
    helpers.blurInput(0);

    fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value: '0' } });
    expect(screen.getByText(/Minimum study time/)).toBeInTheDocument();
};

const testArrowDownWhenValueAboveMin = () => {
    helpers.renderTimerSettings({ work: 25, breakTime: 5, sessions: 4, isActive: false, onUpdate: () => { } });
    const input = screen.getAllByRole('spinbutton')[0];
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.queryByText(/Minimum study time/)).not.toBeInTheDocument();
};

const testArrowDownAtMinimum = () => {
    helpers.renderTimerSettings({ work: 1, breakTime: 5, sessions: 4, isActive: false, onUpdate: () => { } });
    const input = screen.getAllByRole('spinbutton')[0];
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.getByText(/Minimum study time/)).toBeInTheDocument();
};

describe('TimerSettings', () => {
    it('inputs call onUpdate', testUpdate);
    it('selects content on focus', testFocus);
    it('resets invalid values on blur', testBlur);
    it('shows disclaimer on invalid input', testDisclaimerInput);
    it('shows disclaimer on arrow down', testDisclaimerArrow);
    it('does not show disclaimer on ArrowDown when value above min', testArrowDownWhenValueAboveMin);
    it('shows disclaimer on ArrowDown when already at minimum', testArrowDownAtMinimum);
});
