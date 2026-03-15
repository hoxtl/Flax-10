/**
 * Tests for ProfileWidgets components (PersonaCard, StudyDNA, MiniHeatmap, ThisWeek, BadgesSection, ModulesSection, SocietiesSection).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  PersonaCard,
  StudyDNA,
  MiniHeatmap,
  ThisWeek,
  BadgesSection,
  ModulesSection,
  SocietiesSection,
} from '../../../../pages/Profile/components/ProfileWidgets';

vi.mock('../../../../api/moduleApi', () => ({
  getModules: vi.fn().mockResolvedValue([
    { module_code: 'CS101', module_name: 'Intro to CS' },
    { module_code: 'MA102', module_name: 'Calculus' },
  ]),
}));

describe('PersonaCard', () => {
  it('returns null when persona is null', () => {
    const { container } = render(<PersonaCard persona={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders persona label and description', () => {
    render(
      <PersonaCard
        persona={{ label: 'Night Owl', emoji: '🦉', description: 'You study best at night.' }}
      />
    );
    expect(screen.getByText('Night Owl')).toBeTruthy();
    expect(screen.getByText('You study best at night.')).toBeTruthy();
  });

  it('renders peak label with am when peakHour < 12', () => {
    render(
      <PersonaCard
        persona={{ label: 'Early Bird', emoji: '🐦', description: 'Morning person.' }}
        peakHour={9}
      />
    );
    expect(screen.getByText(/Based on your 9am peak/)).toBeTruthy();
  });

  it('renders peak label with pm when peakHour >= 12', () => {
    render(
      <PersonaCard
        persona={{ label: 'Night Owl', emoji: '🦉', description: 'Late night.' }}
        peakHour={14}
      />
    );
    expect(screen.getByText(/Based on your 2pm peak/)).toBeTruthy();
  });

  it('renders peak label with 12pm when peakHour is 12', () => {
    render(
      <PersonaCard
        persona={{ label: 'Noon', emoji: '☀️', description: 'Midday.' }}
        peakHour={12}
      />
    );
    expect(screen.getByText(/Based on your 12pm peak/)).toBeTruthy();
  });

  it('does not render peak label when peakHour is null', () => {
    render(
      <PersonaCard
        persona={{ label: 'Unknown', emoji: '❓', description: 'No data.' }}
        peakHour={null}
      />
    );
    expect(screen.queryByText(/Based on your/)).toBeNull();
  });
});

describe('StudyDNA', () => {
  it('returns null when heatmap is missing', () => {
    const { container } = render(<StudyDNA />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when heatmap.data is missing', () => {
    const { container } = render(<StudyDNA heatmap={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders segments and legend with mixed period data', () => {
    // Data that yields morning (5-12), afternoon (12-17), evening (17-21), night (21-5) totals
    const heatmap = {
      data: Array.from({ length: 7 }, (_, day) =>
        Array.from({ length: 24 }, (_, h) => {
          if (h >= 5 && h < 12) return 60;
          if (h >= 12 && h < 17) return 30;
          if (h >= 17 && h < 21) return 45;
          return 15;
        })
      ),
    };
    render(<StudyDNA heatmap={heatmap} />);
    expect(screen.getByText('STUDY DNA')).toBeTruthy();
    expect(screen.getByText('Morning')).toBeTruthy();
    expect(screen.getByText('Afternoon')).toBeTruthy();
    expect(screen.getByText('Evening')).toBeTruthy();
    expect(screen.getByText('Night')).toBeTruthy();
  });
});

describe('MiniHeatmap', () => {
  it('returns null when heatmap.data is missing', () => {
    const { container } = render(<MiniHeatmap heatmap={{}} onNavigate={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders and calls onNavigate on click', () => {
    const onNavigate = vi.fn();
    const heatmap = { data: Array.from({ length: 7 }, () => Array(24).fill(0)) };
    render(<MiniHeatmap heatmap={heatmap} onNavigate={onNavigate} />);
    expect(screen.getByText('STUDY ACTIVITY')).toBeTruthy();
    expect(screen.getByText('View full analytics')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /View full analytics|STUDY ACTIVITY/ }));
    expect(onNavigate).toHaveBeenCalledWith('analytics');
  });

  it('calls onNavigate on Enter key', () => {
    const onNavigate = vi.fn();
    const heatmap = { data: Array.from({ length: 7 }, () => Array(24).fill(0)) };
    render(<MiniHeatmap heatmap={heatmap} onNavigate={onNavigate} />);
    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onNavigate).toHaveBeenCalledWith('analytics');
  });

  it('calls onNavigate on Space key', () => {
    const onNavigate = vi.fn();
    const heatmap = { data: Array.from({ length: 7 }, () => Array(24).fill(0)) };
    render(<MiniHeatmap heatmap={heatmap} onNavigate={onNavigate} />);
    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: ' ' });
    expect(onNavigate).toHaveBeenCalledWith('analytics');
  });
});

describe('ThisWeek', () => {
  it('returns null when weekly is missing', () => {
    const { container } = render(<ThisWeek onGoalSave={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders weekly ring and streak display', () => {
    render(
      <ThisWeek
        weekly={{ percentage: 50, hours_studied: 10, goal_hours: 20 }}
        streaks={{ current: 3, longest: 7 }}
        onGoalSave={vi.fn()}
      />
    );
    expect(screen.getByText('THIS WEEK')).toBeTruthy();
    expect(screen.getByText(/10h/)).toBeTruthy();
    expect(screen.getByText(/20h/)).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
  });

  it('shows streak fallback when streaks missing', () => {
    render(
      <ThisWeek
        weekly={{ percentage: 0, hours_studied: 0, goal_hours: 10 }}
        onGoalSave={vi.fn()}
      />
    );
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('opens goal editor and saves', async () => {
    const onGoalSave = vi.fn();
    render(
      <ThisWeek
        weekly={{ percentage: 25, hours_studied: 5, goal_hours: 20 }}
        onGoalSave={onGoalSave}
      />
    );
    const ringBtn = screen.getByRole('button', { name: /5h\/20h/ });
    fireEvent.click(ringBtn);
    expect(screen.getByText('tap to close')).toBeTruthy();
    const saveBtn = screen.getByRole('button', { name: 'Save goal' });
    fireEvent.click(saveBtn);
    expect(onGoalSave).toHaveBeenCalledWith(20);
  });

  it('goal editor slider updates temp goal and Cancel closes editor', () => {
    render(
      <ThisWeek
        weekly={{ percentage: 25, hours_studied: 5, goal_hours: 20 }}
        onGoalSave={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /5h\/20h/ }));
    const slider = document.querySelector('input[type="range"]');
    expect(slider).toBeTruthy();
    fireEvent.change(slider, { target: { value: '15' } });
    expect(screen.getByText('15h / week')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('tap to close')).toBeNull();
    expect(screen.getByText('tap to edit goal')).toBeTruthy();
  });

  it('goal ring shows green when percentage >= 100', () => {
    render(
      <ThisWeek
        weekly={{ percentage: 100, hours_studied: 20, goal_hours: 20 }}
        onGoalSave={vi.fn()}
      />
    );
    const ring = document.querySelector('circle[stroke="#4CAF50"]');
    expect(ring).toBeTruthy();
  });
});

describe('BadgesSection', () => {
  it('renders badge count and grid', () => {
    const badges = [
      { id: 1, tier: 'gold', label: 'Focus', emoji: '🏅', description: 'd1' },
      { id: 2, tier: 'silver', label: 'Streak', emoji: '🔥', description: 'd2' },
      { id: 3, tier: 'bronze', label: 'First', emoji: '⭐', description: 'd3' },
    ];
    const onOpen = vi.fn();
    render(<BadgesSection badges={badges} onOpen={onOpen} />);
    expect(screen.getByText('ACHIEVEMENTS')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('/ 26 unlocked')).toBeTruthy();
    expect(screen.getByText('View all →')).toBeTruthy();
    fireEvent.click(screen.getByText('ACHIEVEMENTS'));
    expect(onOpen).toHaveBeenCalled();
  });

  it('uses fallback tier when tier unknown', () => {
    render(
      <BadgesSection
        badges={[{ id: 1, tier: 'unknown', label: 'X', emoji: '❓', description: 'd' }]}
        onOpen={vi.fn()}
      />
    );
    expect(screen.getByText('X')).toBeTruthy();
  });

  it('shows 0 when badges empty', () => {
    render(<BadgesSection badges={[]} onOpen={vi.fn()} />);
    expect(screen.getByText('0')).toBeTruthy();
  });
});

describe('ModulesSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when modules is empty', async () => {
    const { container } = render(<ModulesSection modules={[]} />);
    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  it('returns null when modules is undefined', async () => {
    const { container } = render(<ModulesSection />);
    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  it('shows empty teacher state when no taught modules yet', async () => {
    render(<ModulesSection modules={[]} role="teacher" onNavigate={vi.fn()} />);
    await screen.findByText('MODULES I TEACH');
    expect(screen.getByText('No teaching modules assigned yet.')).toBeTruthy();
  });

  it('renders module codes and names from API', async () => {
    const { getModules } = await import('../../../../api/moduleApi');
    getModules.mockResolvedValue([
      { module_code: 'CS101', module_name: 'Intro to CS' },
    ]);
    render(<ModulesSection modules={['CS101']} onNavigate={vi.fn()} />);
    await screen.findByText('Intro to CS');
    expect(screen.getByText('CS101')).toBeTruthy();
    expect(screen.getByText('Intro to CS')).toBeTruthy();
  });

  it('calls onNavigate with modules_ code when module card clicked', async () => {
    const onNavigate = vi.fn();
    render(<ModulesSection modules={['MA102']} onNavigate={onNavigate} />);
    await screen.findByText('MODULES');
    fireEvent.click(screen.getByText('MA102'));
    expect(onNavigate).toHaveBeenCalledWith('modules_MA102');
  });

  it('uses teacher heading for professor profiles', async () => {
    render(<ModulesSection modules={['EC4202']} role="teacher" onNavigate={vi.fn()} />);
    await screen.findByText('MODULES I TEACH');
    expect(screen.getByText('EC4202')).toBeTruthy();
  });

  it('handles getModules returning results array', async () => {
    const { getModules } = await import('../../../../api/moduleApi');
    getModules.mockResolvedValue({ results: [{ module_code: 'XY1', module_name: 'Extra' }] });
    render(<ModulesSection modules={['XY1']} />);
    await screen.findByText('Extra');
    expect(screen.getByText('Extra')).toBeTruthy();
  });

  it('handles getModules reject', async () => {
    const { getModules } = await import('../../../../api/moduleApi');
    getModules.mockRejectedValueOnce(new Error('Network error'));
    render(<ModulesSection modules={['CS101']} />);
    expect(screen.getByText('MODULES')).toBeTruthy();
    expect(screen.getByText('CS101')).toBeTruthy();
  });
});

describe('SocietiesSection', () => {
  it('returns null when societies is empty', () => {
    const { container } = render(<SocietiesSection societies={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when societies is undefined', () => {
    const { container } = render(<SocietiesSection />);
    expect(container.firstChild).toBeNull();
  });

  it('renders society with cover_image', () => {
    render(
      <SocietiesSection
        societies={[{ id: 1, name: 'Tech Soc', cover_image: 'https://example.com/cover.jpg' }]}
        onNavigate={vi.fn()}
      />
    );
    expect(screen.getByText('SOCIETIES JOINED')).toBeTruthy();
    expect(screen.getByText('Tech Soc')).toBeTruthy();
    const img = document.querySelector('img[alt="Tech Soc"]');
    expect(img?.src).toContain('example.com/cover.jpg');
  });

  it('renders society with image fallback when no cover_image', () => {
    render(
      <SocietiesSection
        societies={[{ id: 2, name: 'Art Club' }]}
        onNavigate={vi.fn()}
      />
    );
    expect(screen.getByText('Art Club')).toBeTruthy();
    expect(screen.getByText('A')).toBeTruthy();
  });

  it('uses image when cover_image missing but image present', () => {
    render(
      <SocietiesSection
        societies={[{ id: 3, name: 'Soc', image: 'https://example.com/img.png' }]}
        onNavigate={vi.fn()}
      />
    );
    const img = document.querySelector('img[alt="Soc"]');
    expect(img?.src).toContain('example.com/img.png');
  });

  it('calls onNavigate when society card clicked', () => {
    const onNavigate = vi.fn();
    render(
      <SocietiesSection
        societies={[{ id: 1, name: 'Soc' }]}
        onNavigate={onNavigate}
      />
    );
    fireEvent.click(screen.getByText('Soc'));
    expect(onNavigate).toHaveBeenCalledWith('societies_1');
  });
});
