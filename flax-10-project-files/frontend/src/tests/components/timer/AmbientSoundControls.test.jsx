import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AmbientSoundControls } from '../../../components/Timer/soundPanel/AmbientSoundControls';

vi.mock('../../../pages/Timer/TimerPage.module.css', () => ({ default: {} }));

vi.mock('../../../components/Timer/soundPanel/soundPanelData', () => ({
  AMBIENT_SOUNDS: [
    { id: 'pink', label: 'Library Rain', noiseKey: 'pink' },
    { id: 'brown', label: 'Coffee Shop', noiseKey: 'brown' },
    { id: 'white', label: 'Waterloo Wind', noiseKey: 'white' },
  ],
}));

const defaultProps = {
  noiseType: 'none',
  toggle: vi.fn(),
  volume: 0.5,
  setVolume: vi.fn(),
};

describe('AmbientSoundControls', () => {
  it('renders the "Ambient Sounds" label', () => {
    render(<AmbientSoundControls {...defaultProps} />);
    expect(screen.getByText('Ambient Sounds')).toBeTruthy();
  });

  it('renders a button for each ambient sound', () => {
    render(<AmbientSoundControls {...defaultProps} />);
    expect(screen.getByText('Library Rain')).toBeTruthy();
    expect(screen.getByText('Coffee Shop')).toBeTruthy();
    expect(screen.getByText('Waterloo Wind')).toBeTruthy();
  });

  it('renders the None button', () => {
    render(<AmbientSoundControls {...defaultProps} />);
    expect(screen.getByText('None')).toBeTruthy();
  });

  it('calls toggle with the noiseKey when an ambient button is clicked', () => {
    const toggle = vi.fn();
    render(<AmbientSoundControls {...defaultProps} toggle={toggle} />);
    fireEvent.click(screen.getByText('Library Rain'));
    expect(toggle).toHaveBeenCalledWith('pink');
  });

  it('calls toggle with "none" when the None button is clicked', () => {
    const toggle = vi.fn();
    render(<AmbientSoundControls {...defaultProps} toggle={toggle} />);
    fireEvent.click(screen.getByText('None'));
    expect(toggle).toHaveBeenCalledWith('none');
  });

  it('renders the volume slider with the current volume value', () => {
    render(<AmbientSoundControls {...defaultProps} volume={0.7} />);
    const slider = screen.getByRole('slider');
    expect(slider.value).toBe('0.7');
  });

  it('calls setVolume with the numeric value when slider changes', () => {
    const setVolume = vi.fn();
    render(<AmbientSoundControls {...defaultProps} setVolume={setVolume} />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '0.8' } });
    expect(setVolume).toHaveBeenCalledWith(0.8);
  });

  it('renders the volume icon emoji', () => {
    render(<AmbientSoundControls {...defaultProps} />);
    expect(screen.getByText('🔊')).toBeTruthy();
  });
});
