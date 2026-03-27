/*
 * Timer right rail content.
 */

import { useState } from 'react';
import styles from '../../../pages/timer/TimerPage.module.css';
import Tabs from '../../common/tabs/Tabs';
import InlineSoundPanel from '../InlineSoundPanel';
import RightRailHistoryPanel from '../RightRailHistoryPanel';
import { PresetPanel, TimerConfigPanel } from '../PresetPanel';

function RightRailTabs({ t }) {
  const [tab, setTab] = useState('presets');
  const tabs = [
    { id: 'presets', label: 'Presets', content: <PresetPanel t={t} embedded /> },
    { id: 'config', label: 'Configuration', content: <TimerConfigPanel t={t} embedded /> },
    { id: 'history', label: 'History', content: <RightRailHistoryPanel /> },
  ];

  return (
    <div className={styles.presetPanelCard}>
      <Tabs tabs={tabs} activeTab={tab} onTabChange={setTab} layoutId="timerRightRailTab" tabVariant="heading" />
    </div>
  );
}

export function RightPanel({ t }) {
  return (
    <div className={styles.timerRightPanel}>
      <RightRailTabs t={t} />
      <InlineSoundPanel />
    </div>
  );
}
