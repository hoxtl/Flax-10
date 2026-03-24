/* Tests for ThisWeek widget – goal ring, editor, streak display */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ThisWeek } from '../../../pages/Profile/components/widgets/ThisWeek';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('../../../components/common/Card/Card', () => ({
  default: ({ children, className, variant }) => (
    <div className={className} data-variant={variant} data-testid="card">{children}</div>
  ),
}));

vi.mock('../../../components/common/PrimaryButton/PrimaryButton', () => ({
  default: ({ children, onClick, disabled, className }) => (
    <button onClick={onClick} disabled={disabled} className={className}>{children}</button>
  ),
}));

vi.mock('../../../pages/Profile/components/widgets/ProfileWidgets.module.css', () => ({ default: {} }), { virtual: true });
vi.mock('../../../pages/Profile/components/widgets/ProfileWeekGoal.module.css', () => ({ default: {} }), { virtual: true });

const weekly = { hours_studied: 10, goal_hours: 20, percentage: 50 };
const streaks = { current: 5, longest: 12 };

describe('ThisWeek', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders null when weekly is null', () => {
    const { container } = render(<ThisWeek weekly={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders THIS WEEK label and ring values', () => {
    render(<ThisWeek weekly={weekly} streaks={streaks} />);
    expect(screen.getByText('THIS WEEK')).toBeInTheDocument();
    expect(screen.getByText('10h')).toBeInTheDocument();
    expect(screen.getByText('/20h')).toBeInTheDocument();
  });

  it('renders streak display when showStreak is true', () => {
    render(<ThisWeek weekly={weekly} streaks={streaks} showStreak={true} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('does not render streak when showStreak is false', () => {
    render(<ThisWeek weekly={weekly} streaks={streaks} showStreak={false} />);
    expect(screen.queryByText('5')).toBeNull();
  });

  it('shows "—" for missing streak values', () => {
    render(<ThisWeek weekly={weekly} streaks={{}} />);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('opens editor on ring button click', () => {
    render(<ThisWeek weekly={weekly} streaks={streaks} />);
    // Initially shows "tap to edit goal"
    expect(screen.getByText('tap to edit goal')).toBeInTheDocument();
    fireEvent.click(screen.getByText('10h'));
    expect(screen.getByText('tap to close')).toBeInTheDocument();
  });

  it('shows weekly target editor with slider', () => {
    render(<ThisWeek weekly={weekly} streaks={streaks} />);
    fireEvent.click(screen.getByText('10h'));
    expect(screen.getByText('Weekly target')).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('cancel button closes editor', () => {
    render(<ThisWeek weekly={weekly} streaks={streaks} />);
    fireEvent.click(screen.getByText('10h'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.getByText('tap to edit goal')).toBeInTheDocument();
  });

  it('slider changes tempGoal value', () => {
    render(<ThisWeek weekly={weekly} streaks={streaks} />);
    fireEvent.click(screen.getByText('10h'));
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '30' } });
    expect(screen.getByText('30h / week')).toBeInTheDocument();
  });

  it('calls onGoalSave and closes editor on save', async () => {
    const onGoalSave = vi.fn().mockResolvedValue(undefined);
    render(<ThisWeek weekly={weekly} streaks={streaks} onGoalSave={onGoalSave} />);
    fireEvent.click(screen.getByText('10h'));
    fireEvent.click(screen.getByText('Save goal'));
    await waitFor(() => expect(onGoalSave).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('tap to edit goal')).toBeInTheDocument());
  });

  it('reverts goal on save error', async () => {
    const onGoalSave = vi.fn().mockRejectedValue(new Error('fail'));
    render(<ThisWeek weekly={weekly} streaks={streaks} onGoalSave={onGoalSave} />);
    fireEvent.click(screen.getByText('10h'));
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '35' } });
    fireEvent.click(screen.getByText('Save goal'));
    await waitFor(() => expect(onGoalSave).toHaveBeenCalled());
    // Editor stays open after error
  });

  it('shows "Saving..." during save', async () => {
    let resolve;
    const onGoalSave = vi.fn(() => new Promise(r => { resolve = r; }));
    render(<ThisWeek weekly={weekly} streaks={streaks} onGoalSave={onGoalSave} />);
    fireEvent.click(screen.getByText('10h'));
    fireEvent.click(screen.getByText('Save goal'));
    await waitFor(() => expect(screen.getByText('Saving...')).toBeInTheDocument());
    act(() => resolve());
  });

  it('uses goal_hours default 20 when not set', () => {
    render(<ThisWeek weekly={{ hours_studied: 5, percentage: 25 }} />);
    expect(screen.getByText('/20h')).toBeInTheDocument();
  });
});
