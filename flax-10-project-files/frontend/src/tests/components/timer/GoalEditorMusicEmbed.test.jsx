/*
 * Tests for GoalEditor and MusicEmbed timer components.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GoalEditor } from '../../../components/Timer/todayBanner/GoalEditor';
import { MusicEmbed } from '../../../components/Timer/soundPanel/MusicEmbed';

vi.mock('../../../pages/Timer/TimerPage.module.css', () => ({
  default: {
    todayGoalInput: 'todayGoalInput', todayGoalEditBtn: 'todayGoalEditBtn',
    musicEmbedWrap: 'musicEmbedWrap', musicEmbedHeader: 'musicEmbedHeader',
    musicEmbedTitle: 'musicEmbedTitle', musicEmbedActions: 'musicEmbedActions',
    musicEmbedExternal: 'musicEmbedExternal', musicEmbedClose: 'musicEmbedClose',
    musicEmbedIframe: 'musicEmbedIframe',
  },
}));

vi.mock('../../../components/Timer/soundPanel/SoundIcons', () => ({
  ProviderIcon: ({ provider }) => <span data-provider={provider} />,
}));

const defaultGoalProps = {
  goalHours: 6,
  goalInput: '6',
  setGoalInput: vi.fn(),
  setGoalHours: vi.fn(),
  setEditingGoal: vi.fn(),
};

describe('GoalEditor – toggle mode', () => {
  it('renders the goal hours button when not editing', () => {
    render(<GoalEditor {...defaultGoalProps} editingGoal={false} />);
    expect(screen.getByRole('button', { name: '6h' })).toBeInTheDocument();
  });

  it('calls setGoalInput and setEditingGoal when the toggle button is clicked', () => {
    const setGoalInput = vi.fn();
    const setEditingGoal = vi.fn();
    render(<GoalEditor {...defaultGoalProps} setGoalInput={setGoalInput} setEditingGoal={setEditingGoal} editingGoal={false} />);
    fireEvent.click(screen.getByRole('button', { name: '6h' }));
    expect(setGoalInput).toHaveBeenCalledWith('6');
    expect(setEditingGoal).toHaveBeenCalledWith(true);
  });
});

describe('GoalEditor – input mode', () => {
  it('renders a number input when editing', () => {
    render(<GoalEditor {...defaultGoalProps} editingGoal={true} />);
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });

  it('calls setGoalInput on input change', () => {
    const setGoalInput = vi.fn();
    render(<GoalEditor {...defaultGoalProps} setGoalInput={setGoalInput} editingGoal={true} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '8' } });
    expect(setGoalInput).toHaveBeenCalledWith('8');
  });

  it('persists goal and calls setEditingGoal on Enter key', () => {
    const setGoalHours = vi.fn();
    const setEditingGoal = vi.fn();
    render(<GoalEditor {...defaultGoalProps} goalInput="8" setGoalHours={setGoalHours} setEditingGoal={setEditingGoal} editingGoal={true} />);
    fireEvent.keyDown(screen.getByRole('spinbutton'), { key: 'Enter' });
    expect(setGoalHours).toHaveBeenCalledWith(8);
    expect(setEditingGoal).toHaveBeenCalledWith(false);
  });

  it('calls setEditingGoal(false) on Escape key without saving', () => {
    const setGoalHours = vi.fn();
    const setEditingGoal = vi.fn();
    render(<GoalEditor {...defaultGoalProps} goalInput="8" setGoalHours={setGoalHours} setEditingGoal={setEditingGoal} editingGoal={true} />);
    fireEvent.keyDown(screen.getByRole('spinbutton'), { key: 'Escape' });
    expect(setEditingGoal).toHaveBeenCalledWith(false);
    expect(setGoalHours).not.toHaveBeenCalled();
  });

  it('persists goal on blur with a valid number', () => {
    const setGoalHours = vi.fn();
    const setEditingGoal = vi.fn();
    render(<GoalEditor {...defaultGoalProps} goalInput="7.5" setGoalHours={setGoalHours} setEditingGoal={setEditingGoal} editingGoal={true} />);
    fireEvent.blur(screen.getByRole('spinbutton'));
    expect(setGoalHours).toHaveBeenCalledWith(7.5);
  });

  it('does not save when the input value is not a positive number', () => {
    const setGoalHours = vi.fn();
    const setEditingGoal = vi.fn();
    render(<GoalEditor {...defaultGoalProps} goalInput="-1" setGoalHours={setGoalHours} setEditingGoal={setEditingGoal} editingGoal={true} />);
    fireEvent.blur(screen.getByRole('spinbutton'));
    expect(setGoalHours).not.toHaveBeenCalled();
  });
});

describe('MusicEmbed', () => {
  const spotifyStation = {
    provider: 'spotify',
    label: 'Chill Lofi',
    externalUrl: 'https://open.spotify.com/playlist/abc',
    embedUrl: 'https://open.spotify.com/embed/playlist/abc',
  };

  it('renders the station label', () => {
    render(<MusicEmbed station={spotifyStation} onClose={vi.fn()} />);
    expect(screen.getByText('Chill Lofi')).toBeInTheDocument();
  });

  it('renders an iframe with the embed URL', () => {
    render(<MusicEmbed station={spotifyStation} onClose={vi.fn()} />);
    expect(screen.getByTitle('Chill Lofi')).toHaveAttribute('src', spotifyStation.embedUrl);
  });

  it('uses height 152 for Spotify', () => {
    render(<MusicEmbed station={spotifyStation} onClose={vi.fn()} />);
    expect(screen.getByTitle('Chill Lofi')).toHaveAttribute('height', '152');
  });

  it('uses height 168 for non-Spotify providers', () => {
    const ytStation = { ...spotifyStation, provider: 'youtube', label: 'Study Music' };
    render(<MusicEmbed station={ytStation} onClose={vi.fn()} />);
    expect(screen.getByTitle('Study Music')).toHaveAttribute('height', '168');
  });

  it('renders an external link to the station URL', () => {
    render(<MusicEmbed station={spotifyStation} onClose={vi.fn()} />);
    expect(screen.getByTitle('Open in app')).toHaveAttribute('href', spotifyStation.externalUrl);
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(<MusicEmbed station={spotifyStation} onClose={onClose} />);
    fireEvent.click(screen.getByTitle('Close player'));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders the ProviderIcon with the correct provider', () => {
    const { container } = render(<MusicEmbed station={spotifyStation} onClose={vi.fn()} />);
    expect(container.querySelector('[data-provider="spotify"]')).toBeInTheDocument();
  });
});
