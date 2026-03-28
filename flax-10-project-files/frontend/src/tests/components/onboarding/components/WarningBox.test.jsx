/**
 * Tests for the real WarningBox component.
 * All other onboarding test files mock WarningBox away, so this file
 * renders it directly to achieve function/statement/branch coverage.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag) =>
        ({ children, initial, animate, exit, transition, ...rest }) =>
          // eslint-disable-next-line react/display-name
          React.createElement(tag, rest, children),
    },
  ),
}));

vi.mock('*.module.css', () => ({
  default: new Proxy({}, { get: (_, k) => k }),
}));

vi.mock('../../../../components/common/filter_checkbox/FilterCheckbox', () => ({
  default: ({ checked, onChange }) => (
    <input
      type="checkbox"
      data-testid="confirm-checkbox"
      checked={!!checked}
      onChange={onChange}
    />
  ),
}));

import React from 'react';
import WarningBox from '../../../../components/onboarding/components/WarningBox';

describe('WarningBox', () => {
  it('renders the "Just so you know" heading and the major name', () => {
    render(<WarningBox major="Computer Science" confirmed={false} onConfirm={vi.fn()} />);
    expect(screen.getByText('Just so you know')).toBeInTheDocument();
    expect(screen.getByText(/Computer Science/)).toBeInTheDocument();
  });

  it('renders the warning body text about the course being permanent', () => {
    render(<WarningBox major="Law" confirmed={false} onConfirm={vi.fn()} />);
    // &rsquo; in JSX renders as the unicode right single-quote \u2019
    expect(screen.getByText(/can\u2019t be changed after this/)).toBeInTheDocument();
    expect(screen.getByText(/modules will be set up automatically/)).toBeInTheDocument();
  });

  it('renders "Yes, this is my course" label text', () => {
    render(<WarningBox major="Medicine" confirmed={false} onConfirm={vi.fn()} />);
    expect(screen.getByText(/Yes, this is my course/)).toBeInTheDocument();
  });

  it('renders checkbox unchecked when confirmed is false', () => {
    render(<WarningBox major="Physics" confirmed={false} onConfirm={vi.fn()} />);
    expect(screen.getByTestId('confirm-checkbox')).not.toBeChecked();
  });

  it('renders checkbox checked when confirmed is true', () => {
    render(<WarningBox major="Biology" confirmed={true} onConfirm={vi.fn()} />);
    expect(screen.getByTestId('confirm-checkbox')).toBeChecked();
  });

  it('calls onConfirm when the checkbox is clicked (unchecked → checked)', () => {
    const onConfirm = vi.fn();
    render(<WarningBox major="Chemistry" confirmed={false} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByTestId('confirm-checkbox'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when the checkbox is clicked (checked → unchecked)', () => {
    const onConfirm = vi.fn();
    render(<WarningBox major="Engineering" confirmed={true} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByTestId('confirm-checkbox'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
