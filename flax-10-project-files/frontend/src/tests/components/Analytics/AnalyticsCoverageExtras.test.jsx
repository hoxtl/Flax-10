import { render, screen, fireEvent, waitFor, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const barChartSpy = vi.fn();
const lineChartSpy = vi.fn();
const pieChartSpy = vi.fn();
const useThemeMock = vi.fn(() => ({ mode: 'light' }));
const getAttendanceStatsMock = vi.fn();
const emptyStateMock = vi.fn(({ title, description }) => (
  <div data-testid="empty-state">
    <span>{title}</span>
    <span>{description}</span>
  </div>
));
let useInViewValue = true;

vi.mock('@mui/x-charts/BarChart', () => ({
  BarChart: (props) => {
    barChartSpy(props);
    return <div data-testid="bar-chart" data-props={JSON.stringify(props)} />;
  },
}));

vi.mock('@mui/x-charts/LineChart', () => ({
  LineChart: (props) => {
    lineChartSpy(props);
    return <div data-testid="line-chart" data-props={JSON.stringify(props)} />;
  },
}));

vi.mock('@mui/x-charts/PieChart', () => ({
  PieChart: (props) => {
    pieChartSpy(props);
    return <div data-testid="pie-chart" data-props={JSON.stringify(props)} />;
  },
}));

vi.mock('@mui/material/useMediaQuery', () => ({
  default: vi.fn(() => true),
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: new Proxy({}, {
    get: (_, tag) => ({ children, ...props }) => {
      const Tag = typeof tag === 'string' ? tag : 'div';
      const { animate, exit, initial, transition, whileHover, whileTap, layoutId, ...rest } = props;
      return <Tag {...rest}>{children}</Tag>;
    },
  }),
  useInView: vi.fn(() => useInViewValue),
}));

vi.mock('../../../context/ThemeContext', () => ({
  useTheme: (...args) => useThemeMock(...args),
}));

vi.mock('../../../api/attendanceApi', () => ({
  getAttendanceStats: (...args) => getAttendanceStatsMock(...args),
}));

vi.mock('../../../components/common/EmptyState/EmptyState', () => ({
  default: (...args) => emptyStateMock(...args),
}));

import AnimatedList from '../../../components/Analytics/AnimatedList';
import AttendanceBarChart from '../../../components/Analytics/AttendanceBarChart';
import { ConsistencyScore } from '../../../components/Analytics/ConsistencyScore';
import PlannedVsActualChart from '../../../components/Analytics/PlannedVsActualChart';
import ProductivityCard from '../../../components/Analytics/ProductivityCard';
import ProductivityCards from '../../../components/Analytics/ProductivityCards';
import StudyHeatmap from '../../../components/Analytics/StudyHeatmap';
import StudyHoursChart from '../../../components/Analytics/StudyHoursChart';
import SummaryCards from '../../../components/Analytics/SummaryCards';
import ThemeUsageChart from '../../../components/Analytics/ThemeUsageChart';
import ThemeUsageLegend from '../../../components/Analytics/ThemeUsageLegend';
import useAttendanceStats from '../../../components/Analytics/useAttendanceStats';

describe('Analytics coverage extras', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useThemeMock.mockReturnValue({ mode: 'light' });
    getAttendanceStatsMock.mockReset();
    useInViewValue = true;
  });

  it('covers AnimatedList selection, no-scrollbar mode, no-gradient mode, and bottom opacity fallback', () => {
    const renderItem = vi.fn((item, index, isSelected) => (
      <div data-testid={`animated-item-${index}`} data-selected={String(isSelected)}>
        {item}
      </div>
    ));

    useInViewValue = false;

    const { container, rerender } = render(
      <AnimatedList items={['Alpha', 'Beta']} renderItem={renderItem} displayScrollbar={false} />,
    );

    const listViewport = container.querySelector('[data-index="0"]').parentElement;
    expect(listViewport.className).toContain('noScrollbar');

    fireEvent.mouseEnter(container.querySelector('[data-index="1"]'));
    expect(screen.getByTestId('animated-item-1')).toHaveAttribute('data-selected', 'true');

    Object.defineProperties(listViewport, {
      scrollTop: { configurable: true, value: 10 },
      scrollHeight: { configurable: true, value: 80 },
      clientHeight: { configurable: true, value: 100 },
    });
    fireEvent.scroll(listViewport);

    const gradientNodes = Array.from(container.querySelectorAll('div')).filter((node) => node.style.opacity);
    expect(gradientNodes.some((node) => node.style.opacity === '0')).toBe(true);

    rerender(<AnimatedList items={['Alpha']} showGradients={false} />);
    const gradientsAfterHide = Array.from(container.querySelectorAll('div')).filter((node) => node.style.opacity);
    expect(gradientsAfterHide).toHaveLength(0);
  });

  it('covers AnimatedList defaults, selected styling, and both bottom-opacity branches', () => {
    const { container, rerender } = render(<AnimatedList />);
    expect(container.firstChild).toBeTruthy();

    rerender(<AnimatedList items={['Solo']} />);

    const listViewport = container.querySelector('[data-index="0"]').parentElement;
    fireEvent.mouseEnter(container.querySelector('[data-index="0"]'));
    expect(screen.getByText('Solo').parentElement.className).toContain('selected');

    Object.defineProperties(listViewport, {
      scrollTop: { configurable: true, value: 5 },
      scrollHeight: { configurable: true, value: 200 },
      clientHeight: { configurable: true, value: 100 },
    });
    fireEvent.scroll(listViewport);

    const gradients = Array.from(container.querySelectorAll('div')).filter((node) => node.style.opacity);
    expect(gradients.some((node) => node.style.opacity !== '0')).toBe(true);
  });

  it('covers AttendanceBarChart axis and mobile margin props', () => {
    render(
      <AttendanceBarChart
        byType={{
          Lecture: { attended: 8, missed: 2 },
          Seminar: { attended: 5, missed: 1 },
        }}
        gridColor="#ddd"
        isMobile={true}
        textColor="#222"
        types={['Lecture', 'Seminar']}
      />,
    );

    const props = JSON.parse(screen.getByTestId('bar-chart').getAttribute('data-props'));
    expect(props.xAxis[0].data).toEqual(['Lecture', 'Seminar']);
    expect(props.series[0].data).toEqual([8, 5]);
    expect(props.series[1].data).toEqual([2, 1]);
    expect(props.margin.left).toBe(26);
  });

  it('covers ConsistencyScore threshold labels and explanation branches', () => {
    const cases = [
      {
        data: { summary: { current_streak_days: 0 }, daily_breakdown: [{ sessions: 1 }], period_days: 10 },
        label: 'Getting Started',
        tooltipPart: 'Log sessions daily to build your score.',
      },
      {
        data: { summary: { active_days: 6, current_streak_days: 0 }, period_days: 10 },
        label: 'Building',
        tooltipPart: 'aim for fewer gaps',
      },
      {
        data: { summary: { active_days: 8, current_streak_days: 5 }, period_days: 10 },
        label: 'Good',
        tooltipPart: 'Strong consistency',
      },
      {
        data: { summary: { active_days: 10, current_streak_days: 10 }, period_days: 10 },
        label: 'Excellent',
        tooltipPart: 'outstanding habit',
      },
      {
        data: { summary: { active_days: 0, current_streak_days: 0 }, period_days: 0 },
        label: 'Getting Started',
        tooltipPart: 'Log sessions daily to build your score.',
      },
      {
        data: { summary: { current_streak_days: 0 } },
        label: 'Getting Started',
        tooltipPart: 'Studied 0 of 30 days (0%) so far.',
      },
    ];

    const { rerender, container } = render(<ConsistencyScore data={cases[0].data} />);

    for (const testCase of cases) {
      rerender(<ConsistencyScore data={testCase.data} />);
      expect(screen.getByText(testCase.label)).toBeTruthy();
      expect(container.firstChild).toHaveAttribute('data-tooltip', expect.stringContaining(testCase.tooltipPart));
      expect(screen.getByText('Consistency')).toHaveAttribute('title', expect.stringContaining('Score = % of days studied'));
    }
  });

  it('covers ProductivityCard optional unit and subtitle branches', () => {
    const { rerender } = render(
      <ProductivityCard color="#f90" icon="!" label="Overtime Sessions" subtitle={null} unit={null} value={null} />,
    );

    expect(screen.getByText('Overtime Sessions')).toBeTruthy();
    expect(screen.getByText('—')).toBeTruthy();
    expect(screen.queryByText('hrs')).toBeNull();

    rerender(
      <ProductivityCard color="#0af" icon="i" label="Schedule Adherence" subtitle="Keeps plans realistic" unit="%" value={92} />,
    );

    expect(screen.getByText('Keeps plans realistic')).toBeTruthy();
    expect(screen.getByText('%')).toBeTruthy();
  });

  it('covers balanced ProductivityCards layout', () => {
    const { container } = render(
      <ProductivityCards
        balanced
        data={{ summary: { work_break_ratio: 3, overtime_sessions: 1, longest_session_minutes: 45, planning_completion_rate: 88 } }}
        progressData={{ summary: { adherence_percentage: 91 } }}
      />,
    );

    expect(container.firstChild.className).toContain('productivityGridBalanced');
  });

  it('covers StudyHeatmap dark theme, visible cell values, and legend labels', () => {
    useThemeMock.mockReturnValue({ mode: 'dark' });

    render(
      <StudyHeatmap
        heatmapData={{
          data: [
            [0, 8, 0, 0],
            [2, 0, 0, 1],
          ],
          days: ['Mon', 'Tue'],
          hours: [0, 1, 2, 3],
        }}
      />,
    );

    expect(screen.getByText('8')).toBeTruthy();
    expect(screen.getByText('Less')).toBeTruthy();
    expect(screen.getByText('More')).toBeTruthy();
    expect(screen.getByTitle('Mon 1:00 - 8 minutes')).toBeTruthy();
    expect(screen.getByTitle('Mon 0:00 - 0 minutes')).toBeTruthy();
  });

  it('covers StudyHoursChart with the current theme mode and mobile margin', () => {
    render(<StudyHoursChart data={[{ date: '2024-03-01', work: 90, break: 15 }]} />);

    const props = JSON.parse(screen.getByTestId('line-chart').getAttribute('data-props'));
    expect(props.margin.left).toBe(28);
    expect(props.series[0].data).toEqual(['1.5']);
    expect(props.series[1].data).toEqual(['0.3']);
  });

  it('covers SummaryCards tooltip attributes and zero active-day fallback', () => {
    const { container } = render(
      <SummaryCards
        data={{
          summary: {
            total_study_hours: 12.5,
            total_sessions: 4,
            avg_session_minutes: 30,
            current_streak_days: 0,
            longest_session_minutes: 75,
            active_days: undefined,
          },
          daily_breakdown: [],
        }}
      />,
    );

    expect(screen.getByText('Active Days')).toBeTruthy();
    expect(container.querySelector('[data-tooltip]')).toBeTruthy();
  });

  it('covers ThemeUsageChart empty-state branch and ThemeUsageLegend percentage formatting', () => {
    render(
      <ThemeUsageChart
        themeStats={{
          summary: {
            dark_percentage: 0,
            light_percentage: 12.34,
            dark_minutes: 0,
            light_minutes: 0,
            peak_dark_hour: null,
            total_minutes: 0,
          },
        }}
      />,
    );

    expect(screen.getByTestId('empty-state')).toHaveTextContent('No theme session data yet');
    expect(screen.queryByTestId('pie-chart')).toBeNull();

    render(<ThemeUsageLegend summary={{ light_percentage: 12.34, dark_percentage: Number.NaN }} />);
    expect(screen.getByText('12.3%')).toBeTruthy();
    expect(screen.getByText('0%')).toBeTruthy();
  });

  it('covers ThemeUsageLegend fallback for missing light percentage', () => {
    render(<ThemeUsageLegend summary={{ dark_percentage: 100 }} />);
    expect(screen.getByText('Light Mode')).toBeTruthy();
    expect(screen.getAllByText('0%').length).toBeGreaterThan(0);
  });

  it('covers ThemeUsageChart when dark percentage is missing but data exists', () => {
    render(
      <ThemeUsageChart
        themeStats={{
          summary: {
            light_percentage: 100,
            light_minutes: 120,
            dark_minutes: 0,
            peak_dark_hour: '11pm',
            total_minutes: 120,
          },
        }}
      />,
    );

    expect(screen.getByText('☀️ Day Worker')).toBeTruthy();
    expect(screen.getByTestId('pie-chart')).toBeTruthy();
  });

  it('covers PlannedVsActualChart fallback values for invalid inputs and non-array data', () => {
    const { rerender } = render(
      <PlannedVsActualChart
        data={[{ date: '2024-03-01', planned_hours: 'oops', actual_hours: '' }]}
        variant="warm"
      />,
    );

    let props = JSON.parse(screen.getByTestId('bar-chart').getAttribute('data-props'));
    expect(props.series[0].data).toEqual([0]);
    expect(props.series[1].data).toEqual([0]);

    rerender(<PlannedVsActualChart data={{ not: 'an array' }} />);
    props = JSON.parse(screen.getByTestId('bar-chart').getAttribute('data-props'));
    expect(props.xAxis[0].data).toEqual([]);
  });

  it('covers useAttendanceStats success and error paths', async () => {
    getAttendanceStatsMock.mockResolvedValueOnce({ overall: { attended: 6, missed: 2 } });
    const success = renderHook(() => useAttendanceStats());

    expect(success.result.current.loading).toBe(true);
    await waitFor(() => expect(success.result.current.loading).toBe(false));
    expect(success.result.current.stats).toEqual({ overall: { attended: 6, missed: 2 } });

    getAttendanceStatsMock.mockRejectedValueOnce(new Error('boom'));
    const failure = renderHook(() => useAttendanceStats());

    await waitFor(() => expect(failure.result.current.loading).toBe(false));
    expect(failure.result.current.stats).toBeNull();
  });
});
