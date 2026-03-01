import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OnboardingForm from '../../../components/Onboarding/OnboardingForm';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div>{children}</div>,
    span: ({ children, ...props }) => <span>{children}</span>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('../../../components/ui/AnimatedDropdown', () => ({
  default: ({ placeholder, onChange, value }) => (
    <button onClick={() => onChange('mock-value')}>{value || placeholder}</button>
  ),
}));

vi.mock('../../../components/Onboarding/WarningBox', () => ({
  default: ({ confirmed, onConfirm }) => (
    <label>
      <input type="checkbox" checked={confirmed} onChange={e => onConfirm(e.target.checked)} />
      confirm
    </label>
  ),
}));

const baseProps = {
  year: '', setYear: vi.fn(),
  major: '', handleMajorChange: vi.fn(),
  confirmed: false, setConfirmed: vi.fn(),
  loading: false, handleSubmit: vi.fn(),
  courseOptions: [],
};

describe('OnboardingForm', () => {
  it('renders the title', () => {
    render(<OnboardingForm {...baseProps} />);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toMatch(/you.re in the right place/i);
  });

  it('renders the subtitle', () => {
    render(<OnboardingForm {...baseProps} />);
    expect(screen.getByText(/two quick things/i)).toBeTruthy();
  });

  it('renders Year of Study and Course dropdowns', () => {
    render(<OnboardingForm {...baseProps} />);
    expect(screen.getByText('Select your year')).toBeTruthy();
    expect(screen.getByText('Select your course')).toBeTruthy();
  });

  it('submit button reads "Set up my modules"', () => {
    render(<OnboardingForm {...baseProps} />);
    expect(screen.getByRole('button', { name: /set up my modules/i })).toBeTruthy();
  });

  it('submit button is disabled when year is missing', () => {
    render(<OnboardingForm {...baseProps} major="Physics" confirmed={true} />);
    expect(screen.getByRole('button', { name: /set up my modules/i }).disabled).toBe(true);
  });

  it('submit button is disabled when major is missing', () => {
    render(<OnboardingForm {...baseProps} year="Year 1" confirmed={true} />);
    expect(screen.getByRole('button', { name: /set up my modules/i }).disabled).toBe(true);
  });

  it('submit button is disabled when not confirmed', () => {
    render(<OnboardingForm {...baseProps} year="Year 1" major="Physics" confirmed={false} />);
    expect(screen.getByRole('button', { name: /set up my modules/i }).disabled).toBe(true);
  });

  it('submit button is enabled when all fields filled and confirmed', () => {
    render(<OnboardingForm {...baseProps} year="Year 1" major="Physics" confirmed={true} />);
    expect(screen.getByRole('button', { name: /set up my modules/i }).disabled).toBe(false);
  });

  it('shows loading text when loading=true', () => {
    render(<OnboardingForm {...baseProps} year="Year 1" major="Physics" confirmed={true} loading={true} />);
    expect(screen.getByText('Setting up your modules...')).toBeTruthy();
  });

  it('shows warning box when year and major are selected', () => {
    render(<OnboardingForm {...baseProps} year="Year 1" major="Physics" />);
    expect(screen.getByText('confirm')).toBeTruthy();
  });

  it('does not show warning box when fields are empty', () => {
    render(<OnboardingForm {...baseProps} />);
    expect(screen.queryByText('confirm')).toBeNull();
  });

  it('calls handleSubmit when button clicked', () => {
    const handleSubmit = vi.fn();
    render(<OnboardingForm {...baseProps} year="Year 1" major="Physics" confirmed={true} handleSubmit={handleSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /set up my modules/i }));
    expect(handleSubmit).toHaveBeenCalled();
  });
});
