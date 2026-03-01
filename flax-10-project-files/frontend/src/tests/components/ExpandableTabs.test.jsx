import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExpandableTabs } from '../../components/Dashboard/ExpandableTabs';

vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, className }) => <button onClick={onClick} className={className}>{children}</button>,
    span: ({ children, className }) => <span className={className}>{children}</span>,
    div: ({ children, className }) => <div className={className}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

const IconA = () => <svg data-testid="icon-a" />;
const IconB = () => <svg data-testid="icon-b" />;

const tabs = [
  { title: 'Alpha', icon: IconA },
  { type: 'separator' },
  { title: 'Beta', icon: IconB },
];

describe('ExpandableTabs', () => {
  it('renders tabs and separator', () => {
    render(<ExpandableTabs tabs={tabs} />);
    expect(screen.getByTestId('icon-a')).toBeTruthy();
    expect(screen.getByTestId('icon-b')).toBeTruthy();
  });

  it('calls onChange when tab is clicked', () => {
    const onChange = vi.fn();
    render(<ExpandableTabs tabs={tabs} onChange={onChange} />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('toggles off when same tab clicked twice', () => {
    const onChange = vi.fn();
    render(<ExpandableTabs tabs={tabs} onChange={onChange} />);
    const btn = screen.getAllByRole('button')[0];
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('deselects on outside click', () => {
    const onChange = vi.fn();
    render(<ExpandableTabs tabs={tabs} onChange={onChange} />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.mouseDown(document.body);
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('works without onChange prop', () => {
    expect(() => {
      render(<ExpandableTabs tabs={tabs} />);
      fireEvent.click(screen.getAllByRole('button')[0]);
    }).not.toThrow();
  });

  it('shows tab label when selected', () => {
    render(<ExpandableTabs tabs={tabs} />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(screen.getByText('Alpha')).toBeTruthy();
  });

  it('does not deselect when clicking inside the container', () => {
    const onChange = vi.fn();
    const { container } = render(<ExpandableTabs tabs={tabs} onChange={onChange} />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    onChange.mockClear();
    fireEvent.mouseDown(container.firstChild);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders badge when count is positive', () => {
    const tabsWithBadge = [{ title: 'Alpha', icon: IconA, badge: 5 }];
    render(<ExpandableTabs tabs={tabsWithBadge} />);
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('renders 99+ badge when count exceeds 99', () => {
    const tabsWithBadge = [{ title: 'Alpha', icon: IconA, badge: 100 }];
    render(<ExpandableTabs tabs={tabsWithBadge} />);
    expect(screen.getByText('99+')).toBeTruthy();
  });

  it('renders no badge when count is zero', () => {
    const tabsWithBadge = [{ title: 'Alpha', icon: IconA, badge: 0 }];
    const { container } = render(<ExpandableTabs tabs={tabsWithBadge} />);
    expect(container.querySelector('[class*="badge"]')).toBeNull();
  });
});