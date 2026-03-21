/*
 * Upcoming-deadlines widget with expandable row list.
 */
<<<<<<< HEAD

import { useMemo, useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import Badge from '../../common/badge/Badge';
import DeadlineCountdown from '../../common/deadline_countdown/DeadlineCountdown';
import urgentGlowStyles from '../../common/urgent_glow/UrgentGlow.module.css';
=======
import { useMemo, useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertCircle, Clock } from 'lucide-react';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import {
  containerVariants,
  expandBodyVariants,
  itemVariants,
  listVariants,
} from '../shared/widgetVariants.js';
<<<<<<< HEAD
import WidgetHeader from '../../common/widget_header/WidgetHeader';
import {
  ShowMoreButton,
} from '../shared/widgetParts.jsx';
import widgetStyles from "../../../pages/modules/DashboardWidgets.module.css";
import rowStyles from "../../../pages/modules/DashboardRows.module.css";
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
=======
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
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
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

<<<<<<< HEAD
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
=======
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
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    </Motion.div>
  );
}

<<<<<<< HEAD
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
=======
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
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    <DeadlineRow
      key={deadline.id}
      deadline={deadline}
      interactiveRows={interactiveRows}
      onSelectDeadline={onSelectDeadline}
<<<<<<< HEAD
=======
      onSelectModule={onSelectModule}
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    />
  ));
}

<<<<<<< HEAD
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
=======
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
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    </div>
  );
}

<<<<<<< HEAD
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
=======
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
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    </>
  );
}

<<<<<<< HEAD
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

export function UpcomingDeadlinesWidget({ deadlines = [], title = "Upcoming Deadlines", initialShown = 4, embedded = false, interactiveRows = false, onSelectDeadline, emptyMessage = "No upcoming deadlines", emptySub = "You're all caught up — enjoy the calm.", renderEmpty = null }) {
  const safeDeadlines = Array.isArray(deadlines) ? deadlines : [];
  const widgetState = useUpcomingDeadlineState(safeDeadlines, initialShown);

  if (!Array.isArray(deadlines)) return null;
  return (
    <Motion.div className={buildWidgetClassName(embedded)} variants={containerVariants} initial="hidden" animate="visible" layout>
      {(widgetState.sorted.length > 0 || !renderEmpty) ? <WidgetHeader icon={AlertCircle} title={title} count={widgetState.sorted.length} className={styles.widgetHeader} /> : null}
      <WidgetBody sorted={widgetState.sorted} initial={widgetState.initial} extra={widgetState.extra} expanded={widgetState.expanded} setExpanded={widgetState.setExpanded} emptyMessage={emptyMessage} emptySub={emptySub} interactiveRows={interactiveRows} onSelectDeadline={onSelectDeadline} renderEmpty={renderEmpty} />
=======
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
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    </Motion.div>
  );
}
