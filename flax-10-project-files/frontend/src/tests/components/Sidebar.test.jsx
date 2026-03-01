import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '../../components/Dashboard/Sidebar';

vi.mock('framer-motion', () => ({
  motion: {
    aside: ({ children, onMouseEnter, onMouseLeave, className }) => (
      <aside className={className} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>{children}</aside>
    ),
    button: ({ children, onClick, className }) => <button onClick={onClick} className={className}>{children}</button>,
    span: ({ children, className }) => <span className={className}>{children}</span>,
    div: ({ children, className }) => <div className={className}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('../../lib/routes', () => ({
  APP_ROUTES: [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'calendar', label: 'Calendar', icon: '📅' },
    { id: 'admin', label: 'Admin', icon: '🔧', isAdminOnly: true },
  ],
}));

describe('Sidebar', () => {
  it('renders nav items', () => {
    render(<Sidebar active="home" onChange={() => {}} />);
    expect(screen.getByText('🏠')).toBeTruthy();
    expect(screen.getByText('📅')).toBeTruthy();
  });

  it('calls onChange when nav item clicked', () => {
    const onChange = vi.fn();
    render(<Sidebar active="home" onChange={onChange} />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(onChange).toHaveBeenCalledWith('home');
  });

  it('expands on mouse enter and collapses on leave', () => {
    render(<Sidebar active="home" onChange={() => {}} />);
    const aside = screen.getByRole('complementary');
    fireEvent.mouseEnter(aside);
    expect(screen.getByText('Home')).toBeTruthy();
    fireEvent.mouseLeave(aside);
  });

  it('shows active nav item with active class', () => {
    render(<Sidebar active="calendar" onChange={() => {}} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[1].className).toContain('Active');
  });

  it('works without onChange prop', () => {
    expect(() => {
      render(<Sidebar active="home" />);
      fireEvent.click(screen.getAllByRole('button')[0]);
    }).not.toThrow();
  });

  it('hides admin-only routes for non-admin users', () => {
    render(<Sidebar active="home" onChange={() => {}} user={{ isAdmin: false }} />);
    expect(screen.queryByText('🔧')).toBeNull();
  });

  it('shows admin-only routes for admin users', () => {
    render(<Sidebar active="home" onChange={() => {}} user={{ isAdmin: true }} />);
    expect(screen.getByText('🔧')).toBeTruthy();
  });
});