/*
 * Upcoming-deadlines widget with expandable row list.
 */

import { useMemo, useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import DeadlineCountdown from '../../common/DeadlineCountdown/DeadlineCountdown';
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

function ModuleCodeButton({ moduleCode, deadline, onSelectModule }) {
  return <button type="button" className={styles.moduleCodePill} onClick={(event) => handleModuleSelect(event, moduleCode, deadline, onSelectModule)}>{moduleCode}</button>;
}

function handleModuleSelect(event, moduleCode, deadline, onSelectModule) {
  event.stopPropagation();
  onSelectModule({
    code: moduleCode,
    id: deadline.module_id ?? deadline.module ?? null,
  });
}

function ModuleCodeLink({ moduleCode }) {
  return <Link to={`/modules?code=${encodeURIComponent(moduleCode)}`} className={styles.moduleCodePill} onClick={stopPropagation}>{moduleCode}</Link>;
}

function stopPropagation(event) {
  event.stopPropagation();
}

function ModuleCodePill({ moduleCode, deadline, onSelectModule }) {
  if (!moduleCode) return null;
  if (onSelectModule) return <ModuleCodeButton moduleCode={moduleCode} deadline={deadline} onSelectModule={onSelectModule} />;
  return <ModuleCodeLink moduleCode={moduleCode} />;
}

function DeadlineTitle({ title }) {
  return <span className={styles.deadlineTitle}>{title}</span>;
}

function DeadlineTypePill({ deadlineType }) {
  return <span className={styles.typePill}>{(deadlineType || 'assessment').toUpperCase()}</span>;
}

function DeadlineRowLeft({ deadline, moduleCode, onSelectModule, title }) {
  return (
    <div className={styles.deadlineRowLeft}>
      <div className={styles.deadlinePills}>
        <ModuleCodePill moduleCode={moduleCode} deadline={deadline} onSelectModule={onSelectModule} />
        <DeadlineTypePill deadlineType={deadline.deadline_type} />
      </div>
      <DeadlineTitle title={title} />
    </div>
  );
}

function DeadlineRowRight({ deadline, tier }) {
  return <div className={styles.widgetRowMeta}><DeadlineCountdown dueDate={deadline.start_due_date} tier={tier} showPriority={false} /></div>;
}

function DeadlineRowContent({ tier, moduleCode, deadline, onSelectModule, title }) {
  return (
    <>
      <DeadlineRowLeft deadline={deadline} moduleCode={moduleCode} onSelectModule={onSelectModule} title={title} />
      <DeadlineRowRight deadline={deadline} tier={tier} />
    </>
  );
}

function buildRowClassName(tier, urgentGlow) {
  const base = styles.deadlineRow;
  const overdue = tier === 'overdue' ? styles.rowOverdue : '';
  const critical = tier === 'critical' ? styles.rowCritical : '';
  const glow = urgentGlow ? styles.rowUrgentGlow : '';
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

function DeadlineRow({ deadline, interactiveRows, onSelectDeadline, onSelectModule }) {
  const tier = getUrgencyTier(deadline.start_due_date);
  const urgentGlow = tier === 'overdue' || tier === 'critical';
  return (
    <Motion.div
      className={buildRowClassName(tier, urgentGlow)}
      style={buildRowStyle(tier, interactiveRows)}
      variants={itemVariants}
      {...buildInteractiveProps(interactiveRows, onSelectDeadline, deadline)}
    >
      <DeadlineRowContent tier={tier} moduleCode={deadline.module_code || ''} deadline={deadline} onSelectModule={onSelectModule} title={deadline.assessment_title || deadline.title || 'Assignment'} />
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

function DeadlineRows({ deadlines, interactiveRows, onSelectDeadline, onSelectModule }) {
  return deadlines.map((deadline) => (
    <DeadlineRow
      key={deadline.id}
      deadline={deadline}
      interactiveRows={interactiveRows}
      onSelectDeadline={onSelectDeadline}
      onSelectModule={onSelectModule}
    />
  ));
}

function ExpandedDeadlineRows({ expanded, extra, interactiveRows, onSelectDeadline, onSelectModule }) {
  if (!expanded) return null;
  return (
    <Motion.div className={styles.expandableRows} variants={expandBodyVariants} initial="collapsed" animate="expanded" exit="collapsed">
      <Motion.div className={styles.expandableRowsInner} initial="hidden" animate="visible" variants={listVariants}>
        <DeadlineRows deadlines={extra} interactiveRows={interactiveRows} onSelectDeadline={onSelectDeadline} onSelectModule={onSelectModule} />
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

function DeadlineList({ initial, extra, expanded, interactiveRows, onSelectDeadline, onSelectModule }) {
  return (
    <Motion.div className={styles.widgetList} initial="hidden" animate="visible" variants={listVariants}>
      <DeadlineRows deadlines={initial} interactiveRows={interactiveRows} onSelectDeadline={onSelectDeadline} onSelectModule={onSelectModule} />
      <AnimatePresence initial={false}>
        <ExpandedDeadlineRows expanded={expanded} extra={extra} interactiveRows={interactiveRows} onSelectDeadline={onSelectDeadline} onSelectModule={onSelectModule} />
      </AnimatePresence>
    </Motion.div>
  );
}

function WidgetBody({ sorted, initial, extra, expanded, setExpanded, emptyMessage, emptySub, interactiveRows, onSelectDeadline, onSelectModule }) {
  if (sorted.length === 0) return <EmptyWidget emptyMessage={emptyMessage} emptySub={emptySub} />;
  return (
    <>
      <DeadlineList initial={initial} extra={extra} expanded={expanded} interactiveRows={interactiveRows} onSelectDeadline={onSelectDeadline} onSelectModule={onSelectModule} />
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

export function UpcomingDeadlinesWidget({ deadlines = [], title = "Upcoming Deadlines", initialShown = 4, embedded = false, interactiveRows = false, onSelectDeadline, onSelectModule, emptyMessage = "No upcoming deadlines", emptySub = "You're all caught up — enjoy the calm." }) {
  if (!Array.isArray(deadlines)) return null;
  const widgetState = useUpcomingDeadlineState(deadlines, initialShown);
  return (
    <Motion.div className={buildWidgetClassName(embedded)} variants={containerVariants} initial="hidden" animate="visible">
      <WidgetHeader icon={AlertCircle} title={title} count={widgetState.sorted.length} styles={styles} />
      <WidgetBody sorted={widgetState.sorted} initial={widgetState.initial} extra={widgetState.extra} expanded={widgetState.expanded} setExpanded={widgetState.setExpanded} emptyMessage={emptyMessage} emptySub={emptySub} interactiveRows={interactiveRows} onSelectDeadline={onSelectDeadline} onSelectModule={onSelectModule} />
    </Motion.div>
  );
}
