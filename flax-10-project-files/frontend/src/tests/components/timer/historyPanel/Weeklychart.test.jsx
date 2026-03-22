import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeeklyChart } from '../../../../components/Timer/historyPanel/WeeklyChart';

vi.mock('../../../../pages/Timer/TimerPage.module.css', () => ({ default: {} }));

