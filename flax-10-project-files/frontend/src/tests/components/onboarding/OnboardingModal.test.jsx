import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/components/onboarding/OnboardingModal.test.jsx
import OnboardingModal from '../../../components/onboarding/components/OnboardingModal';
=======
import OnboardingModal from '../../../components/onboarding/OnboardingModal';
>>>>>>> main:flax-10-project-files/frontend/src/tests/components/Onboarding/OnboardingModal.test.jsx

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }) => <div {...props}>{children}</div> },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

const useOnboardingMock = vi.hoisted(() => vi.fn());
vi.mock('../../../components/onboarding/hooks/useOnboarding', () => ({
  default: useOnboardingMock,
}));

<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/components/onboarding/OnboardingModal.test.jsx
vi.mock('../../../components/onboarding/components/OnboardingForm', () => ({
  default: () => <div>Mocked Form</div>,
}));

vi.mock('../../../components/onboarding/components/SuccessScreen', () => ({
=======
vi.mock('../../../components/onboarding/OnboardingForm', () => ({
  default: () => <div>Mocked Form</div>,
}));

vi.mock('../../../components/onboarding/SuccessScreen', () => ({
>>>>>>> main:flax-10-project-files/frontend/src/tests/components/Onboarding/OnboardingModal.test.jsx
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
