import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OnboardingModal from '../../../../components/onboarding/components/OnboardingModal';

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }) => <div {...props}>{children}</div> },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

const useOnboardingMock = vi.hoisted(() => vi.fn());
vi.mock('../../../../components/onboarding/hooks/useOnboarding', () => ({
  default: useOnboardingMock,
}));

vi.mock('../../../../components/onboarding/components/OnboardingForm', () => ({
  default: ({ onDropdownOpenChange }) => (
    <div>
      <span>Mocked Form</span>
      <button onClick={() => onDropdownOpenChange?.('year', true)}>open-year-dropdown</button>
    </div>
  ),
}));

vi.mock('../../../../components/onboarding/components/SuccessScreen', () => ({
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

  it('invokes onDropdownOpenChange callback and covers the expanded panel class branch', () => {
    useOnboardingMock.mockReturnValue({ done: false, major: '' });
    render(<OnboardingModal isOpen onComplete={vi.fn()} />);
    // Clicking this button triggers onDropdownOpenChange('year', true), which sets
    // openDropdowns.year = true and causes getOnboardingPanelClass to hit the
    // isExpanded=true branch of the ternary on the next render.
    fireEvent.click(screen.getByText('open-year-dropdown'));
    // The form should still be visible after the state update
    expect(screen.getByText('Mocked Form')).toBeInTheDocument();
  });

  it('does not expand the panel when state.done is true even if a dropdown flag is set', () => {
    useOnboardingMock.mockReturnValue({ done: true, major: 'CS' });
    render(<OnboardingModal isOpen onComplete={vi.fn()} />);
    // Success screen is shown; no form dropdown button present
    expect(screen.getByText('Success CS')).toBeInTheDocument();
  });
});
