import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SocietiesModal } from '../../../../pages/profile/components/ProfileModals';
describe('SocietiesModal', () => {
  it('renders societies and navigates', () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();
    const socs = [{ id: 1, name: 'Chess', description: 'Play', cover_image: 'c.png' }, { name: 'Mystery' }];
    render(<SocietiesModal isOpen onClose={onClose} societies={socs} onNavigate={onNavigate} />);
    expect(screen.getByText('Societies')).toBeTruthy();
    expect(screen.getByText('Chess')).toBeTruthy();
    expect(screen.getByText('Play')).toBeTruthy();
    expect(screen.getByAltText('Chess').getAttribute('src')).toContain('c.png');
    fireEvent.click(screen.getByText('Chess'));
    expect(onClose).toHaveBeenCalled();
    expect(onNavigate).toHaveBeenCalledWith('/societies?id=1');
  });

  it('navigates to society without id', () => {
    const onNavigate = vi.fn();
    render(<SocietiesModal isOpen onClose={vi.fn()} societies={[{ id: 99, name: 'Mystery' }]} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText('Mystery'));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('uses society_id and image fields', () => {
    const onNavigate = vi.fn();
    const socs = [{ society_id: 22, name: 'Film', image: 'f.png' }];
    render(<SocietiesModal isOpen onClose={vi.fn()} societies={socs} onNavigate={onNavigate} />);
    expect(screen.getByAltText('Film').getAttribute('src')).toContain('f.png');
    fireEvent.click(screen.getByText('Film'));
    expect(onNavigate).toHaveBeenCalledWith('/societies?id=22');
  });

  it('shows the Society Manager pill for admin/editor societies', () => {
    render(<SocietiesModal isOpen onClose={vi.fn()} societies={[{ id: 1, name: 'Chess', role: 'admin' }, { id: 2, name: 'Debate', is_admin: true }, { id: 3, name: 'Drama' }]} onNavigate={vi.fn()} />);
    expect(screen.getAllByText('Society Manager')).toHaveLength(2);
  });
});
