import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import InlineSoundPanel from '../../../components/Timer/InlineSoundPanel';

describe('InlineSoundPanel', () => {
  it('shows the music and streams widget', () => {
    render(<InlineSoundPanel />);

    expect(screen.getByText('Music & Streams')).toBeInTheDocument();
  });
});
