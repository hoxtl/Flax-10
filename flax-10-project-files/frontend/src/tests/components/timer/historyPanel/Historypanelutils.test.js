import { describe, it, expect } from 'vitest';
import {
  getHistoryHorizonLabel,
  getSevenDayFocusSeries,
  getModuleLabel,
  filterVisibleBlocks,
  groupBlocksByHorizon,
} from '../../../../components/Timer/historyPanel/historyPanelUtils';

