/*
 * Upcoming-deadlines widget with expandable row list.
 */

import { useMemo, useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import Badge from '../../common/Badge/Badge';
import DeadlineCountdown from '../../common/DeadlineCountdown/DeadlineCountdown';
import urgentGlowStyles from '../../Common/UrgentGlow/UrgentGlow.module.css';
import {
  containerVariants,
  expandBodyVariants,
  itemVariants,
  listVariants,
} from '../shared/widgetVariants.js';
import {
  WidgetHeader,
  ShowMoreButton,
} from '../shared/widgetParts.jsx';
import widgetStyles from "../../../pages/Modules/DashboardWidgets.module.css";
import rowStyles from "../../../pages/Modules/DashboardRows.module.css";
import {
  DEADLINE_TIER_ORDER,
  TIER_ACCENT,
  getUrgencyTier,
} from "./upcomingDeadlinesUtils";

const styles = { ...widgetStyles, ...rowStyles };

function stopPropagation(event) {
  event.stopPropagation();
}

function ModuleCodePill({ moduleCode }) {
  if (!moduleCode) return null;
  return <Badge tone="muted" className={styles.moduleCodePill}>{moduleCode}</Badge>;
}

function DeadlineTitle({ title }) {
  return <span className={styles.deadlineTitle}>{title}</span>;
}

function DeadlineTypePill({ deadlineType }) {
  return <Badge tone="default" className={styles.typePill}>{(deadlineType || 'assessment').toUpperCase()}</Badge>;
}

function DeadlineRowLeft({ deadlineType, moduleCode, title }) {
  return (
    <div className={styles.deadlineRowLeft}>
      <div className={styles.deadlinePills} onClick={stopPropagation} onMouseDown={stopPropagation}>
        <ModuleCodePill moduleCode={moduleCode} />
        <DeadlineTypePill deadlineType={deadlineType} />
      </div>
      <DeadlineTitle title={title} />
    </div>
  );
}

function DeadlineRowRight({ deadline, tier }) {
  return <div className={styles.widgetRowMeta}><DeadlineCountdown dueDate={deadline.start_due_date} tier={tier} showPriority={false} /></div>;
}

function DeadlineRowContent({ tier, moduleCode, deadline, title }) {
  return (
    <>
      <DeadlineRowLeft deadlineType={deadline.deadline_type} moduleCode={moduleCode} title={title} />
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

function DeadlineRow({ deadline, interactiveRows, onSelectDeadline }) {
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
      <DeadlineRowContent tier={tier} moduleCode={deadline.module_code || ''} deadline={deadline} title={deadline.assessment_title || deadline.title || 'Assignment'} />
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

function DeadlineRows({ deadlines, interactiveRows, onSelectDeadline }) {
  return deadlines.map((deadline) => (
    <DeadlineRow
      key={deadline.id}
      deadline={deadline}
      interactiveRows={interactiveRows}
      onSelectDeadline={onSelectDeadline}
    />
  ));
}

function ExpandedDeadlineRows({ expanded, extra, interactiveRows, onSelectDeadline }) {
  if (!expanded) return null;
  return (
    <Motion.div className={styles.expandableRows} variants={expandBodyVariants} initial="collapsed" animate="expanded" exit="collapsed" layout>
      <Motion.div className={styles.expandableRowsInner} initial="hidden" animate="visible" variants={listVariants}>
        <DeadlineRows deadlines={extra} interactiveRows={interactiveRows} onSelectDeadline={onSelectDeadline} />
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

function DeadlineList({ initial, extra, expanded, interactiveRows, onSelectDeadline }) {
  return (
    <Motion.div className={styles.widgetList} initial="hidden" animate="visible" variants={listVariants} layout>
      <DeadlineRows deadlines={initial} interactiveRows={interactiveRows} onSelectDeadline={onSelectDeadline} />
      <AnimatePresence initial={false}>
        <ExpandedDeadlineRows expanded={expanded} extra={extra} interactiveRows={interactiveRows} onSelectDeadline={onSelectDeadline} />
      </AnimatePresence>
    </Motion.div>
  );
}

function WidgetBody({ sorted, initial, extra, expanded, setExpanded, emptyMessage, emptySub, interactiveRows, onSelectDeadline, renderEmpty }) {
  if (sorted.length === 0) return renderEmpty ? renderEmpty() : <EmptyWidget emptyMessage={emptyMessage} emptySub={emptySub} />;
  return (
    <>
      <DeadlineList initial={initial} extra={extra} expanded={expanded} interactiveRows={interactiveRows} onSelectDeadline={onSelectDeadline} />
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

export function UpcomingDeadlinesWidget({ deadlines = [], title = "Upcoming Deadlines", initialShown = 4, embedded = false, interactiveRows = false, onSelectDeadline, onSelectModule, emptyMessage = "No upcoming deadlines", emptySub = "You're all caught up — enjoy the calm.", renderEmpty = null }) {
  if (!Array.isArray(deadlines)) return null;
  const widgetState = useUpcomingDeadlineState(deadlines, initialShown);
  return (
    <Motion.div className={buildWidgetClassName(embedded)} variants={containerVariants} initial="hidden" animate="visible" layout>
      {(widgetState.sorted.length > 0 || !renderEmpty) ? <WidgetHeader icon={AlertCircle} title={title} count={widgetState.sorted.length} styles={styles} /> : null}
      <WidgetBody sorted={widgetState.sorted} initial={widgetState.initial} extra={widgetState.extra} expanded={widgetState.expanded} setExpanded={widgetState.setExpanded} emptyMessage={emptyMessage} emptySub={emptySub} interactiveRows={interactiveRows} onSelectDeadline={onSelectDeadline} renderEmpty={renderEmpty} />
    </Motion.div>
  );
}
