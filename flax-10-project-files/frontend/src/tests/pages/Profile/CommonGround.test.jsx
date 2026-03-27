/* Tests for CommonGroundSection widget */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommonGroundSection } from '../../../pages/profile/components/widgets/CommonGround';

vi.mock('../../../components/common/Card/Card', () => ({
  default: ({ children, className }) => <div className={className} data-testid="card">{children}</div>,
}));

vi.mock('../../../pages/profile/components/widgets/ProfileCompat.module.css', () => ({
  default: {},
}), { virtual: true });

describe('CommonGroundSection', () => {
  const viewedModules = ['CS101', 'MA202', 'PH301'];
  const currentUserModules = ['CS101', 'MA202', 'BIO100'];
  const viewedSocieties = [
    { id: 's1', name: 'Chess Club' },
    { id: 's2', name: 'Music Society' },
  ];
  const currentUserSocieties = [
    { id: 's1', name: 'Chess Club' },
    { id: 's3', name: 'Drama Club' },
  ];

  it('renders null when no shared or other modules/societies', () => {
    const { container } = render(
      <CommonGroundSection
        viewedModules={[]}
        viewedSocieties={[]}
        currentUserModules={[]}
        currentUserSocieties={[]}
        onNavigate={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders module and society cards when data exists', () => {
    render(
      <CommonGroundSection
        viewedModules={viewedModules}
        viewedSocieties={viewedSocieties}
        currentUserModules={currentUserModules}
        currentUserSocieties={currentUserSocieties}
        onNavigate={vi.fn()}
      />
    );
    expect(screen.getByText('Common Ground')).toBeInTheDocument();
    expect(screen.getByText('Modules')).toBeInTheDocument();
    expect(screen.getByText('Societies')).toBeInTheDocument();
  });

  it('shows shared module pills', () => {
    render(
      <CommonGroundSection
        viewedModules={viewedModules}
        viewedSocieties={[]}
        currentUserModules={currentUserModules}
        currentUserSocieties={[]}
        onNavigate={vi.fn()}
      />
    );
    expect(screen.getByText('CS101')).toBeInTheDocument();
    expect(screen.getByText('MA202')).toBeInTheDocument();
    expect(screen.getByText('PH301')).toBeInTheDocument();
  });

  it('calls onNavigate with module key when module pill clicked', () => {
    const onNavigate = vi.fn();
    render(
      <CommonGroundSection
        viewedModules={['CS101']}
        viewedSocieties={[]}
        currentUserModules={['CS101']}
        currentUserSocieties={[]}
        onNavigate={onNavigate}
      />
    );
    fireEvent.click(screen.getByText('CS101'));
    expect(onNavigate).toHaveBeenCalledWith('modules_CS101');
  });

  it('shows society pills and calls onNavigate when clicked', () => {
    const onNavigate = vi.fn();
    render(
      <CommonGroundSection
        viewedModules={[]}
        viewedSocieties={viewedSocieties}
        currentUserModules={[]}
        currentUserSocieties={currentUserSocieties}
        onNavigate={onNavigate}
      />
    );
    fireEvent.click(screen.getByText('Chess Club'));
    expect(onNavigate).toHaveBeenCalledWith('/societies?id=s1');
  });

  it('handles null props gracefully', () => {
    const { container } = render(
      <CommonGroundSection
        viewedModules={null}
        viewedSocieties={null}
        currentUserModules={null}
        currentUserSocieties={null}
        onNavigate={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows only modules card when no societies', () => {
    render(
      <CommonGroundSection
        viewedModules={['CS101']}
        viewedSocieties={[]}
        currentUserModules={[]}
        currentUserSocieties={[]}
        onNavigate={vi.fn()}
      />
    );
    expect(screen.getByText('Modules')).toBeInTheDocument();
    expect(screen.queryByText('Societies')).toBeNull();
  });

  it('shows only societies card when no modules', () => {
    render(
      <CommonGroundSection
        viewedModules={[]}
        viewedSocieties={[{ id: 'x1', name: 'Art Club' }]}
        currentUserModules={[]}
        currentUserSocieties={[]}
        onNavigate={vi.fn()}
      />
    );
    expect(screen.getByText('Societies')).toBeInTheDocument();
    expect(screen.queryByText('Modules')).toBeNull();
  });

  it('displays "in common" unit label', () => {
    render(
      <CommonGroundSection
        viewedModules={['CS101']}
        viewedSocieties={[{ id: 's1', name: 'Chess Club' }]}
        currentUserModules={['CS101']}
        currentUserSocieties={[{ id: 's1', name: 'Chess Club' }]}
        onNavigate={vi.fn()}
      />
    );
    const inCommonLabels = screen.getAllByText('in common');
    expect(inCommonLabels.length).toBeGreaterThan(0);
  });

  it('works without onNavigate prop', () => {
    render(
      <CommonGroundSection
        viewedModules={['CS101']}
        viewedSocieties={[]}
        currentUserModules={['CS101']}
        currentUserSocieties={[]}
      />
    );
    // Should not throw when clicking without onNavigate
    fireEvent.click(screen.getByText('CS101'));
  });

  it('shows shared count value for modules', () => {
    render(
      <CommonGroundSection
        viewedModules={['CS101', 'MA202']}
        viewedSocieties={[]}
        currentUserModules={['CS101', 'MA202']}
        currentUserSocieties={[]}
        onNavigate={vi.fn()}
      />
    );
    // value=2 for shared modules
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows other society pills (not shared)', () => {
    const onNavigate = vi.fn();
    render(
      <CommonGroundSection
        viewedModules={[]}
        viewedSocieties={[{ id: 's2', name: 'Music Society' }]}
        currentUserModules={[]}
        currentUserSocieties={[{ id: 's1', name: 'Chess Club' }]}
        onNavigate={onNavigate}
      />
    );
    fireEvent.click(screen.getByText('Music Society'));
    expect(onNavigate).toHaveBeenCalledWith('/societies?id=s2');
  });

  it('treats missing current-user collections as empty lists', () => {
    render(
      <CommonGroundSection
        viewedModules={['CS101']}
        viewedSocieties={[{ id: 's4', name: 'Debate Society' }]}
        currentUserModules={undefined}
        currentUserSocieties={undefined}
        onNavigate={vi.fn()}
      />
    );

    expect(screen.getByText('CS101')).toBeInTheDocument();
    expect(screen.getByText('Debate Society')).toBeInTheDocument();
  });
});
