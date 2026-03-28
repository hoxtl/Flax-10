import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompatibilityScore } from '../../../../pages/profile/components/ProfileWidgets';

describe('CompatibilityScore', () => {
  const viewedSummary = { persona: { id: 'night_owl' } };
  const currentUserSummary = { persona: { id: 'night_owl' } };

  it('shows study together CTA for high compatibility and triggers callback', () => {
    const onSuggestStudySession = vi.fn();
    render(
      <CompatibilityScore
        viewedSummary={viewedSummary}
        currentUserSummary={currentUserSummary}
        sharedModuleCount={2}
        totalModuleCount={2}
        viewedUsername="bob"
        onSuggestStudySession={onSuggestStudySession}
        suggestionState="idle"
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Suggest a Study Session' }));
    expect(onSuggestStudySession).toHaveBeenCalled();
  });

  it('renders mutual connections text and activity sparkline dots', () => {
    render(
      <CompatibilityScore
        viewedSummary={viewedSummary}
        currentUserSummary={currentUserSummary}
        sharedModuleCount={1}
        totalModuleCount={2}
        viewedUsername="bob"
        mutualConnections={{ count: 3, users: [{ id: 1, username: 'ann' }] }}
        activitySparkline={[
          { date: '2026-03-12', level: 0 },
          { date: '2026-03-13', level: 1 },
          { date: '2026-03-14', level: 2 },
          { date: '2026-03-15', level: 3 },
          { date: '2026-03-16', level: 4 },
          { date: '2026-03-17', level: 2 },
          { date: '2026-03-18', level: 1 },
        ]}
      />
    );
    expect(screen.getByText('Study momentum')).toBeTruthy();
    expect(document.querySelectorAll('[class*="sparkDot"]').length).toBeGreaterThan(0);
  });
});
