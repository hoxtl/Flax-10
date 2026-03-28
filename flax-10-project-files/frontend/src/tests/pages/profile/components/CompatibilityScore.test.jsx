/* Tests for CompatibilityScore widget */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompatibilityScore } from '../../../../pages/profile/components/widgets/CompatibilityScore';

vi.mock('framer-motion', () => ({
  motion: {
    circle: ({ children, ...props }) => <circle {...props}>{children}</circle>,
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('../../../../hooks/useCountUp', () => ({
  useCountUp: () => ({ current: null }),
}));

vi.mock('../../../../pages/profile/components/widgets/ProfileCompat.module.css', () => ({
  default: {},
}), { virtual: true });

const viewedSummary = { persona: { id: 'night_owl' } };
const currentUserSummary = { persona: { id: 'night_owl' } };

describe('CompatibilityScore', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders null when viewedSummary is missing', () => {
    const { container } = render(
      <CompatibilityScore
        viewedSummary={null}
        currentUserSummary={currentUserSummary}
        sharedModuleCount={2}
        totalModuleCount={5}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders null when currentUserSummary is missing', () => {
    const { container } = render(
      <CompatibilityScore
        viewedSummary={viewedSummary}
        currentUserSummary={null}
        sharedModuleCount={2}
        totalModuleCount={5}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders compatibility content when both summaries present', () => {
    const { container } = render(
      <CompatibilityScore
        viewedSummary={viewedSummary}
        currentUserSummary={currentUserSummary}
        sharedModuleCount={3}
        totalModuleCount={6}
        activitySparkline={[]}
      />
    );
    expect(container.firstChild).not.toBeNull();
    expect(screen.getByText('Similar study times')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
    expect(screen.getByText('match')).toBeInTheDocument();
  });

  it('shows study-together CTA when total >= 75 and onSuggestStudySession provided', () => {
    const onSuggest = vi.fn();
    render(
      <CompatibilityScore
        viewedSummary={{ persona: { id: 'night_owl' } }}
        currentUserSummary={{ persona: { id: 'night_owl' } }}
        sharedModuleCount={6}
        totalModuleCount={6}
        onSuggestStudySession={onSuggest}
        suggestionState="idle"
      />
    );
    expect(screen.getByText('Suggest a Study Session')).toBeInTheDocument();
  });

  it('hides CTA when no onSuggestStudySession provided', () => {
    render(
      <CompatibilityScore
        viewedSummary={{ persona: { id: 'night_owl' } }}
        currentUserSummary={{ persona: { id: 'night_owl' } }}
        sharedModuleCount={6}
        totalModuleCount={6}
      />
    );
    expect(screen.queryByText('Suggest a Study Session')).toBeNull();
  });

  it('shows "Sending..." when suggestionState is sending', () => {
    const onSuggest = vi.fn();
    render(
      <CompatibilityScore
        viewedSummary={{ persona: { id: 'night_owl' } }}
        currentUserSummary={{ persona: { id: 'night_owl' } }}
        sharedModuleCount={6}
        totalModuleCount={6}
        onSuggestStudySession={onSuggest}
        suggestionState="sending"
      />
    );
    expect(screen.getByText('Sending...')).toBeInTheDocument();
  });

  it('shows "Suggestion Sent" when suggestionState is sent', () => {
    const onSuggest = vi.fn();
    render(
      <CompatibilityScore
        viewedSummary={{ persona: { id: 'night_owl' } }}
        currentUserSummary={{ persona: { id: 'night_owl' } }}
        sharedModuleCount={6}
        totalModuleCount={6}
        onSuggestStudySession={onSuggest}
        suggestionState="sent"
      />
    );
    expect(screen.getByText('Suggestion Sent')).toBeInTheDocument();
  });

  it('CTA is disabled when sending', () => {
    const onSuggest = vi.fn();
    render(
      <CompatibilityScore
        viewedSummary={{ persona: { id: 'night_owl' } }}
        currentUserSummary={{ persona: { id: 'night_owl' } }}
        sharedModuleCount={6}
        totalModuleCount={6}
        onSuggestStudySession={onSuggest}
        suggestionState="sending"
      />
    );
    const btn = screen.getByRole('button', { name: 'Sending...' });
    expect(btn).toBeDisabled();
  });

  it('calls onSuggestStudySession when CTA clicked', () => {
    const onSuggest = vi.fn();
    render(
      <CompatibilityScore
        viewedSummary={{ persona: { id: 'night_owl' } }}
        currentUserSummary={{ persona: { id: 'night_owl' } }}
        sharedModuleCount={6}
        totalModuleCount={6}
        onSuggestStudySession={onSuggest}
        suggestionState="idle"
      />
    );
    fireEvent.click(screen.getByText('Suggest a Study Session'));
    expect(onSuggest).toHaveBeenCalled();
  });

  it('renders activity sparkline when 7 data points given', () => {
    const sparkline = [
      { date: '2026-03-01', level: 2 },
      { date: '2026-03-02', level: 0 },
      { date: '2026-03-03', level: 4 },
      { date: '2026-03-04', level: 1 },
      { date: '2026-03-05', level: 3 },
      { date: '2026-03-06', level: 2 },
      { date: '2026-03-07', level: 1 },
    ];
    render(
      <CompatibilityScore
        viewedSummary={viewedSummary}
        currentUserSummary={currentUserSummary}
        sharedModuleCount={2}
        totalModuleCount={4}
        activitySparkline={sparkline}
      />
    );
    expect(screen.getByText('Study momentum')).toBeInTheDocument();
  });

  it('does not render sparkline when fewer than 7 points', () => {
    render(
      <CompatibilityScore
        viewedSummary={viewedSummary}
        currentUserSummary={currentUserSummary}
        sharedModuleCount={2}
        totalModuleCount={4}
        activitySparkline={[{ date: '2026-03-01', level: 1 }]}
      />
    );
    expect(screen.queryByText('Study momentum')).toBeNull();
  });

  it('renders sparkline dots even when dates are missing and levels need clamping', () => {
    const sparkline = Array.from({ length: 7 }, (_, index) => ({
      level: index % 2 === 0 ? 99 : -3,
    }));

    render(
      <CompatibilityScore
        viewedSummary={viewedSummary}
        currentUserSummary={currentUserSummary}
        sharedModuleCount={2}
        totalModuleCount={4}
        activitySparkline={sparkline}
      />
    );

    expect(screen.getByText('Study momentum')).toBeInTheDocument();
  });

  it('handles different personas for mismatch compatibility text', () => {
    const { container } = render(
      <CompatibilityScore
        viewedSummary={{ persona: { id: 'early_bird' } }}
        currentUserSummary={{ persona: { id: 'night_owl' } }}
        sharedModuleCount={0}
        totalModuleCount={4}
      />
    );
    expect(container.firstChild).not.toBeNull();
  });

  it('computes 0 score when totalModuleCount is 0', () => {
    const { container } = render(
      <CompatibilityScore
        viewedSummary={viewedSummary}
        currentUserSummary={currentUserSummary}
        sharedModuleCount={0}
        totalModuleCount={0}
      />
    );
    expect(container.firstChild).not.toBeNull();
  });

  it('shows module count detail text when sharedModuleCount > 0', () => {
    render(
      <CompatibilityScore
        viewedSummary={viewedSummary}
        currentUserSummary={currentUserSummary}
        sharedModuleCount={3}
        totalModuleCount={6}
      />
    );
    // The detail text includes module count
    expect(screen.getByText(/3 modules in common/)).toBeInTheDocument();
  });

  it('uses singular form for 1 shared module', () => {
    render(
      <CompatibilityScore
        viewedSummary={viewedSummary}
        currentUserSummary={currentUserSummary}
        sharedModuleCount={1}
        totalModuleCount={4}
      />
    );
    expect(screen.getByText(/1 module in common/)).toBeInTheDocument();
  });

  it('handles missing personas and all-day personas', () => {
    const { rerender } = render(
      <CompatibilityScore
        viewedSummary={{ persona: {} }}
        currentUserSummary={currentUserSummary}
        sharedModuleCount={0}
        totalModuleCount={4}
      />
    );
    expect(screen.getByText(/very different study rhythms/i)).toBeInTheDocument();

    rerender(
      <CompatibilityScore
        viewedSummary={{ persona: { id: 'consistent' } }}
        currentUserSummary={{ persona: { id: 'consistent' } }}
        sharedModuleCount={2}
        totalModuleCount={2}
      />
    );
    expect(screen.getByText(/really well/i)).toBeInTheDocument();
  });

  it('handles sprint personas and opposite rhythms', () => {
    const { rerender } = render(
      <CompatibilityScore
        viewedSummary={{ persona: { id: 'sprint' } }}
        currentUserSummary={{ persona: { id: 'night_owl' } }}
        sharedModuleCount={1}
        totalModuleCount={3}
      />
    );
    expect(screen.getByText(/different study rhythms/i)).toBeInTheDocument();

    rerender(
      <CompatibilityScore
        viewedSummary={{ persona: { id: 'early_bird' } }}
        currentUserSummary={{ persona: { id: 'night_owl' } }}
        sharedModuleCount={0}
        totalModuleCount={3}
      />
    );
    expect(screen.getByText(/very different study rhythms/i)).toBeInTheDocument();
  });

  it('covers threshold for similar hours and overlapping windows', () => {
    const { rerender } = render(
      <CompatibilityScore
        viewedSummary={{ persona: { id: 'night_owl' } }}
        currentUserSummary={{ persona: { id: 'night_owl' } }}
        sharedModuleCount={0}
        totalModuleCount={10}
      />
    );
    expect(screen.getByText(/similar hours/i)).toBeInTheDocument();

    rerender(
      <CompatibilityScore
        viewedSummary={{ persona: { id: 'sprint' } }}
        currentUserSummary={{ persona: { id: 'marathon' } }}
        sharedModuleCount={0}
        totalModuleCount={3}
      />
    );
    expect(screen.getByText(/a few overlapping study windows/i)).toBeInTheDocument();
  });

  it('covers threshold for different rhythms and partial overlap', () => {
    const { rerender } = render(
      <CompatibilityScore
        viewedSummary={{ persona: { id: 'early_bird' } }}
        currentUserSummary={{ persona: { id: 'afternoon_peak' } }}
        sharedModuleCount={1}
        totalModuleCount={4}
      />
    );
    expect(screen.getByText(/very different study rhythms/i)).toBeInTheDocument();

    rerender(
      <CompatibilityScore
        viewedSummary={{ persona: { id: 'early_bird' } }}
        currentUserSummary={{ persona: { id: 'consistent' } }}
        sharedModuleCount={2}
        totalModuleCount={2}
      />
    );
    expect(screen.getByText(/still have some overlap/i)).toBeInTheDocument();
  });
});
