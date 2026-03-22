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
import styles from "../../../pages/Modules/MyModulesDashboard.module.css";
import {
  DEADLINE_TIER_ORDER,
  TIER_ACCENT,
  getUrgencyTier,
} from "./upcomingDeadlinesUtils";

function ModuleCodePill({ moduleCode, deadline, onSelectModule }) {
  if (!moduleCode) return null;
  if (onSelectModule) {
    return (
      <button
        type="button"
        className={styles.moduleCodePill}
        onClick={(e) => {
          e.stopPropagation();
          onSelectModule({
            code: moduleCode,
            id: deadline.module_id ?? deadline.module ?? null,
          });
        }}
      >
        {moduleCode}
      </button>
    );
  }
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

function DeadlineRowContent({ tier, moduleCode, deadline, onSelectModule, title }) {
  const typeLabel = (deadline.deadline_type || 'assessment').toUpperCase();
  return (
    <>
      <div className={styles.deadlineRowLeft}>
        <div className={styles.deadlinePills}>
          <ModuleCodePill
            moduleCode={moduleCode}
            deadline={deadline}
            onSelectModule={onSelectModule}
          />
          <span className={styles.typePill}>{typeLabel}</span>
        </div>
        <span className={styles.deadlineTitle}>{title}</span>
      </div>
      <div className={styles.widgetRowMeta}>
        <DeadlineCountdown
          dueDate={deadline.start_due_date}
          tier={tier}
          showPriority={false}
        />
      </div>
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
  const interactiveProps = buildInteractiveProps(interactiveRows, onSelectDeadline, deadline);
  return (
    <Motion.div
      className={buildRowClassName(tier, urgentGlow)}
      style={buildRowStyle(tier, interactiveRows)}
      variants={itemVariants}
      {...interactiveProps}
    >
      <DeadlineRowContent
        tier={tier}
        moduleCode={deadline.module_code || ''}
        deadline={deadline}
        onSelectModule={onSelectModule}
        title={deadline.assessment_title || deadline.title || 'Assignment'}
      />
    </Motion.div>
  );
}

export function UpcomingDeadlinesWidget({
  deadlines = [],
  title = "Upcoming Deadlines",
  initialShown = 4,
  embedded = false,
  interactiveRows = false,
  onSelectDeadline,
  onSelectModule,
  emptyMessage = "No upcoming deadlines",
  emptySub = "You're all caught up — enjoy the calm.",
}) {
  const [expanded, setExpanded] = useState(false);

  const sorted = useMemo(() => {
    const list = [...(deadlines || [])].filter(
      (deadline) => deadline?.start_due_date,
    );
    list.sort((a, b) => {
      const aTier = getUrgencyTier(a.start_due_date);
      const bTier = getUrgencyTier(b.start_due_date);
      if (DEADLINE_TIER_ORDER[aTier] !== DEADLINE_TIER_ORDER[bTier]) {
        return DEADLINE_TIER_ORDER[aTier] - DEADLINE_TIER_ORDER[bTier];
      }
      return (
        new Date(a.start_due_date).getTime() -
        new Date(b.start_due_date).getTime()
      );
    });
    return list;
  }, [deadlines]);

  if (!Array.isArray(deadlines)) return null;

  const initial = sorted.slice(0, initialShown);
  const extra = sorted.slice(initialShown);
  const hiddenCount = extra.length;

  return (
    <Motion.div
      className={`${styles.widget} ${embedded ? styles.widgetEmbedded : ""}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <WidgetHeader icon={AlertCircle} title={title} count={sorted.length} styles={styles} />
      {sorted.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyMessage}>{emptyMessage}</p>
          <p className={styles.emptySub}>{emptySub}</p>
        </div>
      ) : (
        <>
          <Motion.div
            className={styles.widgetList}
            initial="hidden"
            animate="visible"
            variants={listVariants}
          >
            {initial.map((deadline) => (
              <DeadlineRow
                key={deadline.id}
                deadline={deadline}
                interactiveRows={interactiveRows}
                onSelectDeadline={onSelectDeadline}
                onSelectModule={onSelectModule}
              />
            ))}
            <AnimatePresence initial={false}>
              {expanded ? (
                <Motion.div
                  className={styles.expandableRows}
                  variants={expandBodyVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                >
                  <Motion.div
                    className={styles.expandableRowsInner}
                    initial="hidden"
                    animate="visible"
                    variants={listVariants}
                  >
                    {extra.map((deadline) => (
                      <DeadlineRow
                        key={deadline.id}
                        deadline={deadline}
                        interactiveRows={interactiveRows}
                        onSelectDeadline={onSelectDeadline}
                        onSelectModule={onSelectModule}
                      />
                    ))}
                  </Motion.div>
                </Motion.div>
              ) : null}
            </AnimatePresence>
          </Motion.div>
          {hiddenCount > 0 ? (
            <ShowMoreButton
              expanded={expanded}
              hiddenCount={hiddenCount}
              onToggle={() => setExpanded((prev) => !prev)}
              styles={styles}
            />
          ) : null}
        </>
      )}
    </Motion.div>
  );
}
