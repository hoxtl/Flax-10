import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import SuccessScreen from '../../../../components/onboarding/components/SuccessScreen';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
}));

vi.mock('../../../../components/common/primary_button/PrimaryButton', () => ({
  default: ({ children, onClick }) => <button type="button" onClick={onClick}>{children}</button>,
}));

describe('SuccessScreen', () => {
  it('renders onboarding success content and handles completion click', async () => {
    const onComplete = vi.fn();

    render(<SuccessScreen major="Computer Science" onComplete={onComplete} />);

    expect(screen.getByText("You're all set!")).toBeInTheDocument();
    expect(screen.getByText(/Computer Science/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open Settings' }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
