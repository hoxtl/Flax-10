import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeeklyChart } from '../../../../components/Timer/historyPanel/WeeklyChart';

vi.mock('../../../../pages/Timer/TimerPage.module.css', () => ({ default: {} }));

const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const makeSeries = (secondsArr) =>
  secondsArr.map((seconds, i) => ({
    key: `day-${i}`,
    label: WEEK_LABELS[i] ?? `D${i}`,
    seconds,
  }));

const DEFAULT_SERIES = makeSeries([0, 1800, 3600, 7200, 0, 5400, 3600]);
const MAX = 7200;

