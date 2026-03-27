/*
 * Upcoming-deadlines widget with expandable row list.
 */

import { useMemo, useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import Badge from '../../common/badge/Badge';
import DeadlineCountdown from '../../common/deadline_countdown/DeadlineCountdown';
import urgentGlowStyles from '../../common/urgent_glow/UrgentGlow.module.css';
import {
  containerVariants,
  expandBodyVariants,
  itemVariants,
  listVariants,
} from '../shared/widgetVariants.js';
import WidgetHeader from '../../common/widget_header/WidgetHeader';
import {
  ShowMoreButton,
} from '../shared/widgetParts.jsx';
<<<<<<< HEAD
import widgetStyles from "../../../pages/modules/styles/DashboardWidgets.module.css";
import rowStyles from "../../../pages/modules/styles/DashboardRows.module.css";
=======
import widgetStyles from "../../../pages/modules/DashboardWidgets.module.css";
import rowStyles from "../../../pages/modules/DashboardRows.module.css";
>>>>>>> main
import {
  DEADLINE_TIER_ORDER,
  TIER_ACCENT,
  getUrgencyTier,
} from "./upcomingDeadlinesUtils";

const styles = { ...widgetStyles, ...rowStyles };

function stopPropagation(event) {
  event.stopPropagation();
}

function ModuleCodePill({ moduleCode, onModuleCodeClick }) {
  if (!moduleCode) return null;
  if (onModuleCodeClick) {
    return (
      <button type="button" className={styles.moduleCodePillBtn} onClick={(e) => { e.stopPropagation(); onModuleCodeClick(moduleCode); }}>
        <Badge tone="muted" className={styles.moduleCodePill}>{moduleCode}</Badge>
      </button>
    );
  }
  return <Badge tone="muted" className={styles.moduleCodePill}>{moduleCode}</Badge>;
}

function DeadlineTitle({ title }) {
  return <span className={styles.deadlineTitle}>{title}</span>;
}

function DeadlineTypePill({ deadlineType }) {
  return <Badge tone="default" className={styles.typePill}>{(deadlineType || 'assessment').toUpperCase()}</Badge>;
}

function DeadlineRowLeft({ deadlineType, moduleCode, title, onModuleCodeClick }) {
  return (
    <div className={styles.deadlineRowLeft}>
      <div className={styles.deadlinePills} onClick={stopPropagation} onMouseDown={stopPropagation}>
        <ModuleCodePill moduleCode={moduleCode} onModuleCodeClick={onModuleCodeClick} />
        <DeadlineTypePill deadlineType={deadlineType} />
      </div>
      <DeadlineTitle title={title} />
    </div>
  );
}

function DeadlineRowRight({ deadline, tier }) {
  return <div className={styles.widgetRowMeta}><DeadlineCountdown dueDate={deadline.start_due_date} tier={tier} showPriority={false} /></div>;
}

function DeadlineRowContent({ tier, moduleCode, deadline, title, onModuleCodeClick }) {
  return (
    <>
      <DeadlineRowLeft deadlineType={deadline.deadline_type} moduleCode={moduleCode} title={title} onModuleCodeClick={onModuleCodeClick} />
      <DeadlineRowRight deadline={deadline} tier={tier} />
    </>
  );
}

function buildRowClassName(tier, urgentGlow) {
  const base = styles.deadlineRow;
  const overdue = tier === 'overdue' ? styles.rowOverdue : '';
  const critical = tier === 'critical' ? styles.rowCritical : '';
  const glow = urgentGlow ? urgentGlowStyles.urgentGlow : '';
  return `${base} ${overdue} ${critical} ${glow}`.trim();
}

function buildRowStyle(tier, interactiveRows) {
  return {
    '--deadline-row-accent': TIER_ACCENT[tier],
    cursor: interactiveRows ? 'pointer' : 'default',
  };
}

function buildInteractiveProps(interactiveRows, onSelectDeadline, deadline) {
  if (!interactiveRows) return {};
  return {
    role: 'button',
    tabIndex: 0,
    onClick: () => onSelectDeadline?.(deadline),
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelectDeadline?.(deadline);
      }
    },
  };
}

function DeadlineRow({ deadline, interactiveRows, onSelectDeadline, onModuleCodeClick }) {
  const tier = getUrgencyTier(deadline.start_due_date);
  const urgentGlow = tier === 'overdue' || tier === 'critical';
  return (
    <Motion.div
      layout="position"
      className={buildRowClassName(tier, urgentGlow)}
      style={buildRowStyle(tier, interactiveRows)}
      variants={itemVariants}
      {...buildInteractiveProps(interactiveRows, onSelectDeadline, deadline)}
    >
      <DeadlineRowContent tier={tier} moduleCode={deadline.module_code || ''} deadline={deadline} title={deadline.assessment_title || deadline.title || 'Assignment'} onModuleCodeClick={onModuleCodeClick} />
    </Motion.div>
  );
}

function useSortedDeadlines(deadlines) {
  return useMemo(() => sortDeadlines(deadlines), [deadlines]);
}

function sortDeadlines(deadlines) {
  const list = [...(deadlines || [])].filter((deadline) => deadline?.start_due_date);
  list.sort(compareDeadlines);
  return list;
}

