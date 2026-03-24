import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MusicStations } from '../../../components/Timer/soundPanel/MusicStations';

vi.mock('../../../pages/Timer/TimerPage.module.css', () => ({ default: {} }));

vi.mock('../../../components/Timer/soundPanel/soundPanelData', () => ({
  MUSIC_STATIONS: [
    { id: 'yt-lofi', label: 'Lo-fi Beats', provider: 'youtube', embedUrl: 'https://youtube.com/embed/1', externalUrl: 'https://youtube.com/1' },
    { id: 'spotify-lofi', label: 'Lo-fi Café', provider: 'spotify', embedUrl: 'https://spotify.com/embed/1', externalUrl: 'https://spotify.com/1' },
  ],
}));

vi.mock('../../../components/Timer/soundPanel/MusicEmbed', () => ({
  MusicEmbed: ({ station, onClose }) => (
    <div data-testid="music-embed">
      <span>{station.label}</span>
      <button onClick={onClose}>close-embed</button>
    </div>
  ),
}));

vi.mock('../../../components/Timer/soundPanel/SoundIcons', () => ({
  ProviderIcon: ({ provider }) => <span data-testid={`icon-${provider}`} />,
}));

describe('MusicStations', () => {
  it('renders the "Music & Streams" label', () => {
    render(<MusicStations activeStation={null} toggleStation={vi.fn()} closeStation={vi.fn()} />);
    expect(screen.getByText('Music & Streams')).toBeTruthy();
  });

  it('renders a button for each station', () => {
    render(<MusicStations activeStation={null} toggleStation={vi.fn()} closeStation={vi.fn()} />);
    expect(screen.getByText('Lo-fi Beats')).toBeTruthy();
    expect(screen.getByText('Lo-fi Café')).toBeTruthy();
  });

  it('calls toggleStation with the station when a button is clicked', () => {
    const toggleStation = vi.fn();
    render(<MusicStations activeStation={null} toggleStation={toggleStation} closeStation={vi.fn()} />);
    fireEvent.click(screen.getByText('Lo-fi Beats'));
    expect(toggleStation).toHaveBeenCalledWith(expect.objectContaining({ id: 'yt-lofi' }));
  });

  it('renders provider icons for each station', () => {
    render(<MusicStations activeStation={null} toggleStation={vi.fn()} closeStation={vi.fn()} />);
    expect(screen.getByTestId('icon-youtube')).toBeTruthy();
    expect(screen.getByTestId('icon-spotify')).toBeTruthy();
  });

  it('does not render MusicEmbed when no active station', () => {
    render(<MusicStations activeStation={null} toggleStation={vi.fn()} closeStation={vi.fn()} />);
    expect(screen.queryByTestId('music-embed')).toBeNull();
  });

  it('renders MusicEmbed when a station is active', () => {
    const activeStation = { id: 'yt-lofi', label: 'Lo-fi Beats', provider: 'youtube', embedUrl: 'https://youtube.com/embed/1', externalUrl: 'https://youtube.com/1' };
    render(<MusicStations activeStation={activeStation} toggleStation={vi.fn()} closeStation={vi.fn()} />);
    expect(screen.getByTestId('music-embed')).toBeTruthy();
    expect(screen.getByText('Lo-fi Beats')).toBeTruthy();
  });

  it('calls closeStation when MusicEmbed close button is clicked', () => {
    const closeStation = vi.fn();
    const activeStation = { id: 'yt-lofi', label: 'Lo-fi Beats', provider: 'youtube', embedUrl: '', externalUrl: '' };
    render(<MusicStations activeStation={activeStation} toggleStation={vi.fn()} closeStation={closeStation} />);
    fireEvent.click(screen.getByText('close-embed'));
    expect(closeStation).toHaveBeenCalled();
  });

  it('shows "Play" title for inactive stations', () => {
    render(<MusicStations activeStation={null} toggleStation={vi.fn()} closeStation={vi.fn()} />);
    expect(screen.getByTitle('Play Lo-fi Beats')).toBeTruthy();
  });

  it('shows "Close" title for the active station button', () => {
    const activeStation = { id: 'yt-lofi', label: 'Lo-fi Beats', provider: 'youtube', embedUrl: '', externalUrl: '' };
    render(<MusicStations activeStation={activeStation} toggleStation={vi.fn()} closeStation={vi.fn()} />);
    expect(screen.getByTitle('Close Lo-fi Beats')).toBeTruthy();
  });
});
