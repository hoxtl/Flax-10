import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AchievementsModal from '../../../../pages/profile/components/AchievementsModal';

describe('AchievementsModal', () => {
    const onClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders Achievements title', () => {
        render(<AchievementsModal badges={[]} onClose={onClose} />);
        expect(screen.getByText('Achievements')).toBeTruthy();
    });

    it('shows 0 / N unlocked when no badges', () => {
        render(<AchievementsModal badges={[]} onClose={onClose} />);
        expect(screen.getByText(/0 \/ \d+ unlocked/)).toBeTruthy();
    });

    it('shows earned badge count', () => {
        const badges = [{ id: '1hr' }, { id: 'sessions_1' }];
        render(<AchievementsModal badges={badges} onClose={onClose} />);
        expect(screen.getByText(/2 \/ \d+ unlocked/)).toBeTruthy();
    });

    it('renders all category sections', () => {
        render(<AchievementsModal badges={[]} onClose={onClose} />);
        expect(screen.getByText('Hours')).toBeTruthy();
        expect(screen.getByText('Sessions')).toBeTruthy();
        expect(screen.getByText('Streaks')).toBeTruthy();
        expect(screen.getByText('Consistency')).toBeTruthy();
        expect(screen.getByText('Style')).toBeTruthy();
        expect(screen.getByText('Modules')).toBeTruthy();
        expect(screen.getByText('Goals')).toBeTruthy();
    });

    it('renders First Hour badge (locked)', () => {
        render(<AchievementsModal badges={[]} onClose={onClose} />);
        expect(screen.getByText('First Hour')).toBeTruthy();
    });

    it('shows earned badge with tier label', () => {
        const badges = [{ id: '1hr' }];
        render(<AchievementsModal badges={badges} onClose={onClose} />);
        expect(screen.getByText('🥉 Bronze')).toBeTruthy();
    });

    it('shows gold tier for gold badges', () => {
        const badges = [{ id: '100hr' }];
        render(<AchievementsModal badges={badges} onClose={onClose} />);
        expect(screen.getByText('🥇 Gold')).toBeTruthy();
    });

    it('shows silver tier for silver badges', () => {
        const badges = [{ id: 'sessions_50' }];
        render(<AchievementsModal badges={badges} onClose={onClose} />);
        expect(screen.getByText('🥈 Silver')).toBeTruthy();
    });

    it('calls onClose when close button clicked', () => {
        render(<AchievementsModal badges={[]} onClose={onClose} />);
        fireEvent.click(screen.getByLabelText('Close'));
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onClose when Escape key pressed', () => {
        render(<AchievementsModal badges={[]} onClose={onClose} />);
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onClose when clicking overlay background', () => {
        render(<AchievementsModal badges={[]} onClose={onClose} />);
        const overlay = document.querySelector('[class*="backdrop"]');
        fireEvent.mouseDown(overlay);
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('shows category earned count', () => {
        const badges = [{ id: '1hr' }, { id: '10hr' }];
        render(<AchievementsModal badges={badges} onClose={onClose} />);
        // Hours category should show 2/6
        expect(screen.getByText('2/6')).toBeTruthy();
    });

    it('shows locked description for unearned badges', () => {
        render(<AchievementsModal badges={[]} onClose={onClose} />);
        expect(screen.getByText('Study for 1 hour total')).toBeTruthy();
    });

    it('handles null badges prop', () => {
        render(<AchievementsModal badges={null} onClose={onClose} />);
        expect(screen.getByText('Achievements')).toBeTruthy();
        expect(screen.getByText(/0 \/ \d+ unlocked/)).toBeTruthy();
    });

    it('shows lock icon for unearned badges', () => {
        render(<AchievementsModal badges={[]} onClose={onClose} />);
        const lockIcons = screen.getAllByText('🔒');
        expect(lockIcons.length).toBeGreaterThan(0);
    });

    it('removes keydown listener on unmount', () => {
        const { unmount } = render(<AchievementsModal badges={[]} onClose={onClose} />);
        unmount();
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledTimes(0);
    });
});
