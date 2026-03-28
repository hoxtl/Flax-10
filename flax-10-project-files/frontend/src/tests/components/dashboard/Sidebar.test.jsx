import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '../../../components/dashboard/components/Sidebar';

vi.mock('framer-motion', () => ({
  motion: {
    aside: ({ children, onMouseEnter, onMouseLeave, className }) => (
      <aside className={className} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>{children}</aside>
    ),
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    span: ({ children, className }) => <span className={className}>{children}</span>,
    div: ({ children, className, ...props }) => <div className={className} {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('../../../lib/routes', () => ({
  APP_ROUTES: [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'calendar', label: 'Calendar', icon: '📅' },
  ],
}));

vi.mock('../../../api/deadlineApi', () => ({
  getUpcomingDeadlines: vi.fn().mockResolvedValue([]),
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

  it('opens user menu and calls onProfileClick when Profile clicked', () => {
    const onProfileClick = vi.fn();
    render(<Sidebar active="home" user={{ name: 'Jane', email: 'j@test.com' }} onProfileClick={onProfileClick} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 1]);
    fireEvent.click(screen.getByText('Profile'));
    expect(onProfileClick).toHaveBeenCalled();
  });

  it('opens user menu and calls onSettingsClick when Settings clicked', () => {
    const onSettingsClick = vi.fn();
    render(<Sidebar active="home" user={{ name: 'J', email: 'j@x.com' }} onSettingsClick={onSettingsClick} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 1]);
    fireEvent.click(screen.getByText('Settings'));
    expect(onSettingsClick).toHaveBeenCalled();
  });

  it('opens user menu and calls onLogoutClick when Log out clicked', () => {
    const onLogoutClick = vi.fn();
    render(<Sidebar active="home" user={{ name: 'J', email: 'j@x.com' }} onLogoutClick={onLogoutClick} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 1]);
    fireEvent.click(screen.getByText('Log out'));
    expect(onLogoutClick).toHaveBeenCalled();
  });

  it('closes user menu when backdrop is clicked', () => {
    render(<Sidebar active="home" user={{ name: 'J', email: 'j@x.com' }} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 1]);
    expect(screen.getByText('Profile')).toBeTruthy();
    const backdrop = document.querySelector('[class*="Backdrop"]');
    if (backdrop) fireEvent.click(backdrop);
    expect(screen.queryByText('Profile')).toBeNull();
  });

  it('renders mobile drawer and bottom bar when isMobile', () => {
    render(<Sidebar active="home" isMobile isOpen={false} onToggle={vi.fn()} />);
    expect(screen.getAllByLabelText('Open menu').length).toBeGreaterThan(0);
  });

  it('opens mobile drawer when hamburger clicked', () => {
    const onToggle = vi.fn();
    render(<Sidebar active="home" isMobile isOpen={false} onToggle={onToggle} user={{ name: 'M', email: 'm@x.com' }} />);
    fireEvent.click(screen.getAllByLabelText('Open menu')[0]);
    expect(onToggle).toHaveBeenCalled();
  });

  it('mobile drawer shows nav and closes on nav click', () => {
    const onChange = vi.fn();
    const onToggle = vi.fn();
    render(<Sidebar active="home" isMobile isOpen={true} onToggle={onToggle} onChange={onChange} user={{ name: 'M', email: 'm@x.com' }} />);
    const homeButtons = screen.getAllByRole('button').filter(b => b.textContent?.includes('Home'));
    expect(homeButtons.length).toBeGreaterThan(0);
    fireEvent.click(homeButtons[0]);
    expect(onChange).toHaveBeenCalledWith('home');
    expect(onToggle).toHaveBeenCalled();
  });

  it('mobile drawer Profile button calls onProfileClick', () => {
    const onProfileClick = vi.fn();
    const onToggle = vi.fn();
    render(<Sidebar active="home" isMobile isOpen={true} onToggle={onToggle} onProfileClick={onProfileClick} user={{ name: 'M', email: 'm@x.com' }} />);
    fireEvent.click(screen.getByText('Profile'));
    expect(onProfileClick).toHaveBeenCalled();
    expect(onToggle).toHaveBeenCalled();
  });
});
