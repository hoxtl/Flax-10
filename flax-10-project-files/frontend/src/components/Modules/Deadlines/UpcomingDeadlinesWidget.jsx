/*
 * Upcoming-deadlines widget with expandable row list.
 */
import { useMemo, useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertCircle, Clock } from 'lucide-react';
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

import dashStyles from '../../../pages/Modules/MyModulesDashboard.module.css';
import rowStyles from '../../../pages/Modules/DashboardRows.module.css';
import {
  DEADLINE_TIER_ORDER,
  PRIORITY_PILL,
  TIER_ACCENT,
  getDaysLabel,
  getDueStatusClass,
  getUrgencyTier,
} from './upcomingDeadlinesUtils';

const styles = { ...dashStyles, ...rowStyles };

function ModuleCodeButton({ moduleCode, deadline, onSelectModule }) {
  return (
    <button
      type="button"
      className={styles.moduleCodePill}
      onClick={(e) => {
        e.stopPropagation();
        onSelectModule({ code: moduleCode, id: deadline.module_id ?? deadline.module ?? null });
      }}
    >
      {moduleCode}
    </button>
  );
}

function ModuleCodeLink({ moduleCode }) {
  return (
    <Link
      to={`/modules?code=${encodeURIComponent(moduleCode)}`}
      className={styles.moduleCodePill}
      onClick={(e) => e.stopPropagation()}
    >
      {moduleCode}
    </Link>
  );
}

