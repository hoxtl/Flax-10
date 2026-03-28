import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchEmptyState from '../../../../components/common/search_empty_state/SearchEmptyState';

vi.mock('../../../../components/common/primary_button/PrimaryButton', () => ({
  default: ({ children, onClick, ...props }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

vi.mock('lucide-react', () => ({
  Search: ({ size, ...props }) => <svg data-testid="search-icon" {...props} />,
}));

describe('SearchEmptyState', () => {
  it('shows default title with item label when no query', () => {
    render(<SearchEmptyState itemLabel="tasks" />);
    expect(screen.getByText('No tasks found')).toBeInTheDocument();
  });

  it('shows query-based title when query is provided', () => {
    render(<SearchEmptyState query="homework" itemLabel="tasks" />);
    expect(screen.getByText('No tasks match "homework"')).toBeInTheDocument();
  });

  it('shows custom title when provided', () => {
    render(<SearchEmptyState title="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('renders default hint text', () => {
    render(<SearchEmptyState />);
    expect(screen.getByText(/Try a different keyword/)).toBeInTheDocument();
  });

  it('renders custom hint text', () => {
    render(<SearchEmptyState hint="Try searching by name." />);
    expect(screen.getByText('Try searching by name.')).toBeInTheDocument();
  });

  it('renders default search icon', () => {
    render(<SearchEmptyState />);
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  it('renders custom icon when provided', () => {
    render(<SearchEmptyState icon={<span data-testid="custom-icon">🔍</span>} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('does not render icon when icon is null', () => {
    render(<SearchEmptyState icon={null} />);
    expect(screen.queryByTestId('search-icon')).not.toBeInTheDocument();
  });

  it('shows clear button when query is active and onClear is provided', () => {
    const onClear = vi.fn();
    render(<SearchEmptyState query="test" onClear={onClear} />);
    fireEvent.click(screen.getByRole('button', { name: /clear search/i }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('shows clear button with alwaysShowClear even without query', () => {
    const onClear = vi.fn();
    render(<SearchEmptyState onClear={onClear} alwaysShowClear />);
    expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument();
  });

  it('hides clear button when query is empty and alwaysShowClear is false', () => {
    render(<SearchEmptyState onClear={vi.fn()} query="" />);
    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument();
  });

  it('hides clear button when onClear is not provided', () => {
    render(<SearchEmptyState query="test" />);
    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument();
  });

  it('renders custom clearLabel', () => {
    render(<SearchEmptyState query="x" onClear={vi.fn()} clearLabel="Reset" />);
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('applies extra className props', () => {
    const { container } = render(
      <SearchEmptyState className="outer" titleClassName="t-class" hintClassName="h-class" iconClassName="i-class" />
    );
    expect(container.firstChild.className).toContain('outer');
  });
});
