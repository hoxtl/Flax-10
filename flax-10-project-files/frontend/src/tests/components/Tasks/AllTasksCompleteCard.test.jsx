/* Tests for AllTasksCompleteCard component rendering and interactions */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AllTasksCompleteCard from '../../../pages/Tasks/components/AllTasksCompleteCard';

describe('AllTasksCompleteCard', () => {
    it('renders message text', () => {
        render(<AllTasksCompleteCard message="All done!" />);
        expect(screen.getByText('All done!')).toBeTruthy();
    });

    it('renders default emoji', () => {
        render(<AllTasksCompleteCard message="Done" />);
        expect(screen.getByText('🎉')).toBeTruthy();
    });

    it('renders custom emoji', () => {
        render(<AllTasksCompleteCard emoji="✅" message="Done" />);
        expect(screen.getByText('✅')).toBeTruthy();
    });

    it('renders sub message when provided', () => {
        render(<AllTasksCompleteCard message="Done" sub="Keep it up!" />);
        expect(screen.getByText('Keep it up!')).toBeTruthy();
    });

    it('does not render sub when not provided', () => {
        render(<AllTasksCompleteCard message="Done" />);
        expect(screen.queryByText('Keep it up!')).toBeNull();
    });

    it('renders CTA button when ctaLabel and onCtaClick are provided', () => {
        const onCtaClick = vi.fn();
        render(<AllTasksCompleteCard message="Done" ctaLabel="Add Task" onCtaClick={onCtaClick} />);
        expect(screen.getByRole('button', { name: 'Add Task' })).toBeTruthy();
    });

    it('calls onCtaClick when button is clicked', () => {
        const onCtaClick = vi.fn();
        render(<AllTasksCompleteCard message="Done" ctaLabel="Add Task" onCtaClick={onCtaClick} />);
        fireEvent.click(screen.getByRole('button'));
        expect(onCtaClick).toHaveBeenCalledTimes(1);
    });

    it('does not render CTA button without ctaLabel', () => {
        render(<AllTasksCompleteCard message="Done" onCtaClick={vi.fn()} />);
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('does not render CTA button without onCtaClick function', () => {
        render(<AllTasksCompleteCard message="Done" ctaLabel="Add" />);
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('renders children when no button is present', () => {
        render(
            <AllTasksCompleteCard message="Done">
                <span>Custom child</span>
            </AllTasksCompleteCard>
        );
        expect(screen.getByText('Custom child')).toBeTruthy();
    });

    it('does not render children when button is present', () => {
        render(
            <AllTasksCompleteCard message="Done" ctaLabel="Click" onCtaClick={vi.fn()}>
                <span>Hidden child</span>
            </AllTasksCompleteCard>
        );
        // Children are rendered only when hasButton is false
        expect(screen.queryByText('Hidden child')).toBeNull();
    });
});