function ModuleCodePill({ moduleCode, deadline, onSelectModule }) {
  if (!moduleCode) return null;
  if (onSelectModule) return <ModuleCodeButton moduleCode={moduleCode} deadline={deadline} onSelectModule={onSelectModule} />;
  return <ModuleCodeLink moduleCode={moduleCode} />;
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

function buildRowClassName(tier, urgentGlow) {
  const base = styles.deadlineRow;
  const overdue = tier === 'overdue' ? styles.rowOverdue : '';
  const critical = tier === 'critical' ? styles.rowCritical : '';
  const glow = urgentGlow ? styles.rowUrgentGlow : '';
  return `${base} ${overdue} ${critical} ${glow}`;
}

function DeadlineRowContent({ tier, moduleCode, deadline, onSelectModule, title, pill, dueCls, daysLabel }) {
  return (
    <>
      <div className={styles.deadlineRowLeft}>
        <div className={styles.deadlinePills}>
          <ModuleCodePill moduleCode={moduleCode} deadline={deadline} onSelectModule={onSelectModule} />
          <span className={styles.typePill}>{(deadline.deadline_type || 'assessment').toUpperCase()}</span>
        </div>
        <span className={styles.deadlineTitle}>{title}</span>
      </div>
      {pill ? <span className={`${styles.priorityPill} ${styles[pill.cls]}`}>{pill.marks} {pill.label}</span> : null}
      <span className={`${styles.daysLabel} ${styles[dueCls]}`}>
        {(tier === 'overdue' || tier === 'critical' || tier === 'urgent') ? <Clock size={11} className={styles.duePillIcon} /> : null}
        {daysLabel}
      </span>
    </>
  );
}

function buildRowStyle(tier, interactiveRows) {
  return { '--deadline-row-accent': TIER_ACCENT[tier], cursor: interactiveRows ? 'pointer' : 'default' };
}

function DeadlineRow({ deadline, interactiveRows, onSelectDeadline, onSelectModule }) {
  const tier = getUrgencyTier(deadline.start_due_date);
  const props = buildInteractiveProps(interactiveRows, onSelectDeadline, deadline);

  return (
    <Motion.div className={buildRowClassName(tier, tier === 'overdue' || tier === 'critical')} style={buildRowStyle(tier, interactiveRows)} variants={itemVariants} {...props}>
      <DeadlineRowContent tier={tier} moduleCode={deadline.module_code || ''} deadline={deadline} onSelectModule={onSelectModule} title={deadline.assessment_title || deadline.title || 'Assignment'} pill={PRIORITY_PILL[tier]} dueCls={getDueStatusClass(tier)} daysLabel={getDaysLabel(deadline.start_due_date)} />
    </Motion.div>
  );
}

function sortDeadlines(deadlines) {
  const list = [...(deadlines || [])].filter((d) => d?.start_due_date);
  list.sort((a, b) => {
    const aTier = getUrgencyTier(a.start_due_date);
    const bTier = getUrgencyTier(b.start_due_date);
    if (DEADLINE_TIER_ORDER[aTier] !== DEADLINE_TIER_ORDER[bTier]) {
      return DEADLINE_TIER_ORDER[aTier] - DEADLINE_TIER_ORDER[bTier];
    }
    return new Date(a.start_due_date).getTime() - new Date(b.start_due_date).getTime();
  });
  return list;
}

function DeadlineList({ rows, interactiveRows, onSelectDeadline, onSelectModule }) {
  return rows.map((deadline) => (
    <DeadlineRow
      key={deadline.id}
      deadline={deadline}
      interactiveRows={interactiveRows}
      onSelectDeadline={onSelectDeadline}
      onSelectModule={onSelectModule}
    />
  ));
}

function ExpandableSection({ expanded, extra, interactiveRows, onSelectDeadline, onSelectModule }) {
  return (
    <AnimatePresence initial={false}>
      {expanded ? (
        <Motion.div className={styles.expandableRows} variants={expandBodyVariants} initial="collapsed" animate="expanded" exit="collapsed">
          <Motion.div className={styles.expandableRowsInner} initial="hidden" animate="visible" variants={listVariants}>
            <DeadlineList rows={extra} interactiveRows={interactiveRows} onSelectDeadline={onSelectDeadline} onSelectModule={onSelectModule} />
          </Motion.div>
        </Motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function EmptyState({ message, sub }) {
  return (
    <div className={styles.emptyState}>
      <p className={styles.emptyMessage}>{message}</p>
      <p className={styles.emptySub}>{sub}</p>
    </div>
  );
}

function WidgetContent({ sorted, initialShown, expanded, setExpanded, interactiveRows, onSelectDeadline, onSelectModule, emptyMessage, emptySub }) {
  if (sorted.length === 0) return <EmptyState message={emptyMessage} sub={emptySub} />;
  const initial = sorted.slice(0, initialShown);
  const extra = sorted.slice(initialShown);

  return (
    <>
      <Motion.div className={styles.widgetList} initial="hidden" animate="visible" variants={listVariants}>
        <DeadlineList rows={initial} interactiveRows={interactiveRows} onSelectDeadline={onSelectDeadline} onSelectModule={onSelectModule} />
        <ExpandableSection expanded={expanded} extra={extra} interactiveRows={interactiveRows} onSelectDeadline={onSelectDeadline} onSelectModule={onSelectModule} />
      </Motion.div>
      {extra.length > 0 ? <ShowMoreButton expanded={expanded} hiddenCount={extra.length} onToggle={() => setExpanded((prev) => !prev)} styles={styles} /> : null}
    </>
  );
}

function getWidgetClassName(embedded) {
  return `${styles.widget} ${embedded ? styles.widgetEmbedded : ''}`;
}

export function UpcomingDeadlinesWidget(props) {
  const { deadlines = [], title = 'Upcoming Deadlines', initialShown = 4, embedded = false } = props;
  const { interactiveRows = false, onSelectDeadline, onSelectModule } = props;
  const { emptyMessage = 'No upcoming deadlines', emptySub = "You're all caught up \u2014 enjoy the calm." } = props;
  const [expanded, setExpanded] = useState(false);
  const sorted = useMemo(() => sortDeadlines(deadlines), [deadlines]);
  if (!Array.isArray(deadlines)) return null;
  return (
    <Motion.div className={getWidgetClassName(embedded)} variants={containerVariants} initial="hidden" animate="visible">
      <WidgetHeader icon={AlertCircle} title={title} count={sorted.length} styles={styles} />
      <WidgetContent sorted={sorted} initialShown={initialShown} expanded={expanded} setExpanded={setExpanded} interactiveRows={interactiveRows} onSelectDeadline={onSelectDeadline} onSelectModule={onSelectModule} emptyMessage={emptyMessage} emptySub={emptySub} />
    </Motion.div>
  );
}
