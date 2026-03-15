import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Tabs from '../../../components/common/Tabs/Tabs';

vi.mock('../../../components/common/Tabs/Tabs.module.css', () => ({ default: { container: 'container', tabBar: 'tabBar', tab: 'tab', active: 'active', content: 'content' } }));

describe('Tabs', () => {
  it('returns null when tabs is empty or null', () => {
    const { container } = render(<Tabs tabs={[]} activeTab="a" onTabChange={vi.fn()} />);
    expect(container.firstChild).toBeNull();
    const { container: c2 } = render(<Tabs tabs={null} activeTab="a" onTabChange={vi.fn()} />);
    expect(c2.firstChild).toBeNull();
  });

  it('renders tab buttons and content', () => {
    const tabs = [
      { id: 'one', label: 'One', content: <span>Content One</span> },
      { id: 'two', label: 'Two', content: <span>Content Two</span> },
    ];
    render(<Tabs tabs={tabs} activeTab="one" onTabChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'One' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Two' })).toBeInTheDocument();
    expect(screen.getByText('Content One')).toBeInTheDocument();
  });

  it('calls onTabChange when tab clicked', () => {
    const onTabChange = vi.fn();
    const tabs = [{ id: 'a', label: 'Tab A', content: <div>A</div> }, { id: 'b', label: 'Tab B', content: <div>B</div> }];
    render(<Tabs tabs={tabs} activeTab="a" onTabChange={onTabChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tab B' }));
    expect(onTabChange).toHaveBeenCalledWith('b');
  });

  it('shows content for activeTab only', () => {
    const tabs = [{ id: 'x', label: 'X', content: <span>X content</span> }, { id: 'y', label: 'Y', content: <span>Y content</span> }];
    render(<Tabs tabs={tabs} activeTab="y" onTabChange={vi.fn()} />);
    expect(screen.getByText('Y content')).toBeInTheDocument();
    expect(screen.queryByText('X content')).not.toBeInTheDocument();
  });
});