function compareDeadlines(a, b) {
  const aTier = getUrgencyTier(a.start_due_date);
  const bTier = getUrgencyTier(b.start_due_date);
  if (DEADLINE_TIER_ORDER[aTier] !== DEADLINE_TIER_ORDER[bTier]) {
    return DEADLINE_TIER_ORDER[aTier] - DEADLINE_TIER_ORDER[bTier];
  }
  return new Date(a.start_due_date).getTime() - new Date(b.start_due_date).getTime();
}

function DeadlineRows({ deadlines, interactiveRows, onSelectDeadline, onModuleCodeClick }) {
  return deadlines.map((deadline) => (
    <DeadlineRow
      key={deadline.id}
      deadline={deadline}
      interactiveRows={interactiveRows}
      onSelectDeadline={onSelectDeadline}
      onModuleCodeClick={onModuleCodeClick}
    />
  ));
}

function ExpandedDeadlineRows({ expanded, extra, interactiveRows, onSelectDeadline, onModuleCodeClick }) {
  if (!expanded) return null;
  return (
    <Motion.div className={styles.expandableRows} variants={expandBodyVariants} initial="collapsed" animate="expanded" exit="collapsed" layout>
      <Motion.div className={styles.expandableRowsInner} initial="hidden" animate="visible" variants={listVariants}>
        <DeadlineRows deadlines={extra} interactiveRows={interactiveRows} onSelectDeadline={onSelectDeadline} onModuleCodeClick={onModuleCodeClick} />
      </Motion.div>
    </Motion.div>
  );
}

function EmptyWidget({ emptyMessage, emptySub }) {
  return (
    <div className={styles.emptyState}>
      <p className={styles.emptyMessage}>{emptyMessage}</p>
      <p className={styles.emptySub}>{emptySub}</p>
    </div>
  );
}

function DeadlineList({ initial, extra, expanded, interactiveRows, onSelectDeadline, onModuleCodeClick }) {
  return (
    <Motion.div className={styles.widgetList} initial="hidden" animate="visible" variants={listVariants} layout>
      <DeadlineRows deadlines={initial} interactiveRows={interactiveRows} onSelectDeadline={onSelectDeadline} onModuleCodeClick={onModuleCodeClick} />
      <AnimatePresence initial={false}>
        <ExpandedDeadlineRows expanded={expanded} extra={extra} interactiveRows={interactiveRows} onSelectDeadline={onSelectDeadline} onModuleCodeClick={onModuleCodeClick} />
      </AnimatePresence>
    </Motion.div>
  );
}

function WidgetBody({ sorted, initial, extra, expanded, setExpanded, emptyMessage, emptySub, interactiveRows, onSelectDeadline, renderEmpty, onModuleCodeClick }) {
  if (sorted.length === 0) return renderEmpty ? renderEmpty() : <EmptyWidget emptyMessage={emptyMessage} emptySub={emptySub} />;
  return (
    <>
      <DeadlineList initial={initial} extra={extra} expanded={expanded} interactiveRows={interactiveRows} onSelectDeadline={onSelectDeadline} onModuleCodeClick={onModuleCodeClick} />
      {extra.length > 0 && <ShowMoreButton expanded={expanded} hiddenCount={extra.length} onToggle={() => setExpanded((prev) => !prev)} styles={styles} />}
    </>
  );
}

function buildWidgetClassName(embedded) {
  return `${styles.widget} ${embedded ? styles.widgetEmbedded : ""}`;
}

function useUpcomingDeadlineState(deadlines, initialShown) {
  const [expanded, setExpanded] = useState(false);
  const sorted = useSortedDeadlines(deadlines);
  return {
    expanded,
    setExpanded,
    sorted,
    initial: sorted.slice(0, initialShown),
    extra: sorted.slice(initialShown),
  };
}

export function UpcomingDeadlinesWidget({ deadlines = [], title = "Upcoming Deadlines", initialShown = 4, embedded = false, interactiveRows = false, onSelectDeadline, emptyMessage = "No upcoming deadlines", emptySub = "You're all caught up — enjoy the calm.", renderEmpty = null, onModuleCodeClick = null }) {
  const safeDeadlines = Array.isArray(deadlines) ? deadlines : [];
  const widgetState = useUpcomingDeadlineState(safeDeadlines, initialShown);

  if (!Array.isArray(deadlines)) return null;
  return (
    <Motion.div className={buildWidgetClassName(embedded)} variants={containerVariants} initial="hidden" animate="visible" layout>
      {(widgetState.sorted.length > 0 || !renderEmpty) ? <WidgetHeader icon={AlertCircle} title={title} count={widgetState.sorted.length} className={styles.widgetHeader} /> : null}
      <WidgetBody sorted={widgetState.sorted} initial={widgetState.initial} extra={widgetState.extra} expanded={widgetState.expanded} setExpanded={widgetState.setExpanded} emptyMessage={emptyMessage} emptySub={emptySub} interactiveRows={interactiveRows} onSelectDeadline={onSelectDeadline} renderEmpty={renderEmpty} onModuleCodeClick={onModuleCodeClick} />
    </Motion.div>
  );
}
