import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ModuleDropdown from '../../../components/Modules/ModuleDropdown';

vi.mock('lucide-react', () => ({
  ChevronDown: () => <span data-testid="chevron" />,
  Check: () => <span data-testid="check" />,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('ModuleDropdown', () => {
  const options = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
  ];

  it('opens menu, selects option, and shows check for selected value', () => {
    const onChange = vi.fn();
    render(<ModuleDropdown value="a" onChange={onChange} options={options} />);

    fireEvent.click(screen.getByRole('button', { name: 'Alpha' }));
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getAllByTestId('check')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Beta' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('closes when clicking outside', async () => {
    render(<ModuleDropdown value="a" onChange={vi.fn()} options={options} />);
    fireEvent.click(screen.getByRole('button', { name: 'Alpha' }));
    expect(screen.getByText('Beta')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(screen.queryByText('Beta')).not.toBeInTheDocument();
    });
  });

  it('handles value not in options', () => {
    render(<ModuleDropdown value="z" onChange={vi.fn()} options={options} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('applies custom className to wrapper', () => {
    const { container } = render(
      <ModuleDropdown value="a" onChange={vi.fn()} options={options} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('closes menu when clicking trigger again', () => {
    render(<ModuleDropdown value="a" onChange={vi.fn()} options={options} />);
    const buttons = screen.getAllByRole('button', { name: 'Alpha' });
    const trigger = buttons[0];
    fireEvent.click(trigger);
    expect(screen.getByText('Beta')).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.queryByText('Beta')).not.toBeInTheDocument();
  });
});
