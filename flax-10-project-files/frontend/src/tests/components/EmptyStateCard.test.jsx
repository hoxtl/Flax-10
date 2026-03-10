import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyStateCard from '../../components/EmptyStateCard';

describe('EmptyStateCard (root)', () => {
  it('renders default message with trimmed displayName and default subtext', () => {
    render(<EmptyStateCard displayName="  Jane  " />);
    expect(screen.getByText(/The garden is at peace/i)).toHaveTextContent('Jane');
    expect(screen.getByText('No overdue or due-soon tasks.')).toBeInTheDocument();
  });

  it('falls back to friend and supports custom message/action and hidden subtext', () => {
    render(
      <EmptyStateCard
        displayName=""
        message="Custom message"
        sub=""
        action={<button>Take action</button>}
      />
    );
    expect(screen.getByText('Custom message')).toBeInTheDocument();
    expect(screen.queryByText('No overdue or due-soon tasks.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Take action' })).toBeInTheDocument();
  });
});
