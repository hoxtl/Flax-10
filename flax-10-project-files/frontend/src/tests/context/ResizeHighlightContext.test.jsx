import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResizeHighlightProvider, useResizeHighlight } from '../../context/ResizeHighlightContext';

function Consumer() {
  const { resizeHighlight, setResizeHighlight } = useResizeHighlight();
  return (
    <div>
      <span data-testid="value">{resizeHighlight ?? 'none'}</span>
      <button onClick={() => setResizeHighlight('event-123')}>set</button>
    </div>
  );
}

describe('ResizeHighlightContext', () => {
  it('provides state and setter in provider', () => {
    render(
      <ResizeHighlightProvider>
        <Consumer />
      </ResizeHighlightProvider>
    );
    expect(screen.getByTestId('value')).toHaveTextContent('none');
    fireEvent.click(screen.getByText('set'));
    expect(screen.getByTestId('value')).toHaveTextContent('event-123');
  });

  it('returns fallback when used outside provider', () => {
    render(<Consumer />);
    expect(screen.getByTestId('value')).toHaveTextContent('none');
    expect(() => fireEvent.click(screen.getByText('set'))).not.toThrow();
    expect(screen.getByTestId('value')).toHaveTextContent('none');
  });
});
