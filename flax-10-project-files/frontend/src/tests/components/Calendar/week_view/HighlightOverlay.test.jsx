import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HighlightOverlay } from '../../../../components/calendar/week_view/components/HighlightOverlay';

describe('HighlightOverlay', () => {
  it('returns null when quarter is null', () => {
    const { container } = render(<HighlightOverlay quarter={null} type="drag" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders proper class and top style for resize and normal types', () => {
    const { container, rerender } = render(<HighlightOverlay quarter={2} type="drag" />);
    expect(container.firstChild).toHaveClass('quarter-highlight');
    expect(container.firstChild.style.top).toBe('50%');

    rerender(<HighlightOverlay quarter={1} type="resize" />);
    expect(container.firstChild).toHaveClass('resize-line-highlight');
    expect(container.firstChild.style.top).toBe('25%');
  });
});
