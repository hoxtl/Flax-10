/**
 * Extra coverage tests for SessionDots components:
 *   - SessionDots (default export, LiveStatsRow, ProgressStrip)
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import SessionDots, { LiveStatsRow, ProgressStrip } from '../../../components/timer/SessionDots';

// ---------------------------------------------------------------------------
// SessionDots
// ---------------------------------------------------------------------------

describe('SessionDots', () => {
  it('renders correct number of dots', () => {
    const { container } = render(
      <SessionDots completedSessions={0} targetSessions={4} isActive={false} isPaused={false} />,
    );
    // Each session dot is a <span>
    const dots = container.querySelectorAll('span[aria-hidden]');
    expect(dots.length).toBe(4);
  });

  it('aria-label reflects current session', () => {
    const { container } = render(
      <SessionDots completedSessions={1} targetSessions={4} isActive={false} isPaused={false} />,
    );
    const wrapper = container.firstChild;
    expect(wrapper).toHaveAttribute('aria-label', 'Session 2 of 4');
  });

  it('renders checkmark in completed dots', () => {
    render(
      <SessionDots completedSessions={2} targetSessions={4} isActive={false} isPaused={false} />,
    );
    const checkmarks = screen.getAllByText('✓');
    expect(checkmarks).toHaveLength(2);
  });

  it('renders no checkmarks when no sessions completed', () => {
    render(
      <SessionDots completedSessions={0} targetSessions={4} isActive={false} isPaused={false} />,
    );
    expect(screen.queryByText('✓')).not.toBeInTheDocument();
  });

  it('active dot at current session index when isActive is true', () => {
    const { container } = render(
      <SessionDots completedSessions={1} targetSessions={4} isActive={true} isPaused={false} />,
    );
    // The dot at index 1 should have the "active" class from CSS proxy (key = "sessionDotActive")
    const dots = container.querySelectorAll('span[aria-hidden]');
    expect(dots[1].className).toContain('sessionDotActive');
  });

  it('active dot at current session when isPaused is true', () => {
    const { container } = render(
      <SessionDots completedSessions={0} targetSessions={2} isActive={false} isPaused={true} />,
    );
    const dots = container.querySelectorAll('span[aria-hidden]');
    expect(dots[0].className).toContain('sessionDotActive');
  });

  it('pending dots when neither active nor paused', () => {
    const { container } = render(
      <SessionDots completedSessions={0} targetSessions={3} isActive={false} isPaused={false} />,
    );
    const dots = container.querySelectorAll('span[aria-hidden]');
    dots.forEach((dot) => expect(dot.className).toContain('sessionDotPending'));
  });
});

// ---------------------------------------------------------------------------
// LiveStatsRow
// ---------------------------------------------------------------------------

describe('LiveStatsRow', () => {
  it('renders nothing when session has never started', () => {
    const { container } = render(
      <LiveStatsRow blockTotalWork={0} blockTotalBreak={0} totalPaused={0} isActive={false} isPaused={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders when isActive is true', () => {
    render(
      <LiveStatsRow blockTotalWork={0} blockTotalBreak={0} totalPaused={0} isActive={true} isPaused={false} />,
    );
    expect(screen.getByText(/focus/i)).toBeInTheDocument();
    expect(screen.getByText(/break/i)).toBeInTheDocument();
  });

  it('renders when isPaused is true', () => {
    render(
      <LiveStatsRow blockTotalWork={0} blockTotalBreak={0} totalPaused={0} isActive={false} isPaused={true} />,
    );
    expect(screen.getByText(/focus/i)).toBeInTheDocument();
  });

  it('renders when blockTotalWork > 0', () => {
    render(
      <LiveStatsRow blockTotalWork={300} blockTotalBreak={0} totalPaused={0} isActive={false} isPaused={false} />,
    );
    expect(screen.getByText(/focus/i)).toBeInTheDocument();
  });

  it('shows formatted work duration when blockTotalWork > 0', () => {
    render(
      <LiveStatsRow blockTotalWork={600} blockTotalBreak={0} totalPaused={0} isActive={true} isPaused={false} />,
    );
    // fmtDuration(600) = "10m"
    expect(screen.getByText('10m')).toBeInTheDocument();
  });

  it('shows dash placeholder when blockTotalWork is 0 but session is active', () => {
    render(
      <LiveStatsRow blockTotalWork={0} blockTotalBreak={0} totalPaused={0} isActive={true} isPaused={false} />,
    );
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it('shows PausedStat when totalPaused > 30', () => {
    render(
      <LiveStatsRow blockTotalWork={0} blockTotalBreak={0} totalPaused={120} isActive={true} isPaused={false} />,
    );
    expect(screen.getByText(/paused/i)).toBeInTheDocument();
    expect(screen.getByText('2m')).toBeInTheDocument();
  });

  it('does NOT show PausedStat when totalPaused <= 30', () => {
    render(
      <LiveStatsRow blockTotalWork={0} blockTotalBreak={0} totalPaused={30} isActive={true} isPaused={false} />,
    );
    expect(screen.queryByText(/paused/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// ProgressStrip
// ---------------------------------------------------------------------------

describe('ProgressStrip', () => {
  it('renders a progress fill element', () => {
    const { container } = render(<ProgressStrip value={60} />);
    const fill = container.querySelector('[class*="linearProgressFill"]');
    expect(fill).toBeInTheDocument();
    expect(fill).toHaveStyle({ width: '60%' });
  });

  it('clamps value to 0 when negative', () => {
    const { container } = render(<ProgressStrip value={-10} />);
    const fill = container.querySelector('[class*="linearProgressFill"]');
    expect(fill).toHaveStyle({ width: '0%' });
  });

  it('clamps value to 100 when over 100', () => {
    const { container } = render(<ProgressStrip value={150} />);
    const fill = container.querySelector('[class*="linearProgressFill"]');
    expect(fill).toHaveStyle({ width: '100%' });
  });

  it('renders zero width at value 0', () => {
    const { container } = render(<ProgressStrip value={0} />);
    const fill = container.querySelector('[class*="linearProgressFill"]');
    expect(fill).toHaveStyle({ width: '0%' });
  });
});
