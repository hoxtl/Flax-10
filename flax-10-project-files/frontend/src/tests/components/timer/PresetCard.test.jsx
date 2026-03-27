import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PresetCard } from '../../../components/timer/presets/PresetCard';

vi.mock('../../../pages/Timer/TimerPage.module.css', () => ({
  default: {
    presetListItem: 'presetListItem',
    presetListItemActive: 'presetListItemActive',
    presetListItemDisabled: 'presetListItemDisabled',
    presetListItemWrap: 'presetListItemWrap',
    presetListItemTop: 'presetListItemTop',
    presetListIcon: 'presetListIcon',
    presetListItemName: 'presetListItemName',
    presetDurationTag: 'presetDurationTag',
  },
}));

const isPresetActive = vi.fn();
const getPresetDurationTag = vi.fn();
const getPresetIcon = vi.fn();

vi.mock('../../../components/timer/utils/presetUtils', () => ({
  isPresetActive: (...args) => isPresetActive(...args),
  getPresetDurationTag: (...args) => getPresetDurationTag(...args),
  getPresetIcon: (...args) => getPresetIcon(...args),
}));

describe('PresetCard', () => {
  it('renders tooltip, active state, and applies the preset when enabled', () => {
    isPresetActive.mockReturnValue(true);
    getPresetDurationTag.mockReturnValue('50m');
    getPresetIcon.mockReturnValue('🌿');

    const onApply = vi.fn();
    const preset = { label: 'Deep Work', work: 50, brk: 10, sessions: 3 };
    render(<PresetCard preset={preset} t={{ isActive: false }} onApply={onApply} />);

    const button = screen.getByRole('button', { name: /Deep Work/i });
    expect(button).toHaveClass('presetListItemActive');
    expect(button).not.toBeDisabled();
    expect(button.closest('.presetListItemWrap')).toHaveAttribute(
      'data-tooltip',
      '50m work · 10m break · 3 sessions',
    );

    fireEvent.click(button);
    expect(onApply).toHaveBeenCalledWith(preset);
    expect(screen.getByText('50m')).toBeInTheDocument();
    expect(screen.getByText('🌿')).toBeInTheDocument();
  });

  it('disables the card while the timer is running and skips the apply callback', () => {
    isPresetActive.mockReturnValue(false);
    getPresetDurationTag.mockReturnValue('25m');
    getPresetIcon.mockReturnValue('🍅');

    const onApply = vi.fn();
    render(
      <PresetCard
        preset={{ label: 'Pomodoro', work: 25, brk: 5, sessions: 4 }}
        t={{ isActive: true }}
        onApply={onApply}
      />,
    );

    const button = screen.getByRole('button', { name: /Pomodoro/i });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('presetListItemDisabled');

    fireEvent.click(button);
    expect(onApply).not.toHaveBeenCalled();
  });
});
