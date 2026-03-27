import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import OnboardingModal from '../../../components/onboarding/components/OnboardingModal';

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }) => <div {...props}>{children}</div> },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

const useOnboardingMock = vi.hoisted(() => vi.fn());
vi.mock('../../../components/onboarding/hooks/useOnboarding', () => ({
  default: useOnboardingMock,
}));

vi.mock('../../../components/onboarding/components/OnboardingForm', () => ({
  default: () => <div>Mocked Form</div>,
}));

vi.mock('../../../components/onboarding/components/SuccessScreen', () => ({
  default: ({ major }) => <div>{`Success ${major}`}</div>,
}));

describe('OnboardingModal', () => {
  it('does not render when isOpen is false', () => {
    useOnboardingMock.mockReturnValue({ done: false, major: 'X' });
    render(<OnboardingModal isOpen={false} onComplete={vi.fn()} />);
    expect(screen.queryByText('Mocked Form')).not.toBeInTheDocument();
  });

  it('renders form when onboarding is not done', () => {
    useOnboardingMock.mockReturnValue({ done: false, major: 'X' });
    render(<OnboardingModal isOpen onComplete={vi.fn()} />);
    expect(screen.getByText('Mocked Form')).toBeInTheDocument();
  });

  it('renders success screen when onboarding is done', () => {
    useOnboardingMock.mockReturnValue({ done: true, major: 'Computer Science' });
    render(<OnboardingModal isOpen onComplete={vi.fn()} />);
    expect(screen.getByText('Success Computer Science')).toBeInTheDocument();
  });
});
