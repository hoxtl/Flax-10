import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PrimaryButton from '../../../components/ui/components/PrimaryButton';

describe('PrimaryButton', () => {
  it('renders children and default attributes', () => {
    render(<PrimaryButton>Save</PrimaryButton>);
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('type', 'button');
    expect(btn).not.toBeDisabled();
  });

  it('applies custom props', () => {
    render(
      <PrimaryButton type="submit" size="large" className="extra" disabled>
        Submit
      </PrimaryButton>
    );
    const btn = screen.getByRole('button', { name: 'Submit' });
    expect(btn).toHaveAttribute('type', 'submit');
    expect(btn).toBeDisabled();
    expect(btn.className).toContain('extra');
  });
});
