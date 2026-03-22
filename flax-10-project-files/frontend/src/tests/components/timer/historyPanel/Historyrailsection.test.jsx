import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HistoryRailSection } from '../../../../components/Timer/historyPanel/HistoryRailSection';

vi.mock('../../../../pages/Timer/TimerPage.module.css', () => ({ default: {} }));

vi.mock('../../../../components/Timer/utils/historyFormatter', () => ({
  formatDuration: (s) => (s ? `${Math.floor(s / 60)}m` : null),
  formatTimeRange: (start, end) => (start && end ? '10:00–11:00' : null),
}));

vi.mock('../../../../components/Timer/historyPanel/historyPanelUtils', () => ({
  getModuleLabel: (block) => block.module || null,
}));

vi.mock('../../../../components/common/PrimaryButton/PrimaryButton', () => ({
  default: ({ children }) => <button>{children}</button>,
}));

