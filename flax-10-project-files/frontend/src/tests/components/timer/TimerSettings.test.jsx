import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import * as helpers from '../../utils/timerTestHelpers';

const testUpdate = () => {
    const onUpdate = vi.fn();
    helpers.renderTimerSettings({ work: 25, breakTime: 5, sessions: 4, isActive: false, onUpdate });
    helpers.updateSettings(0, '30');
    expect(onUpdate).toHaveBeenCalledWith('work', 30);
    helpers.updateSettings(0, '');
    expect(onUpdate).toHaveBeenCalledWith('work', '');
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
    expect(onUpdate).toHaveBeenCalledWith('work', 0);
};

describe('TimerSettings', () => {
    it('inputs call onUpdate', testUpdate);
    it('selects content on focus', testFocus);
    it('resets invalid values on blur', testBlur);
});
