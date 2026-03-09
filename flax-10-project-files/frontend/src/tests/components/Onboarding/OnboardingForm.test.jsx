import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OnboardingForm from '../../../components/Onboarding/OnboardingForm';

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }) => <div {...props}>{children}</div>, span: ({ children, ...props }) => <span {...props}>{children}</span> },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('../../../components/ui/AnimatedDropdown', () => ({
  default: ({ placeholder, onChange }) => (
    <button onClick={() => onChange('changed')}>
      {placeholder}
    </button>
  ),
}));

vi.mock('../../../components/Onboarding/WarningBox', () => ({
  default: ({ major }) => <div>{`Warning for ${major}`}</div>,
}));

describe('OnboardingForm', () => {
  const baseProps = {
    year: '',
    setYear: vi.fn(),
    major: '',
    handleMajorChange: vi.fn(),
    confirmed: false,
    setConfirmed: vi.fn(),
    loading: false,
    handleSubmit: vi.fn(),
    courseOptions: [{ label: 'Dept', options: [{ value: 'Course', label: 'Course' }] }],
  };

  it('renders fields and keeps submit disabled until required values are present', () => {
    render(<OnboardingForm {...baseProps} />);
    expect(screen.getByRole('button', { name: 'Set up my modules' })).toBeDisabled();
    expect(screen.queryByText(/Warning for/)).not.toBeInTheDocument();
  });

  it('shows warning and enables submit when valid and confirmed', () => {
    render(<OnboardingForm {...baseProps} year="Year 1" major="Computer Science" confirmed />);
    expect(screen.getByText('Warning for Computer Science')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Set up my modules' })).not.toBeDisabled();
  });

  it('calls handlers from dropdown and submit', () => {
    const setYear = vi.fn();
    const handleMajorChange = vi.fn();
    const handleSubmit = vi.fn();
    render(
      <OnboardingForm
        {...baseProps}
        year="Year 1"
        major="Computer Science"
        confirmed
        loading={false}
        setYear={setYear}
        handleMajorChange={handleMajorChange}
        handleSubmit={handleSubmit}
      />
    );

    fireEvent.click(screen.getByText('Select your year'));
    fireEvent.click(screen.getByText('Select your course'));
    expect(setYear).toHaveBeenCalledWith('changed');
    expect(handleMajorChange).toHaveBeenCalledWith('changed');
    expect(screen.getByRole('button', { name: /Set up my modules/i })).not.toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /Set up my modules/i }));
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
});
