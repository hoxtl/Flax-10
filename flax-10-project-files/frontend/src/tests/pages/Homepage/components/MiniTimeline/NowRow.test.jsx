import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NowRow } from '../../../../../pages/Homepage/components/MiniTimeline/NowRow';

const styles = {
  planTimelineRow: 'row',
  planTimelineGutter: 'gutter',
  planTimelineTime: 'time',
  planTimelineSpineCell: 'spine',
  planTimelineNowWrap: 'nowWrap',
  planTimelineNowDot: 'dot',
  planTimelineNowTag: 'tag',
  planTimelineNowLine: 'line',
};

describe('NowRow', () => {
  it('renders Now label and time from row', () => {
    const row = { id: 'now1', nowMins: 240, spacingBeforePx: 0 };
    render(<NowRow row={row} styles={styles} />);
    expect(screen.getByText('Now')).toBeInTheDocument();
    expect(document.querySelector('.time')).toHaveTextContent(/10am|10:00am/);
  });

  it('applies spacingBeforePx when provided', () => {
    const row = { id: 'n2', nowMins: 0, spacingBeforePx: 20 };
    const { container } = render(<NowRow row={row} styles={styles} />);
    const wrapper = container.querySelector('.row');
    expect(wrapper).toHaveStyle({ marginTop: '20px' });
  });

  it('forwards nowRowRef to root div', () => {
    const row = { id: 'n3', nowMins: 120 };
    const ref = { current: null };
    render(<NowRow row={row} styles={styles} nowRowRef={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
