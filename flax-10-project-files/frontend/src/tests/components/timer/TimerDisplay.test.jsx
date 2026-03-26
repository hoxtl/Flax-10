import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimerDisplay } from '../../../components/Timer/TimerComponents';

const testFormatCorrectly = () => {
    render(<TimerDisplay timeLeft={1500} mode="work" isOvertime={false} />);
    expect(screen.getByText('25:00')).toBeInTheDocument();
};

const testNegativeOvertime = () => {
    render(<TimerDisplay timeLeft={-65} mode="work" isOvertime={true} />);
    expect(screen.getByText('+01:05')).toBeInTheDocument();
};

describe('TimerDisplay', () => {
    it('formats time correctly', testFormatCorrectly);
  it('shows negative time for overtime', testNegativeOvertime);

  it('uses the compact font size for long times', () => {
    const { container } = render(<TimerDisplay timeLeft={-6000} mode="work" isOvertime={true} />);
    expect(screen.getByText('+100:00')).toBeInTheDocument();
    expect(container.firstChild).toHaveStyle({ fontSize: '2.6rem' });
  });
});
