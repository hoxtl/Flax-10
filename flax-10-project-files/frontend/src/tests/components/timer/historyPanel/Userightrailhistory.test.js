import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRightRailHistory, clearRightRailHistory } from '../../../../components/Timer/historyPanel/useRightRailHistory';

vi.mock('../../../../components/Timer/utils/historyUtils', () => ({
  getHistory: vi.fn(),
  clearHistory: vi.fn(),
}));

vi.mock('../../../../components/Timer/utils/historyFormatter', () => ({
  groupHistoryByBlock: vi.fn((h) => h),
}));

vi.mock('../../../../components/Timer/historyPanel/historyPanelUtils', () => ({
  filterVisibleBlocks: vi.fn((b) => b),
  getSevenDayFocusSeries: vi.fn(() =>
    Array.from({ length: 7 }, (_, i) => ({ key: `day-${i}`, label: 'Mon', seconds: i * 100 }))
  ),
  groupBlocksByHorizon: vi.fn((b) => (b.length ? [{ label: 'Today', entries: b }] : [])),
}));

import { getHistory, clearHistory } from '../../../../components/Timer/utils/historyUtils';