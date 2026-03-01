import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import OnboardingModal from '../../../components/Onboarding/OnboardingModal';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('../../../components/Onboarding/OnboardingForm', () => ({
  default: () => <div data-testid="onboarding-form">form</div>,
}));

vi.mock('../../../components/Onboarding/SuccessScreen', () => ({
  default: () => <div data-testid="success-screen">success</div>,
}));

const mockOnboardingState = {
  year: '', major: '', confirmed: false, loading: false, done: false,
  setYear: vi.fn(), handleMajorChange: vi.fn(), setConfirmed: vi.fn(), handleSubmit: vi.fn(),
};

vi.mock('../../../components/Onboarding/hooks/useOnboarding', () => ({
  default: () => mockOnboardingState,
}));

vi.mock('../../../lib/kclCourses', () => ({
  KCL_DEPARTMENTS: { Science: ['Physics', 'Chemistry'] },
}));

describe('OnboardingModal', () => {
  it('renders nothing when isOpen=false', () => {
    const { container } = render(<OnboardingModal isOpen={false} onComplete={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the form when isOpen=true', () => {
    render(<OnboardingModal isOpen={true} onComplete={vi.fn()} />);
    expect(screen.getByTestId('onboarding-form')).toBeTruthy();
  });

  it('shows the form (not success) on initial open', () => {
    render(<OnboardingModal isOpen={true} onComplete={vi.fn()} />);
    expect(screen.getByTestId('onboarding-form')).toBeTruthy();
    expect(screen.queryByTestId('success-screen')).toBeNull();
  });

  it('shows SuccessScreen when done is true', () => {
    mockOnboardingState.done = true;
    render(<OnboardingModal isOpen={true} onComplete={vi.fn()} />);
    expect(screen.getByTestId('success-screen')).toBeTruthy();
    expect(screen.queryByTestId('onboarding-form')).toBeNull();
    mockOnboardingState.done = false;
  });
});
