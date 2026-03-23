import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import InlineSoundPanel from '../../../components/Timer/InlineSoundPanel';

describe('InlineSoundPanel', () => {
  it('shows music controls without ambient sound controls', () => {
    render(<InlineSoundPanel />);

    expect(screen.getByText('Music & Streams')).toBeInTheDocument();
    expect(screen.queryByText('Ambient Sounds')).not.toBeInTheDocument();
  });
});
