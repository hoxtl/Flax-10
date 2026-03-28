import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyStateCard from '../../../../pages/homepage/components/EmptyStateCard';

describe('EmptyStateCard', () => {
    it('renders default message', () => {
        render(<EmptyStateCard />);
        expect(screen.getByText("All caught up. You've earned your rest.")).toBeTruthy();
    });

    it('renders default sub message', () => {
        render(<EmptyStateCard />);
        expect(screen.getByText('No overdue or due-soon tasks.')).toBeTruthy();
    });

    it('renders custom message', () => {
        render(<EmptyStateCard message="No events today!" />);
        expect(screen.getByText('No events today!')).toBeTruthy();
    });

    it('renders custom sub message', () => {
        render(<EmptyStateCard sub="Everything is done." />);
        expect(screen.getByText('Everything is done.')).toBeTruthy();
    });

    it('renders action when provided', () => {
        render(<EmptyStateCard action={<button>Add Task</button>} />);
        expect(screen.getByText('Add Task')).toBeTruthy();
    });

    it('does not render action area when action is not provided', () => {
        render(<EmptyStateCard />);
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('does not render sub when sub is empty string', () => {
        const { container } = render(<EmptyStateCard sub="" />);
        // sub is falsy so not rendered
        expect(container.querySelectorAll('p').length).toBe(1);
    });

    it('renders SVG icon', () => {
        const { container } = render(<EmptyStateCard />);
        expect(container.querySelector('svg')).toBeTruthy();
    });
});
