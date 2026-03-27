/**
 * Unit tests for onboarding form behaviour.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OnboardingForm from '../../../components/onboarding/OnboardingForm';

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }) => <div {...props}>{children}</div>, span: ({ children, ...props }) => <span {...props}>{children}</span> },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('../../../components/common/animated_dropdown', () => ({
  default: ({ placeholder, onChange, onOpenChange }) => (
    <div>
      <button onClick={() => onChange('changed')}>
        {placeholder}
      </button>
      <button onClick={() => onOpenChange?.(true)}>
        {`${placeholder}-open`}
      </button>
    </div>
  ),
}));

vi.mock('../../../components/onboarding/WarningBox', () => ({
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

  const renderForm = (overrides = {}) => render(<OnboardingForm {...baseProps} {...overrides} />);

  it('renders fields and keeps submit disabled until required values are present', () => {
    renderForm();
    expect(screen.getByRole('button', { name: 'Set up my modules' })).toBeDisabled();
    expect(screen.queryByText(/Warning for/)).not.toBeInTheDocument();
  });

  it('shows warning and enables submit when valid and confirmed', () => {
    renderForm({ year: 'Year 1', major: 'Computer Science', confirmed: true });
    expect(screen.getByText('Warning for Computer Science')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Set up my modules' })).not.toBeDisabled();
  });

  it('calls year and major dropdown handlers', () => {
    const setYear = vi.fn();
    const handleMajorChange = vi.fn();
    renderForm({ year: 'Year 1', major: 'Computer Science', confirmed: true, setYear, handleMajorChange });
    fireEvent.click(screen.getByText('Select your year'));
    fireEvent.click(screen.getByText('Select your course'));
    expect(setYear).toHaveBeenCalledWith('changed');
    expect(handleMajorChange).toHaveBeenCalledWith('changed');
  });

  it('submits onboarding form', () => {
    const handleSubmit = vi.fn();
    renderForm({ year: 'Year 1', major: 'Computer Science', confirmed: true, loading: false, handleSubmit });
    expect(screen.getByRole('button', { name: /Set up my modules/i })).not.toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /Set up my modules/i }));
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it('reports when a dropdown opens', () => {
    const onDropdownOpenChange = vi.fn();
    renderForm({ onDropdownOpenChange });
    fireEvent.click(screen.getByText('Select your year-open'));
    expect(onDropdownOpenChange).toHaveBeenCalledWith('year', true);
  });
});
